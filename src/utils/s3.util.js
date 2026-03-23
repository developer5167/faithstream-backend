const AWS = require('aws-sdk');
require('../config/env');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.getSignedUrl = (key) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Expires: 60 * 60 * 24, // 24 hours (Allows gapless Flutter playback queues without expiring)
  });
};

exports.getObjectAsString = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };
  const data = await s3.getObject(params).promise();
  return data.Body.toString('utf-8');
};

/**
 * Delete an object from S3 using its full public URL
 * @param {string} url - The full public URL of the S3 object
 */
exports.deleteFromS3ByUrl = async (url) => {
  if (!url) return;
  try {
    const bucketUrlBase = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!url.startsWith(bucketUrlBase)) {
      console.log(`[S3 Util] URL ${url} is not from standard bucket format. Skipping.`);
      return;
    }
    const key = url.replace(bucketUrlBase, '');
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET,
      Key: key
    }).promise();
    console.log(`[S3 Util] Deleted Object: ${key}`);
  } catch (err) {
    console.error(`[S3 Util] Error deleting ${url} from S3:`, err);
  }
};

/**
 * Generate presigned URL for uploading files to S3
 * @param {string} key - The S3 key (file path)
 * @param {string} contentType - The file content type (e.g., 'image/jpeg')
 * @returns {string} - Presigned URL for upload
 */
exports.getPresignedUploadUrl = (key, contentType) => {
  return s3.getSignedUrl('putObject', {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    ContentType: contentType,
    // ✅ SECURITY: Store Content-Disposition on the S3 object permanently.
    // When a browser loads this file (e.g. in an <img> tag), S3 returns:
    //   Content-Disposition: inline
    //   Content-Type: image/jpeg  (<-- exactly what we set)
    // This tells the browser to render it as the declared type, NOT sniff the bytes.
    // Without this, a browser could misinterpret file contents and execute injected scripts.
    ContentDisposition: 'inline',
    Expires: 60 * 5, // 5 minutes
  });
};

/**
 * Generate S3 key with proper folder structure
 * @param {Object} params - Parameters for generating the key
 * @param {string} params.uploadType - Type of upload (album, song, artist_profile, user_profile)
 * @param {string} params.userId - ID of the user uploading
 * @param {string} params.resourceId - ID of the resource (album_id, song_id, etc.)
 * @param {string} params.fileName - Original file name
 * @param {string} params.userRole - Role of the user (ADMIN, ARTIST, USER)
 * @returns {string} - S3 key with proper folder structure
 */
exports.generateS3Key = ({ uploadType, userId, resourceId, fileName, userRole }) => {
  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop();
  
  // Differentiate between development and production
  const envPrefix = process.env.NODE_ENV === 'development' ? 'development' : 'live';
  
  let keyPath = '';

  switch (uploadType) {
    case "album_cover":
      // {env}/albums/{albumId}/album_cover_{timestamp}.{ext}
      keyPath = `albums/${resourceId}/album_cover_${timestamp}.${fileExtension}`;
      break;
    
    case "song_audio":
      // {env}/songs/{songId}/audio_{timestamp}.{ext}
      keyPath = `songs/${resourceId}/audio_${timestamp}.${fileExtension}`;
      break;
    
    case "song_cover":
      // {env}/songs/{songId}/cover_{timestamp}.{ext}
      keyPath = `songs/${resourceId}/cover_${timestamp}.${fileExtension}`;
      break;
    
    case "artist_profile":
      // {env}/profiles/artist/{userId}/{filename}_{timestamp}.{ext}
      keyPath = `profiles/artist/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
    
    case "artist_selfie_video":
      // {env}/profiles/artist/{userId}/selfie_videos/selfie_video_{timestamp}.{ext}
      keyPath = `profiles/artist/${userId}/selfie_videos/selfie_video_{timestamp}.${fileExtension}`;
      break;
    
    case "user_profile":
      // {env}/profiles/user/{userId}/{filename}_{timestamp}.{ext}
      keyPath = `profiles/user/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
    
    case "admin_upload":
      // {env}/admin/{userId}/{filename}_{timestamp}.{ext}
      keyPath = `admin/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
    
    case "ad_image":
      // {env}/ads/images/{userId}/{filename}_{timestamp}.{ext}
      keyPath = `ads/images/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
    
    case "ad_video":
      // {env}/ads/videos/{userId}/{filename}_{timestamp}.{ext}
      keyPath = `ads/videos/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
    
    default:
      // {env}/general/{userRole}/{userId}/{filename}_{timestamp}.{ext}
      const role = (userRole || 'user').toLowerCase();
      keyPath = `general/${role}/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
      break;
  }

  return `${envPrefix}/${keyPath}`;
};

/**
 * Upload a database backup file to S3
 * @param {string} filePath - Local path to the backup file
 * @param {string} fileName - Name of the file
 * @returns {Promise<string>} - The S3 key of the uploaded backup
 */
exports.uploadDatabaseBackup = async (filePath, fileName) => {
  const fs = require('fs');
  const key = `backups/production/${fileName}`;
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: fileStream,
  };

  await s3.upload(uploadParams).promise();
  return key;
};

/**
 * List all available database backups in S3
 * @returns {Promise<Array>} - Array of backup objects containing Key and LastModified
 */
exports.listDatabaseBackups = async () => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Prefix: 'backups/production/',
  };

  const data = await s3.listObjectsV2(params).promise();
  // Sort descending (newest first)
  const sortedFiles = (data.Contents || [])
    .filter(obj => obj.Key.endsWith('.backup'))
    .sort((a, b) => b.LastModified - a.LastModified);
    
  return sortedFiles;
};

/**
 * Download a database backup from S3
 * @param {string} key - S3 Key of the backup file
 * @param {string} destinationPath - Local path to save the downloaded file
 * @returns {Promise<void>}
 */
exports.downloadDatabaseBackup = (key, destinationPath) => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    };

    const fileStream = fs.createWriteStream(destinationPath);
    const s3Stream = s3.getObject(params).createReadStream();

    s3Stream.on('error', (err) => {
      reject(err);
    });

    s3Stream.pipe(fileStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('close', () => {
        resolve();
      });
  });
};
