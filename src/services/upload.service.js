const s3Util = require('../utils/s3.util');

/**
 * Generate presigned URL for file upload
 * @param {Object} params - Upload parameters
 * @param {string} params.fileName - Original file name
 * @param {string} params.contentType - File content type
 * @param {string} params.uploadType - Type of upload (album_cover, song_cover, etc.)
 * @param {string} params.userId - ID of the user uploading
 * @param {string} params.resourceId - ID of the resource (optional)
 * @param {string} params.userRole - Role of the user
 * @returns {Object} - Object containing upload URL and S3 key
 */
exports.generatePresignedUrl = ({ fileName, contentType, uploadType, userId, resourceId, userRole }) => {
  // Validate file type for audio
  if (uploadType === 'song_audio') {
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac'];
    if (!allowedAudioTypes.includes(contentType)) {
      throw new Error('Invalid file type. Only MP3, WAV, and FLAC audio files are allowed.');
    }
  }
  
  // Validate file type for images
  else if (uploadType === 'album_cover' || uploadType === 'song_cover' || uploadType === 'artist_profile' || uploadType === 'user_profile') {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedImageTypes.includes(contentType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }
  }

  // Validate file type for videos
  else if (uploadType === 'artist_selfie_video') {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedVideoTypes.includes(contentType)) {
      throw new Error('Invalid file type. Only MP4, MOV, and AVI video files are allowed.');
    }
  }

  // Generate S3 key with proper folder structure
  const s3Key = s3Util.generateS3Key({
    uploadType,
    userId,
    resourceId,
    fileName,
    userRole
  });

  // Generate presigned URL
  const uploadUrl = s3Util.getPresignedUploadUrl(s3Key, contentType);

  // Generate the public URL (without query params)
  const publicUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

  return {
    uploadUrl,
    s3Key,
    publicUrl
  };
};
