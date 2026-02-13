# Upload API - React Integration Guide

## ❌ Common Error Fixed

### Error You Were Getting
```json
{"error": "Cannot read properties of undefined (reading 'toLowerCase')"}
```

### Root Cause
Your React app was sending:
```javascript
{
  "fileName": "Screenshot 2026-02-04 at 4.11.45 PM.png",
  "contentType": "image/png",
  "uploadType": "covers"  // ❌ Wrong! Not a valid type
  // Missing resourceId!
}
```

**Problems:**
1. ❌ `uploadType: "covers"` is not valid (should be `album_cover` or `song_cover`)
2. ❌ Missing `resourceId` (required for covers)
3. ❌ Backend was trying to call `toLowerCase()` on undefined `userRole`

---

## ✅ Correct Usage

### For Album Cover Upload

```javascript
// POST /api/upload/presigned-url
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
      fileName: file.name,                 // ✅ "image.jpg"
      contentType: file.type,              // ✅ "image/jpeg"
      uploadType: 'album_cover',           // ✅ Use specific type
      resourceId: albumId                  // ✅ REQUIRED for covers
    }),
  });

  const { data } = await response.json();
  const { uploadUrl, publicUrl } = data;
  
  // Step 2: Upload to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  // Step 3: Use publicUrl in your database
  return publicUrl;
};
```

### For Song Cover Upload

```javascript
const uploadSongCover = async (file, songId) => {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch('http://localhost:9000/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      uploadType: 'song_cover',            // ✅ For songs
      resourceId: songId                   // ✅ Song ID required
    }),
  });

  const { data } = await response.json();
  
  // Upload to S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  return data.publicUrl;
};
```

### For User Profile Picture

```javascript
const uploadProfilePicture = async (file) => {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch('http://localhost:9000/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      uploadType: 'user_profile',          // ✅ For user profiles
      // resourceId not needed for profiles
    }),
  });

  const { data } = await response.json();
  
  // Upload to S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  return data.publicUrl;
};
```

---

## Valid Upload Types

| Upload Type | Usage | Requires resourceId? | S3 Path |
|------------|-------|---------------------|---------|
| `album_cover` | Album covers | ✅ Yes (albumId) | `albums/{albumId}/cover_{timestamp}.jpg` |
| `song_cover` | Song covers | ✅ Yes (songId) | `songs/{songId}/cover_{timestamp}.jpg` |
| `song_audio` | Song files | ✅ Yes (songId) | `songs/{songId}/audio_{timestamp}.mp3` |
| `artist_profile` | Artist profile pics | ❌ No | `artists/{userId}/profile_{timestamp}.jpg` |
| `user_profile` | User profile pics | ❌ No | `users/{userId}/profile_{timestamp}.jpg` |

---

## ✅ Backend Improvements Made

### 1. Type Mapping (Backward Compatible)

The backend now accepts common variations and maps them:

```javascript
// If you send:        // Backend converts to:
'covers'       →       'album_cover'
'cover'        →       'album_cover'
'album'        →       'album_cover'
'song'         →       'song_cover'
'profile'      →       'user_profile'
'artist'       →       'artist_profile'
```

**However, best practice is to use the exact type!**

### 2. Better Error Messages

Now you get helpful errors:

```json
{
  "error": "Invalid uploadType: \"covers\". Valid types are: album_cover, song_cover, song_audio, artist_profile, user_profile, admin_upload"
}
```

or

```json
{
  "error": "resourceId is required for uploadType: \"album_cover\". Please provide the album or song ID."
}
```

### 3. Safe Default Values

- `userRole` defaults to `'USER'` if undefined
- Won't crash on `toLowerCase()` anymore

---

## Complete React Component Example

```jsx
import React, { useState } from 'react';

const AlbumCoverUpload = ({ albumId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const token = localStorage.getItem('adminToken');

      // Step 1: Get presigned URL
      const urlResponse = await fetch('http://localhost:9000/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          uploadType: 'album_cover',  // ✅ Correct type
          resourceId: albumId,        // ✅ Include album ID
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { data } = await urlResponse.json();
      const { uploadUrl, publicUrl } = data;

      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setProgress(100);

      // Step 3: Callback with public URL
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

      console.log('Upload successful! URL:', publicUrl);
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="album-cover-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
    </div>
  );
};

export default AlbumCoverUpload;
```

---

## Testing the Fix

### Test 1: Invalid Type (Should Give Helpful Error)

```bash
curl -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg",
    "uploadType": "covers"
  }'

# Response:
# {
#   "error": "resourceId is required for uploadType: \"album_cover\". Please provide the album or song ID."
# }
```

### Test 2: Correct Request

```bash
curl -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg",
    "uploadType": "album_cover",
    "resourceId": "123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "uploadUrl": "https://bucket.s3.region.amazonaws.com/albums/123/cover_123456789.jpg?presigned-params",
#     "s3Key": "albums/123/cover_123456789.jpg",
#     "publicUrl": "https://bucket.s3.region.amazonaws.com/albums/123/cover_123456789.jpg"
#   }
# }
```

---

## Summary of Changes

### ✅ Fixed
1. Backend now handles undefined `userRole` safely
2. Added type mapping for common variations
3. Better validation with clear error messages
4. Added `resourceId` requirement validation in service layer

### 📝 For Your React App
1. Change `uploadType: "covers"` to `uploadType: "album_cover"`
2. Always include `resourceId` for covers (album ID or song ID)
3. Use the exact upload types for best results

### 🚀 Ready to Use
- Server has been restarted
- All fixes are live
- Better error messages will guide you if something's wrong

---

## Quick Fix for Your React Code

Find this in your React code:
```javascript
// ❌ OLD - Wrong
uploadType: "covers"

// ✅ NEW - Correct
uploadType: "album_cover",
resourceId: albumId  // Add this!
```

That's it! Your uploads should work now. 🎉
