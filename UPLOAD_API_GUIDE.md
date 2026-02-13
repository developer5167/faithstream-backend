# Upload API Implementation Guide

## ✅ FIXED: Upload Endpoint Now Working!

The "Cannot POST /api/upload/presigned-url" error has been resolved. All routes now properly include the `/api` prefix.

### What Was Fixed
1. ✅ Created upload controller, service, and routes
2. ✅ Added `/api` prefix to all backend routes
3. ✅ Implemented proper S3 folder structure for organized uploads
4. ✅ Created Flutter UploadService for mobile app
5. ✅ Updated Flutter app config to use `/api` prefix

---

## Backend Implementation ✅

The upload endpoint has been implemented with proper S3 folder structure.

### Endpoint
```
POST /api/upload/presigned-url
```

### Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Request Body
```json
{
  "fileName": "album-cover.jpg",
  "contentType": "image/jpeg",
  "uploadType": "album_cover",
  "resourceId": "123"
}
```

### Upload Types
- `album_cover` - Album cover images (requires resourceId = album_id)
- `song_cover` - Song cover images (requires resourceId = song_id)
- `song_audio` - Song audio files (requires resourceId = song_id)
- `artist_profile` - Artist profile pictures
- `user_profile` - User profile pictures
- `admin_upload` - General admin uploads

### Response
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://bucket.s3.region.amazonaws.com/path?presigned-params",
    "s3Key": "albums/123/cover_1707235200000.jpg",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/albums/123/cover_1707235200000.jpg"
  }
}
```

### S3 Folder Structure
Files are organized in S3 with proper folder structure:

- **Album covers**: `albums/{albumId}/cover_{timestamp}.{ext}`
- **Song covers**: `songs/{songId}/cover_{timestamp}.{ext}`
- **Song audio**: `songs/{songId}/audio_{timestamp}.{ext}`
- **Artist profiles**: `artists/{artistId}/profile_{timestamp}.{ext}`
- **User profiles**: `users/{userId}/profile_{timestamp}.{ext}`
- **Admin uploads**: `admin/{resourceType}/{resourceId}/{filename}_{timestamp}.{ext}`

---

## React Admin Panel Implementation

### Step 1: API Service Setup

```javascript
// services/uploadService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

class UploadService {
  /**
   * Upload file to S3 with proper folder structure
   * @param {File} file - The file to upload
   * @param {string} uploadType - Type of upload (album_cover, song_cover, etc.)
   * @param {string} resourceId - ID of the resource (album_id, song_id, etc.)
   * @param {function} onProgress - Progress callback (0-100)
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadFile(file, uploadType, resourceId = null, onProgress = null) {
    try {
      // Get auth token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Step 1: Get presigned URL from backend
      const presignedResponse = await axios.post(
        `${API_BASE_URL}/upload/presigned-url`,
        {
          fileName: file.name,
          contentType: file.type,
          uploadType: uploadType,
          resourceId: resourceId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!presignedResponse.data.success) {
        throw new Error('Failed to get presigned URL');
      }

      const { uploadUrl, publicUrl } = presignedResponse.data.data;

      // Step 2: Upload file directly to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });

      // Step 3: Return public URL
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Failed to upload file'
      );
    }
  }

  /**
   * Upload album cover
   */
  async uploadAlbumCover(file, albumId, onProgress = null) {
    return this.uploadFile(file, 'album_cover', albumId, onProgress);
  }

  /**
   * Upload song cover
   */
  async uploadSongCover(file, songId, onProgress = null) {
    return this.uploadFile(file, 'song_cover', songId, onProgress);
  }

  /**
   * Upload song audio
   */
  async uploadSongAudio(file, songId, onProgress = null) {
    return this.uploadFile(file, 'song_audio', songId, onProgress);
  }
}

export default new UploadService();
```

### Step 2: React Component Example

```jsx
// components/AlbumCoverUpload.jsx
import React, { useState } from 'react';
import uploadService from '../services/uploadService';

const AlbumCoverUpload = ({ albumId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!albumId) {
      setError('Album ID is required');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const publicUrl = await uploadService.uploadAlbumCover(
        selectedFile,
        albumId,
        (percent) => setProgress(percent)
      );

      console.log('Upload successful! Public URL:', publicUrl);
      
      // Call parent callback with the URL
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setProgress(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="album-cover-upload">
      <h3>Upload Album Cover</h3>

      <div className="upload-area">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
          id="album-cover-input"
        />
        
        <label htmlFor="album-cover-input" className="file-input-label">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="preview-image" />
          ) : (
            <div className="placeholder">
              <span>Click to select album cover</span>
              <small>PNG, JPG, WEBP (max 5MB)</small>
            </div>
          )}
        </label>
      </div>

      {selectedFile && (
        <div className="file-info">
          <p>Selected: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="upload-button"
      >
        {uploading ? 'Uploading...' : 'Upload Cover'}
      </button>
    </div>
  );
};

export default AlbumCoverUpload;
```

### Step 3: Usage in Admin Form

```jsx
// pages/admin/CreateAlbum.jsx
import React, { useState } from 'react';
import AlbumCoverUpload from '../../components/AlbumCoverUpload';
import api from '../../services/api';

const CreateAlbum = () => {
  const [formData, setFormData] = useState({
    artist_user_id: '',
    title: '',
    description: '',
    language: 'English',
    release_type: 'ALBUM',
    cover_image_url: '', // Will be set by upload
  });
  const [albumId, setAlbumId] = useState(null);

  const handleCreateAlbum = async () => {
    try {
      // First create album without cover
      const response = await api.post('/albums/admin/create-for-artist', {
        ...formData,
        cover_image_url: 'temp', // Temporary value
      });

      const createdAlbumId = response.data.id;
      setAlbumId(createdAlbumId);
      
      alert('Album created! Now upload the cover image.');
    } catch (error) {
      console.error('Failed to create album:', error);
    }
  };

  const handleCoverUploadComplete = async (publicUrl) => {
    try {
      // Update album with actual cover URL
      await api.put(`/albums/${albumId}`, {
        cover_image_url: publicUrl,
      });

      alert('Album cover uploaded successfully!');
    } catch (error) {
      console.error('Failed to update album cover:', error);
    }
  };

  return (
    <div className="create-album-page">
      <h2>Create Album for Artist</h2>

      {/* Album form fields */}
      <form>
        {/* ... other form fields ... */}
        
        <button type="button" onClick={handleCreateAlbum}>
          Create Album
        </button>
      </form>

      {/* Show upload component after album is created */}
      {albumId && (
        <AlbumCoverUpload
          albumId={albumId}
          onUploadComplete={handleCoverUploadComplete}
        />
      )}
    </div>
  );
};

export default CreateAlbum;
```

---

## Flutter App Implementation ✅

The Flutter upload service has been created at:
`faith_stream_music_app/lib/services/upload_service.dart`

### Usage Example

```dart
import 'package:faith_stream_music_app/services/upload_service.dart';
import 'package:faith_stream_music_app/services/api_client.dart';

// Initialize
final apiClient = ApiClient(storageService);
final uploadService = UploadService(apiClient);

// Upload album cover
try {
  final publicUrl = await uploadService.uploadAlbumCover(
    filePath: '/path/to/image.jpg',
    albumId: '123',
    onProgress: (progress) {
      print('Upload progress: ${(progress * 100).toStringAsFixed(0)}%');
    },
  );
  
  print('Upload successful! URL: $publicUrl');
  
  // Now update your album with the publicUrl
  // e.g., call API to update album.cover_image_url = publicUrl
  
} catch (e) {
  print('Upload failed: $e');
}
```

### Integration with Image Picker

```dart
import 'package:image_picker/image_picker.dart';
import 'package:faith_stream_music_app/services/upload_service.dart';

Future<void> pickAndUploadAlbumCover(String albumId) async {
  final ImagePicker picker = ImagePicker();
  
  // Pick image from gallery
  final XFile? image = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 1920,
    maxHeight: 1920,
    imageQuality: 85,
  );
  
  if (image == null) return;
  
  try {
    // Show loading indicator
    showLoadingDialog();
    
    // Upload to S3
    final publicUrl = await uploadService.uploadAlbumCover(
      filePath: image.path,
      albumId: albumId,
      onProgress: (progress) {
        // Update progress indicator
        updateProgress(progress);
      },
    );
    
    // Update album in database
    await updateAlbumCover(albumId, publicUrl);
    
    hideLoadingDialog();
    showSuccessMessage('Album cover uploaded successfully!');
    
  } catch (e) {
    hideLoadingDialog();
    showErrorMessage('Failed to upload: $e');
  }
}
```

---

## Testing the Upload

### Using cURL

```bash
# Step 1: Login to get token
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@faithstream.com",
    "password": "your_password"
  }'

# Step 2: Get presigned URL
curl -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileName": "album-cover.jpg",
    "contentType": "image/jpeg",
    "uploadType": "album_cover",
    "resourceId": "123"
  }'

# Step 3: Upload to S3 using the presigned URL
curl -X PUT "PRESIGNED_URL_FROM_STEP_2" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/your/image.jpg"
```

### Using Postman

1. **Get Presigned URL**
   - Method: POST
   - URL: `http://localhost:9000/api/upload/presigned-url`
   - Headers:
     - `Authorization`: `Bearer YOUR_JWT_TOKEN`
     - `Content-Type`: `application/json`
   - Body (raw JSON):
     ```json
     {
       "fileName": "album-cover.jpg",
       "contentType": "image/jpeg",
       "uploadType": "album_cover",
       "resourceId": "123"
     }
     ```

2. **Upload to S3**
   - Method: PUT
   - URL: (use `uploadUrl` from previous response)
   - Headers:
     - `Content-Type`: `image/jpeg`
   - Body: Binary (select your image file)

---

## Environment Variables Required

Make sure your `.env` file has:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_BUCKET=your_bucket_name
```

---

## Error Handling

### Common Errors

1. **"Cannot POST /api/upload/presigned-url"**
   - **Cause**: Route not registered or server not restarted
   - **Solution**: ✅ Fixed! Route is now registered in app.js

2. **"Missing required fields"**
   - **Cause**: fileName, contentType, or uploadType not provided
   - **Solution**: Ensure all required fields are in request body

3. **"resourceId is required"**
   - **Cause**: Uploading album_cover, song_cover, or song_audio without resourceId
   - **Solution**: Include resourceId in request body

4. **"Invalid file type"**
   - **Cause**: File type not allowed
   - **Solution**: Use only JPEG, PNG, WebP for images; MP3, WAV, FLAC for audio

5. **401 Unauthorized**
   - **Cause**: Missing or invalid JWT token
   - **Solution**: Include valid token in Authorization header

---

## Summary

✅ **Backend**: Upload endpoint implemented with proper S3 folder structure
✅ **Flutter**: Upload service created with helper methods
✅ **React**: Example implementation provided above

The system now properly organizes files in S3 based on:
- User role (admin, artist, user)
- Upload type (album, song, profile)
- Resource ID (album_id, song_id, user_id)
- Timestamp for uniqueness

All files are uploaded with presigned URLs for security, avoiding direct credential exposure.
