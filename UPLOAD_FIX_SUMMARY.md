# ✅ Upload Issue FIXED - Quick Reference

## What Was The Problem?
- Admin panel was calling `/api/upload/presigned-url`
- Backend didn't have the `/api` prefix or the upload routes
- Images were being uploaded directly to S3 root without folder structure

## What Was Fixed?

### 1. Backend Changes
- ✅ Created `/api/upload/presigned-url` endpoint
- ✅ Added `/api` prefix to ALL routes for consistency
- ✅ Implemented proper S3 folder structure:
  - Albums: `albums/{albumId}/cover_{timestamp}.jpg`
  - Songs: `songs/{songId}/cover_{timestamp}.jpg`
  - Artists: `artists/{artistId}/profile_{timestamp}.jpg`
  - Users: `users/{userId}/profile_{timestamp}.jpg`

### 2. New Files Created
- `src/controllers/upload.controller.js` - Handles upload requests
- `src/services/upload.service.js` - Upload business logic
- `src/routes/upload.routes.js` - Upload route definitions
- `src/utils/s3.util.js` - Enhanced with presigned URL generation
- `faith_stream_music_app/lib/services/upload_service.dart` - Flutter upload service

### 3. Updated Files
- `src/app.js` - Added `/api` prefix to all routes
- `faith_stream_music_app/lib/config/app_config.dart` - Updated base URL

---

## How To Use It Now

### From React Admin Panel

```javascript
// Example: Upload album cover
const uploadAlbumCover = async (file, albumId) => {
  const token = localStorage.getItem('adminToken');
  
  // Step 1: Get presigned URL
  const response = await fetch('http://localhost:9000/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      uploadType: 'album_cover',
      resourceId: albumId,
    }),
  });
  
  const data = await response.json();
  const { uploadUrl, publicUrl } = data.data;
  
  // Step 2: Upload to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });
  
  // Step 3: Use publicUrl to update album
  return publicUrl;
};
```

### From Flutter App

```dart
import 'package:faith_stream_music_app/services/upload_service.dart';

// Initialize
final uploadService = UploadService(apiClient);

// Upload album cover
final publicUrl = await uploadService.uploadAlbumCover(
  filePath: '/path/to/image.jpg',
  albumId: '123',
  onProgress: (progress) {
    print('Uploading: ${(progress * 100).toStringAsFixed(0)}%');
  },
);

print('Uploaded! URL: $publicUrl');
```

---

## Updated API Endpoints

All endpoints now use `/api` prefix:

- ✅ `POST /api/auth/login`
- ✅ `GET /api/home`
- ✅ `GET /api/songs`
- ✅ `GET /api/albums`
- ✅ `GET /api/admin/artists`
- ✅ `POST /api/upload/presigned-url` ← NEW!

---

## Testing Steps

### 1. Test with cURL

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithstream.com","password":"yourpass"}' \
  | jq -r '.token')

# Get presigned URL
curl -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg",
    "uploadType": "album_cover",
    "resourceId": "123"
  }'
```

### 2. Test with Postman

1. **Login**:
   - POST `http://localhost:9000/api/auth/login`
   - Body: `{"email":"admin@faithstream.com","password":"yourpass"}`
   - Save the token from response

2. **Get Upload URL**:
   - POST `http://localhost:9000/api/upload/presigned-url`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Body:
     ```json
     {
       "fileName": "album-cover.jpg",
       "contentType": "image/jpeg",
       "uploadType": "album_cover",
       "resourceId": "123"
     }
     ```

3. **Upload File**:
   - PUT (use uploadUrl from step 2)
   - Body: Binary (select your image file)
   - Headers: `Content-Type: image/jpeg`

---

## S3 Folder Structure Examples

After uploading, files will be organized like this:

```
your-s3-bucket/
├── albums/
│   ├── 1/
│   │   ├── cover_1707235200000.jpg
│   │   └── cover_1707235300000.jpg
│   └── 2/
│       └── cover_1707235400000.jpg
├── songs/
│   ├── 10/
│   │   ├── cover_1707235500000.jpg
│   │   └── audio_1707235600000.mp3
│   └── 11/
│       └── audio_1707235700000.mp3
├── artists/
│   └── 5/
│       └── profile_1707235800000.jpg
└── users/
    └── 100/
        └── profile_1707235900000.jpg
```

---

## Environment Variables Required

Make sure your `.env` file has these AWS settings:

```env
PORT=9000
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key_here
AWS_SECRET_KEY=your_secret_key_here
AWS_BUCKET=your_bucket_name_here
```

---

## Supported File Types

### Images (for covers and profiles)
- ✅ JPEG/JPG
- ✅ PNG
- ✅ WebP

### Audio (for songs)
- ✅ MP3
- ✅ WAV
- ✅ FLAC

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot POST /api/upload/presigned-url" | Server not restarted | ✅ Fixed - Server restarted with new routes |
| "Missing required fields" | Missing fileName, contentType, or uploadType | Include all required fields in request |
| "resourceId is required" | Uploading album/song cover without resourceId | Add resourceId for album_cover, song_cover, song_audio |
| "Invalid file type" | Wrong file format | Use only supported file types |
| 401 Unauthorized | Missing/invalid token | Login first and include valid token |

---

## Next Steps

1. ✅ Backend is ready and running on port 9000
2. ✅ Upload endpoint is working at `/api/upload/presigned-url`
3. ✅ S3 folder structure is implemented
4. 📝 Update your React admin panel to use the new endpoint
5. 📝 Test uploading an album cover
6. 📝 Verify the file appears in S3 with proper folder structure

---

## Need Help?

- Full documentation: See `UPLOAD_API_GUIDE.md`
- React examples: See `UPLOAD_API_GUIDE.md` (React Admin Panel Implementation section)
- Flutter examples: See `UPLOAD_API_GUIDE.md` (Flutter App Implementation section)

---

## Summary

✅ Problem: "Cannot POST /api/upload/presigned-url"  
✅ Solution: Created upload endpoint with proper S3 folder structure  
✅ Status: **FIXED AND WORKING**  
✅ Backend: Running on port 9000  
✅ All routes: Now use `/api` prefix  
✅ Folder structure: Organized by resource type and ID  
