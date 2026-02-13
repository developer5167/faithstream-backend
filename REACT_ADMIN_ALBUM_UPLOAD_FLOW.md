# React Admin Panel - Album & Song Upload Flow Guide

## 🚨 IMPORTANT BACKEND CHANGES (February 2026)

### New Requirements:
1. **Admin must select an artist** from dropdown when creating albums/songs
2. **Only APPROVED artists** can have content uploaded for them
3. Pass `artist_user_id` in the request body
4. When updating albums, the system validates the **album's artist** (not admin)

---

## Overview

This guide explains:
1. How to add **artist selection dropdown** for admin uploads
2. How to upload album/song covers **AFTER** creation (not on selection)
3. Complete API integration with the new backend requirements

---

## 🔄 Complete Flow (With Artist Selection)

### ✅ New Flow for Admin Upload
```
1. Admin selects an APPROVED artist from dropdown
2. Admin fills in album/song details
3. Admin selects cover image (stored temporarily in component state)
4. Admin submits form
5. Backend validates artist is APPROVED
6. Create album/song record → Get resource ID
7. Upload cover image with resource ID → Get S3 URL
8. Update record with cover URL
9. Done!
```

**Key Changes:**
- ✅ Admin MUST select artist from dropdown
- ✅ Pass `artist_user_id` in request body
- ✅ Only APPROVED artists can have uploads
- ✅ No orphaned S3 files
- ✅ Album/song ID available for organized S3 folder structure

---

## 📋 Step-by-Step Implementation

### Step 1: Fetch Approved Artists

First, create a function to fetch all approved artists for the dropdown:

```jsx
import React, { useState, useEffect } from 'react';

const CreateAlbumForm = () => {
  const [artists, setArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English',
    releaseType: 'ALBUM',
  });
  
  // ✅ Store file object, not URL
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch approved artists on component mount
  useEffect(() => {
    fetchApprovedArtists();
  }, []);

  const fetchApprovedArtists = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:9000/api/admin/approved-artists', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }

      const data = await response.json();
      setArtists(data);
      
      // Auto-select first artist if available
      if (data.length > 0) {
        setSelectedArtistId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      alert('Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection (DON'T upload yet)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Store file and create preview
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // ... rest of component
};
```

### Step 2: Add Artist Dropdown to Form

Add the artist selection dropdown at the top of your form:

```jsx
<form onSubmit={handleSubmit}>
  {/* ✅ REQUIRED: Artist Selection */}
  <div className="form-group">
    <label>
      Select Artist <span style={{ color: 'red' }}>*</span>
    </label>
    {loading ? (
      <p>Loading artists...</p>
    ) : artists.length === 0 ? (
      <p style={{ color: 'orange' }}>
        No approved artists found. Please approve artists first.
      </p>
    ) : (
      <select
        value={selectedArtistId}
        onChange={(e) => setSelectedArtistId(e.target.value)}
        required
        disabled={isSubmitting}
        className="form-control"
      >
        <option value="">-- Select Artist --</option>
        {artists.map((artist) => (
          <option key={artist.id} value={artist.id}>
            {artist.name} ({artist.email})
          </option>
        ))}
      </select>
    )}
  </div>

  {/* Album Title */}
  <div className="form-group">
    <label>
      Album Title <span style={{ color: 'red' }}>*</span>
    </label>
    <input
      type="text"
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      required
      disabled={isSubmitting}
      className="form-control"
    />
  </div>

  {/* Description */}
  <div className="form-group">
    <label>
      Description <span style={{ color: 'red' }}>*</span>
    </label>
    <textarea
      value={formData.description}
      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      required
      disabled={isSubmitting}
      className="form-control"
      rows={4}
    />
  </div>

  {/* Language */}
  <div className="form-group">
    <label>Language</label>
    <select
      value={formData.language}
      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
      disabled={isSubmitting}
      className="form-control"
    >
      <option value="English">English</option>
      <option value="Hindi">Hindi</option>
      <option value="Tamil">Tamil</option>
      <option value="Telugu">Telugu</option>
      <option value="Malayalam">Malayalam</option>
    </select>
  </div>

  {/* Release Type */}
  <div className="form-group">
    <label>Release Type</label>
    <select
      value={formData.releaseType}
      onChange={(e) => setFormData({ ...formData, releaseType: e.target.value })}
      disabled={isSubmitting}
      className="form-control"
    >
      <option value="ALBUM">Album</option>
      <option value="SINGLE">Single</option>
      <option value="EP">EP</option>
    </select>
  </div>

  {/* Cover Image Selection */}
<div className="form-group">
  <label>Album Cover (Optional)</label>
  <input
    type="file"
    accept="image/*"
    onChange={handleFileSelect}  // ✅ Only stores file
    disabled={isSubmitting}
  />
  
  {/* Show preview */}
  {coverPreview && (
    <div className="image-preview">
      <img src={coverPreview} alt="Cover preview" />
      <button
        type="button"
        onClick={() => {
          setCoverFile(null);
          setCoverPreview(null);
        }}
      >
        Remove
      </button>
    </div>
  )}
</div>
```

### Step 3: Create Upload Helper Function

```jsx
// Helper: Upload cover photo after album is created
const uploadAlbumCover = async (file, albumId) => {
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
      resourceId: albumId,         // ✅ Album ID from step 1
    }),
  });

  if (!urlResponse.ok) {
    const error = await urlResponse.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const responseData = await urlResponse.json();
  
  // ✅ IMPORTANT: Extract uploadUrl from response.data
  const { uploadUrl, publicUrl } = responseData.data;
  
  // Validate URLs exist
  if (!uploadUrl || !publicUrl) {
    console.error('Invalid response structure:', responseData);
    throw new Error('Missing uploadUrl or publicUrl in response');
  }

  console.log('📤 Uploading to S3:', uploadUrl);

  // Step 2: Upload to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('S3 upload failed:', errorText);
    throw new Error('Failed to upload file to S3: ' + uploadResponse.status);
  }

  console.log('✅ File uploaded to:', publicUrl);
  return publicUrl;
};
```

### Step 4: Update Form Submit Handler

Handle the complete process: Validate → Create → Upload → Update

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!selectedArtistId) {
    alert('Please select an artist');
    return;
  }
  
  if (!formData.title || !formData.description) {
    alert('Please fill in all required fields');
    return;
  }

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem('adminToken');

    // STEP 1: Create album (without cover)
    console.log('Step 1: Creating album for artist:', selectedArtistId);
    const createResponse = await fetch('http://localhost:9000/api/albums', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artist_user_id: selectedArtistId,  // ✅ REQUIRED: Selected artist ID
        title: formData.title,
        description: formData.description,
        language: formData.language,
        release_type: formData.releaseType,
        // Don't include cover_image_url here
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error || 'Failed to create album');
    }

    const { data: newAlbum } = await createResponse.json();
    const albumId = newAlbum.id;
    console.log('✅ Album created with ID:', albumId);

    // STEP 2: Upload cover if selected
    let coverUrl = null;
    if (coverFile) {
      console.log('Step 2: Uploading cover...');
      coverUrl = await uploadAlbumCover(coverFile, albumId);
      console.log('✅ Cover uploaded:', coverUrl);

      // STEP 3: Update album with cover URL
      console.log('Step 3: Updating album with cover...');
      const updateResponse = await fetch(`http://localhost:9000/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cover_image_url: coverUrl,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.warn('Failed to update album with cover URL:', error);
        // Don't fail the whole process, album is created
      } else {
        console.log('✅ Album updated with cover');
      }
    }

    // Success!
    alert('Album created successfully!');
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      language: 'English',
      releaseType: 'ALBUM',
    });
    setCoverFile(null);
    setCoverPreview(null);
    
    // Or redirect to albums list
    // window.location.href = '/admin/albums';
    
  } catch (error) {
    console.error('Album creation failed:', error);
    alert('Failed to create album: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Step 5: Complete Component Example

```jsx
import React, { useState } from 'react';

const CreateAlbumForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English',
    releaseType: 'ALBUM',
  });
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadAlbumCover = async (file, albumId) => {
    const token = localStorage.getItem('adminToken');
    
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
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const responseData = await urlResponse.json();
    const { uploadUrl, publicUrl } = responseData.data; // ✅ Extract from .data
    
    if (!uploadUrl) {
      throw new Error('No uploadUrl in response');
    }
    
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');

      // Create album
      const createResponse = await fetch('http://localhost:9000/api/albums', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const { data: newAlbum } = await createResponse.json();

      // Upload cover if exists
      if (coverFile) {
        const coverUrl = await uploadAlbumCover(coverFile, newAlbum.id);
        
        await fetch(`http://localhost:9000/api/albums/admin/${newAlbum.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cover_image_url: coverUrl }),
        });
      }

      alert('Album created successfully!');
      window.location.href = '/admin/albums';
      
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-album-form">
      <h2>Create Album</h2>

      {/* Cover Preview */}
      <div className="form-group">
        <label>Album Cover (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isSubmitting}
        />
        {coverPreview && (
          <div className="preview">
            <img src={coverPreview} alt="Preview" width="200" />
            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                setCoverPreview(null);
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Language */}
      <div className="form-group">
        <label>Language *</label>
        <select
          value={formData.language}
          onChange={(e) => setFormData({...formData, language: e.target.value})}
          disabled={isSubmitting}
        >
          <option>English</option>
          <option>Hindi</option>
          <option>Tamil</option>
        </select>
      </div>

      {/* Release Type */}
      <div className="form-group">
        <label>Release Type *</label>
        <select
          value={formData.releaseType}
          onChange={(e) => setFormData({...formData, releaseType: e.target.value})}
          disabled={isSubmitting}
        >
          <option value="ALBUM">Album</option>
          <option value="EP">EP</option>
          <option value="SINGLE">Single</option>
        </select>
      </div>

      {/* Info */}
      <div className="info-box">
        ℹ️ Cover photo will be uploaded after album is created
      </div>

      {/* Submit */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Album'}
      </button>
    </form>
  );
};

export default CreateAlbumForm;
```

---

## 🎨 CSS Styles (Optional)

```css
.create-album-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  min-height: 100px;
}

.preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.preview img {
  border-radius: 4px;
  margin-bottom: 10px;
}

.preview button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.info-box {
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  margin-bottom: 20px;
  border-radius: 4px;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button[type="submit"]:hover:not(:disabled) {
  background: #6f3710;
}
```

---

## 📋 Summary of Changes

### What to Change in Your React Code:

1. **File Input Handler**
   - ❌ Remove immediate upload on file selection
   - ✅ Store file in component state (`setCoverFile`)
   - ✅ Create preview with `URL.createObjectURL()`

2. **Form Submit Handler**
   - ✅ Create album record first
   - ✅ Get album ID from response
   - ✅ Upload cover with album ID
   - ✅ Update album with cover URL

3. **Upload Request**
   - ✅ Use `uploadType: 'album_cover'` (not `'covers'`)
   - ✅ Include `resourceId: albumId`
   - ✅ Include proper Authorization header

4. **State Management**
   ```jsx
   const [coverFile, setCoverFile] = useState(null);        // File object
   const [coverPreview, setCoverPreview] = useState(null);  // Preview URL
   const [formData, setFormData] = useState({...});         // Form fields
   ```

---

## ✅ Testing Checklist

- [ ] Can select cover image and see preview
- [ ] Can remove selected cover
- [ ] Can submit form without cover (optional)
- [ ] Album created successfully without cover
- [ ] Album created with cover uploads correctly
- [ ] Cover appears in S3 as `albums/{albumId}/cover_{timestamp}.jpg`
- [ ] Album record updated with correct `cover_image_url`
- [ ] Error handling works for upload failures
- [ ] Loading states show appropriately

---

## 🔍 Debugging Tips

### Check Network Tab

1. **Create Album Request**
   ```
   POST /api/albums
   Body: { title, description, language, release_type }
   Response: { data: { id: 123, ... } }
   ```

2. **Get Presigned URL**
   ```
   POST /api/upload/presigned-url
   Body: { fileName, contentType, uploadType: "album_cover", resourceId: "123" }
   Response: { data: { uploadUrl, publicUrl } }
   ```

3. **Upload to S3**
   ```
   PUT {presigned-url}
   Body: {binary file data}
   ```

4. **Update Album**
   ```
   PATCH /api/albums/admin/123
   Body: { cover_image_url: "https://..." }
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Authorization header missing" | Add `Authorization: Bearer ${token}` header |
| "Invalid uploadType" | Use `album_cover` not `covers` |
| "resourceId required" | Include `resourceId: albumId` in request |
| **"Failed to upload file to S3"** | **Check that you're accessing `responseData.data.uploadUrl`, not just `data.uploadUrl`** |
| **Call to `http://localhost:8080/undefined`** | **`uploadUrl` is undefined - extract it from `responseData.data`** |
| Cover not showing | Check S3 URL saved correctly in database |
| Form resets too early | Wait for all steps before clearing state |

### Debug the Upload Issue

Add this logging to your `uploadAlbumCover` function:

```javascript
const uploadAlbumCover = async (file, albumId) => {
  console.log('🔵 Starting upload for album:', albumId);
  console.log('📁 File:', file.name, file.type);
  
  const token = localStorage.getItem('adminToken');
  
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

  const responseData = await urlResponse.json();
  console.log('📦 Presigned URL response:', responseData);
  
  // ✅ CRITICAL: Access uploadUrl from responseData.data
  const { uploadUrl, publicUrl } = responseData.data;
  
  console.log('📤 Upload URL:', uploadUrl);
  console.log('🌐 Public URL:', publicUrl);
  
  if (!uploadUrl) {
    console.error('❌ No uploadUrl found!');
    throw new Error('Missing uploadUrl in response');
  }
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  console.log('📡 S3 Response Status:', uploadResponse.status);
  
  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.status}`);
  }
  
  console.log('✅ Upload successful!');
  return publicUrl;
};
```

---

## 🎵 Song Upload (Same Pattern)

The same changes apply to song uploads:

### Song Creation API Call

```jsx
const handleSongSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedArtistId) {
    alert('Please select an artist');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');

    // Step 1: Create song
    const createResponse = await fetch('http://localhost:9000/api/songs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artist_user_id: selectedArtistId,  // ✅ REQUIRED
        title: songData.title,
        genre: songData.genre,
        language: songData.language,
        lyrics: songData.lyrics,
        description: songData.description,
        album_id: songData.albumId || null,  // Optional: if adding to album
        // Don't include audio_original_url or cover_image_url yet
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error || 'Failed to create song');
    }

    const newSong = await createResponse.json();
    const songId = newSong.id;

    // Step 2: Upload audio file
    const audioUrl = await uploadSongAudio(audioFile, songId);

    // Step 3: Upload cover (if provided)
    let coverUrl = null;
    if (coverFile) {
      coverUrl = await uploadSongCover(coverFile, songId);
    }

    // Step 4: Update song with URLs
    await fetch(`http://localhost:9000/api/songs/${songId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_original_url: audioUrl,
        cover_image_url: coverUrl,
      }),
    });

    alert('Song created successfully!');
  } catch (error) {
    alert('Failed to create song: ' + error.message);
  }
};

// Upload helper for song audio
const uploadSongAudio = async (file, songId) => {
  const token = localStorage.getItem('adminToken');
  
  const urlResponse = await fetch('http://localhost:9000/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      uploadType: 'song_audio',  // ✅ For audio files
      resourceId: songId,
    }),
  });

  const { data } = await urlResponse.json();
  const { uploadUrl, publicUrl } = data;

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return publicUrl;
};

// Upload helper for song cover
const uploadSongCover = async (file, songId) => {
  const token = localStorage.getItem('adminToken');
  
  const urlResponse = await fetch('http://localhost:9000/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      uploadType: 'song_cover',  // ✅ For song covers
      resourceId: songId,
    }),
  });

  const { data } = await urlResponse.json();
  const { uploadUrl, publicUrl } = data;

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return publicUrl;
};
```

---

## 📋 API Endpoint for Fetching Approved Artists

You'll need to create this endpoint if it doesn't exist:

```javascript
// Backend: src/controllers/admin.controller.js
exports.getApprovedArtists = async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, name, email, artist_display_name 
       FROM users 
       WHERE artist_status = 'APPROVED' 
       ORDER BY name ASC`
    );
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Backend: src/routes/admin.routes.js
router.get('/approved-artists', auth, admin, controller.getApprovedArtists);
```

---

## ✅ Summary of Changes

### What Changed in Backend:
1. ✅ Admin must select an artist (not themselves)
2. ✅ Pass `artist_user_id` in request body
3. ✅ Only APPROVED artists can have uploads
4. ✅ When updating albums, validates the album's artist

### What to Change in React:
1. ✅ Add artist dropdown (fetch approved artists)
2. ✅ Include `artist_user_id` in all create requests
3. ✅ Store files locally until form submission
4. ✅ Upload files AFTER resource creation
5. ✅ Update resource with file URLs

### Upload Flow:
```
User Action → Select Artist → Fill Form → Submit
Backend → Validate Artist Approved → Create Resource
Upload → Get Resource ID → Upload to S3 → Get Public URL
Update → Patch Resource with File URL → Done!
```

---

## 🚀 Testing Checklist

- [ ] Admin can see dropdown of approved artists
- [ ] Cannot submit without selecting artist
- [ ] Error shown if artist not approved
- [ ] Album created with correct artist_id
- [ ] Cover uploaded to correct S3 folder: `albums/{albumId}/cover_*.jpg`
- [ ] Album updated with cover URL
- [ ] Same flow works for songs
- [ ] Song audio uploaded to: `songs/{songId}/audio_*.mp3`
- [ ] Song cover uploaded to: `songs/{songId}/cover_*.jpg`

---

## 🐛 Common Errors & Solutions

### Error: "Approved artist only"
**Solution:** Ensure artist status is 'APPROVED' in database

### Error: "Can only create albums for approved artists"
**Solution:** The selected artist is not approved. Check artist status.

### Error: "Internal server error"
**Solution:** Check console logs. Likely missing `artist_user_id` in request.

### Error: "Album not found"
**Solution:** Ensure album is created before uploading cover.

---

## 📞 Need Help?

- Check backend logs for detailed error messages
- Use browser DevTools Network tab to inspect requests
- Verify artist_user_id is included in request body
- Ensure token is valid and admin privileges are set

**Happy Coding!** 🎉
