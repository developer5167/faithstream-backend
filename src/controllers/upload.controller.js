const uploadService = require('../services/upload.service');

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

    console.log('Upload request:', req.body);

    // Validate required fields
    if (!fileName || !contentType || !uploadType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: {
          fileName: 'string (e.g., "image.jpg")',
          contentType: 'string (e.g., "image/jpeg")',
          uploadType: 'string (e.g., "album_cover", "song_cover", "user_profile")'
        },
        validUploadTypes: ['album_cover', 'song_cover', 'song_audio', 'artist_profile', 'user_profile', 'admin_upload', 'artist_selfie_video'],
        note: 'resourceId is required for album_cover, song_cover, and song_audio'
      });
    }

    // Validate uploadType
    const validUploadTypes = ['album_cover', 'song_cover', 'song_audio', 'artist_profile', 'user_profile', 'admin_upload', 'artist_selfie_video'];
    if (!validUploadTypes.includes(uploadType)) {
      return res.status(400).json({
        error: `Invalid uploadType: "${uploadType}". Valid types are: ${validUploadTypes.join(', ')}`
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
