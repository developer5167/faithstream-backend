const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.getSignedUrl = (key) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Expires: 60 * 5, // 5 minutes
  });
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
  
  switch (uploadType) {
    case "album_cover":
      // albums/{albumId}/album_cover_{timestamp}.{ext}
      return `albums/${resourceId}/album_cover_${timestamp}.${fileExtension}`;
    
    case "song_audio":
      // songs/{songId}/audio_{timestamp}.{ext}
      return `songs/${resourceId}/audio_${timestamp}.${fileExtension}`;
    
    case "song_cover":
      // songs/{songId}/cover_{timestamp}.{ext}
      return `songs/${resourceId}/cover_${timestamp}.${fileExtension}`;
    
    case "artist_profile":
      // profiles/artist/{userId}/{filename}_{timestamp}.{ext}
      return `profiles/artist/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
    
    case "artist_selfie_video":
      // profiles/artist/{userId}/selfie_videos/selfie_video_{timestamp}.{ext}
      return `profiles/artist/${userId}/selfie_videos/selfie_video_${timestamp}.${fileExtension}`;
    
    case "user_profile":
      // profiles/user/{userId}/{filename}_{timestamp}.{ext}
      return `profiles/user/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
    
    case "admin_upload":
      // admin/{userId}/{filename}_{timestamp}.{ext}
      return `admin/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
    
    default:
      // general/{userRole}/{userId}/{filename}_{timestamp}.{ext}
      const role = (userRole || 'user').toLowerCase();
      return `general/${role}/${userId}/${fileName.split('.')[0]}_${timestamp}.${fileExtension}`;
  }
};
