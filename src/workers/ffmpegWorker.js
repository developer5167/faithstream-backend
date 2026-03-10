const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const AWS = require('aws-sdk');
const redisClient = require('../config/redis');
const pool = require('../config/db');
require('dotenv').config();

const execPromise = util.promisify(exec);

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const BATCH_INTERVAL_MS = 5000; // Check every 5 seconds
const TMP_DIR = path.join(__dirname, '../../tmp_hls'); // Outside src

const downloadFileFromS3 = async (key, localPath) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };
  const stream = s3.getObject(params).createReadStream();
  const file = fs.createWriteStream(localPath);
  
  return new Promise((resolve, reject) => {
    stream.pipe(file);
    stream.on('error', reject);
    file.on('finish', resolve);
    file.on('error', reject);
  });
};

const uploadFileToS3 = async (localPath, key, contentType) => {
  const fileContent = fs.readFileSync(localPath);
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    // Note: Do NOT set ACL to public-read if Bucket prevents it, 
    // we use presigned URLs or just rely on bucket policies
  };
  return s3.upload(params).promise();
};

const processFfmpegJob = async () => {
    try {
        // Pop ONE job from the queue (we process linearly to protect CPU)
        const rawJob = await redisClient.rPop('hls_transcoding_queue');
        if (!rawJob) return;

        const job = JSON.parse(rawJob);
        const { songId, audio_url } = job;

        console.log(`[FFmpeg Worker] Picked up song ID: ${songId} for transcoding.`);

        // Create isolated temp directory for this job
        const jobTmpDir = path.join(TMP_DIR, songId);
        if (!fs.existsSync(jobTmpDir)) {
            fs.mkdirSync(jobTmpDir, { recursive: true });
        }

        const ext = path.extname(audio_url) || '.mp3';
        const localInputFile = path.join(jobTmpDir, `input${ext}`);
        
        try {
            console.log(`[FFmpeg Worker] Downloading ${audio_url} from S3...`);
            
            // audio_url is often a full public S3 link: https://bucket.s3.region.amazonaws.com/songs/123/file.mp3
            // We must extract only the "Key" (e.g. songs/123/file.mp3) for the AWS SDK to work securely
            let s3Key = audio_url;
            const bucketUrlBase = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
            if (audio_url.startsWith(bucketUrlBase)) {
               s3Key = audio_url.replace(bucketUrlBase, '');
            } else if (audio_url.includes('amazonaws.com/')) {
               // Fallback for differently formatted AWS urls
               s3Key = audio_url.substring(audio_url.indexOf('amazonaws.com/') + 14);
            }

            await downloadFileFromS3(s3Key, localInputFile);
            console.log(`[FFmpeg Worker] Download complete. Starting FFmpeg HLS conversion...`);

            // Transcode into 5-second TS chunks
            const m3u8Filename = 'index.m3u8';
            const localM3u8Path = path.join(jobTmpDir, m3u8Filename);
            
            // Adaptive Bitrate / HLS Generation
            // -codec:a aac -b:a 128k ensures standard mobile audio format
            // -hls_time 5 means chunks of 5 seconds each
            const ffmpegCmd = `ffmpeg -y -i "${localInputFile}" -codec:a aac -b:a 128k -f hls -hls_time 5 -hls_playlist_type vod -hls_segment_filename "${jobTmpDir}/segment_%03d.ts" "${localM3u8Path}"`;
            
            await execPromise(ffmpegCmd);
            console.log(`[FFmpeg Worker] Transcoding finished. Uploading chunks to S3...`);

            // Read the generated files (1 m3u8 and N ts files)
            const files = fs.readdirSync(jobTmpDir);
            const uploadPromises = [];
            const s3BaseFolder = `songs/${songId}/hls_${Date.now()}`;
            const m3u8S3Key = `${s3BaseFolder}/${m3u8Filename}`;

            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
                    const filePath = path.join(jobTmpDir, file);
                    const s3Key = `${s3BaseFolder}/${file}`;
                    const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T';
                    
                    uploadPromises.push(uploadFileToS3(filePath, s3Key, contentType));
                }
            }

            // Upload all HLS files concurrently to S3
            await Promise.all(uploadPromises);
            console.log(`[FFmpeg Worker] Uploaded ${uploadPromises.length} files successfully.`);

            // Update Database: Map the new HLS playlist as the primary processed URL!
            await pool.query(
                `UPDATE songs SET audio_processed_url = $1, status = 'PENDING' WHERE id = $2`,
                [m3u8S3Key, songId]
            );

            console.log(`[FFmpeg Worker] Database updated. Song ${songId} provides native HLS.`);
        } finally {
            // Cleanup local temp files aggressively
            fs.rmSync(jobTmpDir, { recursive: true, force: true });
        }
    } catch (e) {
        console.error('[FFmpeg Worker] Error processing transcoding job:', e);
    }
};

// Start the daemon interval
exports.start = () => {
    console.log('[FFmpeg Worker] Service Daemon Started running every 5 seconds...');
    // Ensure root tmp directory exists
    if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
    }
    // We poll strictly one by one via setTimeout chain or setInterval. 
    // Using setInterval is simple, but if transcoding takes longer than 5s, 
    // we could spawn multiples. Instead, a recursive timeout is safer.
    
    const runWorker = async () => {
        await processFfmpegJob();
        setTimeout(runWorker, BATCH_INTERVAL_MS);
    };
    
    runWorker();
};
