# 🔧 Quick Fix - Album Cover Upload Error

## Your Issue

You're getting `http://localhost:8080/undefined` and "Failed to upload file to S3" error.

**Root Cause:** `uploadUrl` is undefined because you're not correctly extracting it from the response.

---

## ✅ Working Code (Copy & Paste)

Replace your `uploadAlbumCover` function with this:

```javascript
const uploadAlbumCover = async (file, albumId) => {
  try {
    const token = localStorage.getItem('adminToken');
    
    console.log('🔵 Step 1: Getting presigned URL...');
    
    // STEP 1: Get presigned URL
    const urlResponse = await fetch('http://localhost:9000/api/upload/presigned-url', {
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

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const responseData = await urlResponse.json();
    console.log('✅ Got response:', responseData);
    
    // ✅ CRITICAL FIX: Extract from responseData.data
    const { uploadUrl, publicUrl } = responseData.data;
    
    if (!uploadUrl || !publicUrl) {
      console.error('❌ Missing URLs in response:', responseData);
      throw new Error('Invalid response structure');
    }
    
    console.log('📤 Uploading to:', uploadUrl);
    
    // STEP 2: Upload to S3 using the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    console.log('📡 S3 Status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ S3 Error:', errorText);
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }

    console.log('✅ File uploaded successfully!');
    console.log('🌐 Public URL:', publicUrl);
    
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};
```

---

## 🔍 What Was Wrong

### ❌ Wrong (Your Current Code)
```javascript
const { data } = await urlResponse.json();
await fetch(data.uploadUrl, {  // ❌ data is undefined!
  method: 'PUT',
  body: file,
});
```

### ✅ Correct
```javascript
const responseData = await urlResponse.json();      // ✅ Get full response
const { uploadUrl } = responseData.data;            // ✅ Extract from .data
await fetch(uploadUrl, {                            // ✅ uploadUrl is defined!
  method: 'PUT',
  body: file,
});
```

---

## 📊 Response Structure

Your API returns:
```json
{
  "success": true,
  "data": {                    ← This is what you need
    "uploadUrl": "https://...",
    "s3Key": "...",
    "publicUrl": "https://..."
  }
}
```

So you must access: `responseData.data.uploadUrl` ✅  
NOT: `data.uploadUrl` ❌

---

## 🧪 Test It

1. Replace your function with the code above
2. Open browser console (F12)
3. Try uploading an album cover
4. You should see:
   ```
   🔵 Step 1: Getting presigned URL...
   ✅ Got response: { success: true, data: {...} }
   📤 Uploading to: https://faithstream-songs-production.s3...
   📡 S3 Status: 200
   ✅ File uploaded successfully!
   🌐 Public URL: https://...
   ```

---

## 🎯 Complete Working Example

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const token = localStorage.getItem('adminToken');

    // STEP 1: Create Album
    console.log('Creating album...');
    const createResponse = await fetch('http://localhost:9000/api/albums', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        language: formData.language,
        release_type: formData.releaseType,
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create album');
    }

    const createData = await createResponse.json();
    const albumId = createData.id; // This is the album ID
    console.log('✅ Album created:', albumId);

    // STEP 2: Upload Cover (if selected)
    if (coverFile) {
      console.log('Uploading cover...');
      const coverUrl = await uploadAlbumCover(coverFile, albumId);
      console.log('✅ Cover uploaded:', coverUrl);

      // STEP 3: Update Album with Cover URL
      console.log('Updating album with cover...');
      await fetch(`http://localhost:9000/api/albums/admin/${albumId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cover_image_url: coverUrl,
        }),
      });
      console.log('✅ Album updated with cover');
    }

    alert('Album created successfully!');
    window.location.href = '/admin/albums';

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Failed to create album: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## ⚠️ Key Points

1. **Response structure:** Your API returns `{ success: true, data: { uploadUrl, publicUrl } }`
2. **Access pattern:** Use `responseData.data.uploadUrl`, not `data.uploadUrl`
3. **Headers for S3:** Only include `Content-Type`, don't add Authorization for S3 upload
4. **Error handling:** Check `uploadResponse.ok` and log status
5. **Debugging:** Keep console.logs to see exactly where it fails

---

## 🚀 After Fix

You should see this flow:
1. ✅ Album created with ID
2. ✅ Presigned URL received
3. ✅ File uploaded to S3 (status 200)
4. ✅ Album updated with cover URL
5. ✅ Success!

No more `http://localhost:8080/undefined` error! 🎉
