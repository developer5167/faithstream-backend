# React Web App: Single Song Cover Image Implementation Guide

## Overview

The API now supports **cover images for standalone single songs**. Previously, songs could only use album cover images, which meant standalone singles had no cover art.

### What Changed:
- ✅ Songs now have their own `cover_image_url` field
- ✅ **Standalone singles** (no album) → **MUST have cover image**
- ✅ **Album songs** → Cover image is optional (uses album cover if not provided)
- ✅ Display logic uses smart fallback: Song cover → Album cover → Placeholder

---

## API Changes

### Creating a Song - Updated Request Body

**Endpoint**: `POST /api/songs/`

**Headers**:
```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```javascript
{
  "title": "Amazing Grace",
  "language": "English",
  "genre": "Gospel",
  "lyrics": "Amazing grace...",
  "description": "Beautiful hymn",
  "audio_original_url": "https://s3.amazonaws.com/bucket/audio.mp3",
  "cover_image_url": "https://s3.amazonaws.com/bucket/cover.jpg",  // ⭐ NEW FIELD
  "album_id": null,  // null = standalone single
  "track_number": null
}
```

**Field Requirements**:
| Field | Standalone Single | Album Song |
|-------|------------------|------------|
| `cover_image_url` | **Required** ✅ | Optional |
| `album_id` | `null` | Album ID |
| `track_number` | `null` | Track number |

---

## React Implementation

### Step 1: Update Song Upload Form Component

```jsx
// components/UploadSongForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const UploadSongForm = () => {
  const [songType, setSongType] = useState('single'); // 'single' or 'album'
  const [formData, setFormData] = useState({
    title: '',
    language: '',
    genre: '',
    lyrics: '',
    description: '',
    audio_original_url: '',
    cover_image_url: '',  // ⭐ NEW
    album_id: null,
    track_number: null
  });
  
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);  // ⭐ NEW
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle song type change
  const handleSongTypeChange = (type) => {
    setSongType(type);
    if (type === 'single') {
      setFormData({
        ...formData,
        album_id: null,
        track_number: null
      });
    }
  };

  // Handle audio file upload
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const audioUrl = await uploadFileToS3(file);
      setFormData({
        ...formData,
        audio_original_url: audioUrl
      });
      setAudioFile(file);
      setError('');
    } catch (err) {
      setError('Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  // ⭐ NEW: Handle cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const coverUrl = await uploadFileToS3(file);
      setFormData({
        ...formData,
        cover_image_url: coverUrl
      });
      setCoverFile(file);
      setError('');
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  // Upload file to S3 (implement your S3 upload logic)
  const uploadFileToS3 = async (file) => {
    // Option 1: Get presigned URL from backend
    const response = await axios.post('/api/upload-url', {
      filename: file.name,
      filetype: file.type
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const { uploadUrl, fileUrl } = response.data;

    // Upload to S3
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    });

    return fileUrl;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ⭐ Validation: Singles must have cover image
    if (songType === 'single' && !formData.cover_image_url) {
      setError('Cover image is required for standalone singles');
      return;
    }

    if (!formData.audio_original_url) {
      setError('Please upload an audio file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/songs/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Song uploaded successfully!');
      // Reset form or redirect
      window.location.href = '/my-songs';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload song');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-song-form">
      <h2>Upload Song</h2>

      <form onSubmit={handleSubmit}>
        {/* Song Type Selection */}
        <div className="form-group">
          <label>Song Type:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="single"
                checked={songType === 'single'}
                onChange={() => handleSongTypeChange('single')}
              />
              Standalone Single
            </label>
            <label>
              <input
                type="radio"
                value="album"
                checked={songType === 'album'}
                onChange={() => handleSongTypeChange('album')}
              />
              Add to Album
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="form-group">
          <label>Title: *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Language: *</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
        </div>

        <div className="form-group">
          <label>Genre: *</label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Genre</option>
            <option value="Gospel">Gospel</option>
            <option value="Worship">Worship</option>
            <option value="Contemporary Christian">Contemporary Christian</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Lyrics:</label>
          <textarea
            name="lyrics"
            value={formData.lyrics}
            onChange={handleInputChange}
            rows="8"
          />
        </div>

        {/* Audio Upload */}
        <div className="form-group">
          <label>Audio File: *</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            required
          />
          {audioFile && (
            <div className="file-info">
              <span>✓ {audioFile.name}</span>
            </div>
          )}
        </div>

        {/* ⭐ Cover Image Upload - Required for Singles */}
        <div className="form-group">
          <label>
            Cover Image: 
            {songType === 'single' && <span className="required"> * (Required for singles)</span>}
            {songType === 'album' && <span className="optional"> (Optional - uses album cover)</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            required={songType === 'single'}  // ⭐ Required for singles
          />
          {coverFile && (
            <div className="file-preview">
              <img 
                src={URL.createObjectURL(coverFile)} 
                alt="Cover preview" 
                style={{ width: '200px', height: '200px', objectFit: 'cover' }}
              />
              <span>✓ {coverFile.name}</span>
            </div>
          )}
        </div>

        {/* Album Selection - Only shown if type is 'album' */}
        {songType === 'album' && (
          <>
            <div className="form-group">
              <label>Select Album: *</label>
              <select
                name="album_id"
                value={formData.album_id || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose Album</option>
                {/* Populate with user's DRAFT albums */}
              </select>
            </div>

            <div className="form-group">
              <label>Track Number: *</label>
              <input
                type="number"
                name="track_number"
                value={formData.track_number || ''}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Song'}
        </button>
      </form>
    </div>
  );
};

export default UploadSongForm;
```

---

### Step 2: Update Song Display Component

```jsx
// components/SongCard.jsx
import React from 'react';

const SongCard = ({ song }) => {
  // ⭐ Use song's cover, fallback to album cover, then to placeholder
  const getCoverImage = () => {
    if (song.cover_image_url) {
      return song.cover_image_url;
    }
    if (song.album_cover_url) {
      return song.album_cover_url;
    }
    return '/images/default-song-cover.png'; // Default placeholder
  };

  return (
    <div className="song-card">
      <div className="song-cover">
        <img 
          src={getCoverImage()} 
          alt={song.title}
          onError={(e) => {
            e.target.src = '/images/default-song-cover.png';
          }}
        />
      </div>
      <div className="song-info">
        <h3>{song.title}</h3>
        <p className="artist">{song.artist_name}</p>
        {song.album_title && (
          <p className="album">From: {song.album_title}</p>
        )}
        <p className="genre">{song.genre}</p>
      </div>
    </div>
  );
};

export default SongCard;
```

---

### Step 3: Image Upload Helper

```javascript
// utils/s3Upload.js
import axios from 'axios';

/**
 * Upload file to S3 using presigned URL
 * @param {File} file - The file to upload
 * @param {string} token - JWT token
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadToS3 = async (file, token) => {
  try {
    // Step 1: Get presigned URL from backend
    const response = await axios.post(
      '/api/upload-url',
      {
        filename: file.name,
        filetype: file.type
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const { uploadUrl, fileUrl } = response.data;

    // Step 2: Upload file to S3
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });

    // Step 3: Return the file URL
    return fileUrl;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Validate image file
 * @param {File} file - The image file to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPG, PNG, etc.)'
    };
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size should be less than 5MB'
    };
  }

  // Check dimensions (optional)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Recommended: At least 300x300 for cover images
      if (img.width < 300 || img.height < 300) {
        resolve({
          valid: false,
          error: 'Image should be at least 300x300 pixels'
        });
      } else {
        resolve({ valid: true, error: null });
      }
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Invalid image file'
      });
    };
    img.src = URL.createObjectURL(file);
  });
};
```

---

### Step 4: Form Validation

```javascript
// utils/validation.js

export const validateSongForm = (formData, songType) => {
  const errors = {};

  // Required fields
  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!formData.language) {
    errors.language = 'Language is required';
  }

  if (!formData.genre) {
    errors.genre = 'Genre is required';
  }

  if (!formData.audio_original_url) {
    errors.audio = 'Audio file is required';
  }

  // ⭐ Cover image validation for singles
  if (songType === 'single' && !formData.cover_image_url) {
    errors.cover_image = 'Cover image is required for standalone singles';
  }

  // Album song validation
  if (songType === 'album') {
    if (!formData.album_id) {
      errors.album = 'Please select an album';
    }
    if (!formData.track_number) {
      errors.track_number = 'Track number is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## UI/UX Recommendations

### 1. Visual Indicators

```jsx
// Show clear indicators for required fields
<div className="form-group">
  <label>
    Cover Image
    {songType === 'single' ? (
      <span className="required-badge">Required</span>
    ) : (
      <span className="optional-badge">Optional</span>
    )}
  </label>
  {/* ... */}
</div>
```

### 2. Image Preview

```jsx
// Show preview of uploaded cover
{coverFile && (
  <div className="cover-preview">
    <img 
      src={URL.createObjectURL(coverFile)} 
      alt="Cover preview"
      style={{
        width: '200px',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '8px'
      }}
    />
    <button onClick={() => {
      setCoverFile(null);
      setFormData({ ...formData, cover_image_url: '' });
    }}>
      Change Image
    </button>
  </div>
)}
```

### 3. Conditional Rendering

```jsx
// Show different instructions based on song type
{songType === 'single' ? (
  <div className="info-box">
    <p>📸 Upload a cover image for your single (required)</p>
    <p>Recommended size: 1400x1400px or 3000x3000px</p>
  </div>
) : (
  <div className="info-box">
    <p>📸 Cover image is optional - will use album cover if not provided</p>
  </div>
)}
```

---

## Error Handling

```javascript
// Handle API errors
try {
  await axios.post('/api/songs/', formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  // Success
} catch (error) {
  if (error.response?.status === 400) {
    const errorMsg = error.response.data.error;
    
    if (errorMsg.includes('cover_image_url')) {
      setError('Cover image is required for standalone singles');
    } else if (errorMsg.includes('already been submitted')) {
      setError('Cannot add songs to an album that has been submitted');
    } else {
      setError(errorMsg);
    }
  } else if (error.response?.status === 401) {
    setError('Please login again');
    // Redirect to login
  } else {
    setError('Failed to upload song. Please try again.');
  }
}
```

---

## CSS Styling Examples

```css
/* Form styling */
.upload-song-form {
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

.required-badge {
  color: #e74c3c;
  font-size: 0.9em;
  margin-left: 5px;
}

.optional-badge {
  color: #95a5a6;
  font-size: 0.9em;
  margin-left: 5px;
}

/* Cover preview */
.cover-preview {
  margin-top: 10px;
  text-align: center;
}

.cover-preview img {
  border: 2px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.cover-preview button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Info box */
.info-box {
  background: #e8f4f8;
  padding: 12px;
  border-left: 4px solid #3498db;
  margin-bottom: 15px;
}

.info-box p {
  margin: 5px 0;
  font-size: 0.9em;
}

/* Error message */
.error-message {
  background: #fee;
  color: #c00;
  padding: 10px;
  border-left: 4px solid #c00;
  margin-bottom: 15px;
}
```

---

## Testing Checklist

### Standalone Single Upload:
- [ ] Select "Standalone Single" option
- [ ] Try to submit without cover image → Should show error
- [ ] Upload audio file → Success
- [ ] Upload cover image → Preview shows
- [ ] Submit form → Song created successfully
- [ ] View song in list → Cover image displays correctly

### Album Song Upload:
- [ ] Select "Add to Album" option
- [ ] Cover image field shows as optional
- [ ] Upload without cover → Success (uses album cover)
- [ ] Upload with cover → Success (uses song's cover)
- [ ] View in album → Correct cover displays

### Edge Cases:
- [ ] Upload non-image file as cover → Show error
- [ ] Upload image > 5MB → Show error
- [ ] Upload image < 300x300px → Show warning
- [ ] Network error during S3 upload → Show error message
- [ ] Navigate away during upload → Confirm before leaving

---

## Complete Example: Simplified Component

```jsx
// SimplifiedUploadForm.jsx
import React, { useState } from 'react';
import { uploadToS3, validateImageFile } from '../utils/s3Upload';
import { validateSongForm } from '../utils/validation';
import api from '../services/api';

const SimplifiedUploadForm = () => {
  const [songType, setSongType] = useState('single');
  const [formData, setFormData] = useState({
    title: '',
    language: 'English',
    genre: 'Gospel',
    audio_original_url: '',
    cover_image_url: '',
    album_id: null
  });
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const coverUrl = await uploadToS3(file, token);
      
      setFormData({ ...formData, cover_image_url: coverUrl });
      setCoverPreview(URL.createObjectURL(file));
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateSongForm(formData, songType);
    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/songs/', formData);
      alert('Song uploaded successfully!');
      window.location.href = '/my-songs';
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upload Song</h2>

      {/* Song Type */}
      <div>
        <label>
          <input
            type="radio"
            checked={songType === 'single'}
            onChange={() => setSongType('single')}
          />
          Standalone Single
        </label>
        <label>
          <input
            type="radio"
            checked={songType === 'album'}
            onChange={() => setSongType('album')}
          />
          Add to Album
        </label>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Song Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      {/* Cover Image */}
      <div>
        <label>
          Cover Image {songType === 'single' && '*'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          required={songType === 'single'}
        />
        {coverPreview && (
          <img src={coverPreview} alt="Preview" width="200" />
        )}
      </div>

      {/* Error */}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* Submit */}
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Song'}
      </button>
    </form>
  );
};

export default SimplifiedUploadForm;
```

---

## Summary

### Key Changes:
1. ⭐ **Cover image is now REQUIRED for standalone singles**
2. ⭐ **Cover image is OPTIONAL for album songs** (uses album cover)
3. ⭐ **Add file validation** (type, size, dimensions)
4. ⭐ **Show visual indicators** (required/optional badges)
5. ⭐ **Display preview** before upload
6. ⭐ **Handle errors** gracefully

### Implementation Steps:
1. Add cover image upload field to form
2. Make it required for singles, optional for album songs
3. Upload to S3 and get URL
4. Include `cover_image_url` in API request
5. Display song cover with fallback logic

### Best Practices:
- ✅ Validate file type and size
- ✅ Show image preview before submit
- ✅ Use presigned URLs for secure S3 uploads
- ✅ Handle errors gracefully
- ✅ Provide clear instructions to users
- ✅ Show loading states during upload

Your React app now fully supports cover images for single songs! 🎵🖼️
