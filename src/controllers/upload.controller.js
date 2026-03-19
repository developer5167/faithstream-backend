const uploadService = require('../services/upload.service');
const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');

/**
 * Generate presigned URL for file upload
 * POST /api/upload/presigned-url
 * Body: {
 *   fileName: string,
 *   contentType: string,
 *   uploadType: 'album_cover' | 'song_cover' | 'song_audio' | 'artist_profile' | 'user_profile' | 'admin_upload',
 *   resourceId?: string (required for album_cover, song_cover, song_audio)
 * }
 */
exports.getPresignedUrl = async (req, res) => {
  try {
    const { fileName, contentType, uploadType, resourceId } = req.body;
    // Validate required fields
    if (!fileName || !contentType || !uploadType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: {
          fileName: 'string (e.g., "image.jpg")',
          contentType: 'string (e.g., "image/jpeg")',
          uploadType: 'string (e.g., "album_cover", "song_cover", "ad_image")'
        },
        validUploadTypes: ['album_cover', 'song_cover', 'song_audio', 'artist_profile', 'user_profile', 'admin_upload', 'artist_selfie_video', 'ad_image', 'ad_video'],
        note: 'resourceId is required for album_cover, song_cover, and song_audio'
      });
    }

    // Validate uploadType
    const validUploadTypes = ['album_cover', 'song_cover', 'song_audio', 'artist_profile', 'user_profile', 'admin_upload', 'artist_selfie_video', 'ad_image', 'ad_video'];
    if (!validUploadTypes.includes(uploadType)) {
      return res.status(400).json({
        error: `Invalid uploadType: "${uploadType}". Valid types are: ${validUploadTypes.join(', ')}`
      });
    }

    // ✅ Content-Type whitelist — prevents attackers uploading HTML/JS phishing files to our S3 bucket.
    // This list exactly matches what the Flutter app and Advertiser Web legitimately upload.
    const ALLOWED_CONTENT_TYPES = [
      // Images
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      // Audio
      'audio/mpeg',       // .mp3
      'audio/wav',        // .wav
      'audio/flac',       // .flac
      'audio/mp4',        // .m4a
      'audio/aac',        // .aac
      'audio/x-m4a',      // .m4a (iOS variant)
      'audio/ogg',        // .ogg
      // Video
      'video/mp4',        // .mp4
      'video/quicktime',  // .mov (iOS)
      'video/x-msvideo',  // .avi
      'video/webm',       // .webm
      // Generic binary (fallback used by Flutter for unrecognised extensions)
      'application/octet-stream',
    ];

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({
        error: `File type "${contentType}" is not allowed. Only images, audio, and video files are accepted.`
      });
    }

    // Validate resourceId for uploads that require it
    const requiresResourceId = ['album_cover', 'song_cover', 'song_audio'];
    if (requiresResourceId.includes(uploadType) && (!resourceId || resourceId.trim() === '')) {
      return res.status(400).json({
        error: `resourceId is required for uploadType "${uploadType}". Please provide the ${uploadType === 'album_cover' ? 'album' : 'song'} ID.`
      });
    }

    // Get user info from auth middleware
    const userId = req.user.id;
    const userRole = req.user.role;

    // Helper to check if string is a valid UUID
    const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    // IDOR check: verify ownership of resourceId
    if (!req.user.is_admin) {
      if (uploadType === 'album_cover') {
        if (isValidUUID(resourceId)) {
          const album = await albumRepo.findById(resourceId);
          if (!album || album.artist_user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to upload to this album' });
          }
        }
      } else if (uploadType === 'song_cover' || uploadType === 'song_audio') {
        if (isValidUUID(resourceId)) {
          const song = await songRepo.getSongById(resourceId);
          if (!song || song.artist_user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to upload to this song' });
          }
        }
      }
    }

    // Generate presigned URL
    const result = uploadService.generatePresignedUrl({
      fileName,
      contentType,
      uploadType,
      userId,
      resourceId,
      userRole
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to generate presigned URL'
    });
  }
};
