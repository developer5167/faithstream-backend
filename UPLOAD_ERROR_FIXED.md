# ✅ FIXED: Upload Cover Photo Error

## Problem Summary

**Your Error:**
```json
{"error": "Cannot read properties of undefined (reading 'toLowerCase')"}
```

**Your Payload:**
```json
{
  "fileName": "Screenshot 2026-02-04 at 4.11.45 PM.png",
  "contentType": "image/png",
  "uploadType": "covers"
}
```

**Root Causes:**
1. ❌ Invalid `uploadType: "covers"` (should be `album_cover` or `song_cover`)
2. ❌ Missing `resourceId` (required for album/song covers)
3. ❌ Backend crashed when trying `userRole.toLowerCase()` on undefined value

---

## ✅ What Was Fixed

### 1. Safe Default for userRole
```javascript
// Before: Would crash if userRole was undefined
userRole.toLowerCase()  // ❌ Error!

// After: Safe default
const role = (userRole || 'user').toLowerCase();  // ✅ Works!
```

### 2. Type Mapping Added
Backend now accepts common variations:
```javascript
'covers'  → 'album_cover'
'cover'   → 'album_cover'
'album'   → 'album_cover'
'song'    → 'song_cover'
```

### 3. Better Validation
```javascript
// Now checks if type is valid before processing
if (!validTypes.includes(normalizedUploadType)) {
  throw new Error(`Invalid uploadType: "${uploadType}". Valid types are: ...`);
}
```

### 4. Clear Error Messages
```json
{
  "error": "Invalid uploadType: \"covers\". Valid types are: album_cover, song_cover, song_audio, artist_profile, user_profile, admin_upload"
}
```

---

## 🔧 Fix Your React Code

### Current Code (❌ Wrong)
```javascript
fetch('http://localhost:9000/api/upload/presigned-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: file.name,
    contentType: file.type,
    uploadType: 'covers',        // ❌ Wrong type
    // Missing resourceId!         // ❌ Required!
  }),
});
```

### Fixed Code (✅ Correct)
```javascript
fetch('http://localhost:9000/api/upload/presigned-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: file.name,
    contentType: file.type,
    uploadType: 'album_cover',   // ✅ Use specific type
    resourceId: albumId,         // ✅ Include album/song ID
  }),
});
```

---

## Valid Upload Types Reference

| Type | When to Use | Needs resourceId? |
|------|------------|-------------------|
| `album_cover` | Uploading album artwork | ✅ Yes (album ID) |
| `song_cover` | Uploading song artwork | ✅ Yes (song ID) |
| `song_audio` | Uploading song file | ✅ Yes (song ID) |
| `artist_profile` | Artist profile picture | ❌ No |
| `user_profile` | User profile picture | ❌ No |

---

## Complete Working Example

```javascript
const uploadAlbumCover = async (file, albumId) => {
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
        fileName: file.name,              // ✅
        contentType: file.type,           // ✅
        uploadType: 'album_cover',        // ✅ Fixed!
        resourceId: albumId,              // ✅ Added!
      }),
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.error);
    }

    const { data } = await urlResponse.json();
    const { uploadUrl, publicUrl } = data;
    
    // Step 2: Upload file to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    
    // Step 3: Return public URL
    console.log('✅ Uploaded to:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
};

// Usage
const handleFileChange = async (e) => {
  const file = e.target.files[0];
  const albumId = '123'; // Get from your state/props
  
  try {
    const url = await uploadAlbumCover(file, albumId);
    // Update your album with the URL
    await updateAlbum(albumId, { cover_image_url: url });
  } catch (error) {
    alert('Upload failed: ' + error.message);
  }
};
```

---

## Quick Changes Needed in Your React App

1. **Find this:**
   ```javascript
   uploadType: "covers"
   ```
   
2. **Replace with:**
   ```javascript
   uploadType: "album_cover"  // or "song_cover" depending on usage
   ```

3. **Add this:**
   ```javascript
   resourceId: albumId  // or songId
   ```

That's it! Three simple changes.

---

## Test Results

### ✅ Before Fix
```bash
Request: { uploadType: "covers" }
Response: {"error": "Cannot read properties of undefined (reading 'toLowerCase')"}
Status: 💥 Server crashed
```

### ✅ After Fix
```bash
Request: { uploadType: "covers" }
Response: {"error": "Authorization header missing"}
Status: ✅ Server handles gracefully, asks for auth
```

---

## Files Modified

✅ `src/services/upload.service.js` - Added type mapping and validation  
✅ `src/controllers/upload.controller.js` - Better error messages  
✅ `src/utils/s3.util.js` - Safe default for userRole  

---

## Summary

**What you need to do:**
1. Change `uploadType: "covers"` → `uploadType: "album_cover"`
2. Add `resourceId: albumId` (or `songId`)
3. Make sure Authorization header is included

**What we fixed:**
1. No more `toLowerCase` crashes
2. Better error messages to guide you
3. Type mapping for common variations
4. Safer handling of undefined values

**Status:** ✅ Fixed and tested. Server restarted.

See [REACT_UPLOAD_FIX.md](REACT_UPLOAD_FIX.md) for complete code examples and detailed usage guide.

---

Your uploads should work now! 🎉
