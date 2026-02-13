# Admin Upload Songs/Albums on Behalf of Artists

This document explains how to implement the admin feature for uploading songs and albums on behalf of artists in your React web application.

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [Implementation Flow](#implementation-flow)
5. [React Implementation Guide](#react-implementation-guide)
6. [Error Handling](#error-handling)

---

## Overview

This feature allows administrators to:
- View all verified artists
- Upload songs on behalf of any artist
- Create and manage albums on behalf of any artist
- All uploads are tracked with admin audit logs

**Use Case**: When admins collaborate with popular artists and need to upload their content initially or manage content for artists who prefer administrative assistance.

---

## API Endpoints

### 1. Get List of Verified Artists
**Endpoint**: `GET /api/admin/artists`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
```

**Response**:
```json
[
  {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "artist_name": "JD Music",
    "bio": "Gospel artist from LA",
    "created_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": 124,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "artist_name": "Faithful Jane",
    "bio": "Christian worship leader",
    "created_at": "2025-01-20T14:20:00Z"
  }
]
```

---

### 2. Create Song on Behalf of Artist
**Endpoint**: `POST /api/songs/admin/create-for-artist`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "artist_user_id": 123,
  "title": "Amazing Grace",
  "language": "English",
  "genre": "Gospel",
  "lyrics": "Amazing grace, how sweet the sound...",
  "description": "Classic hymn performed by JD Music",
  "audio_original_url": "https://s3.amazonaws.com/bucket/audio/amazing-grace.mp3",
  "cover_image_url": "https://s3.amazonaws.com/bucket/covers/amazing-grace.jpg",  // Required for standalone singles
  "album_id": 45,  // Optional - if song belongs to an album
  "track_number": 1  // Optional - track position in album
}
```

**Response**:
```json
{
  "id": 789,
  "artist_user_id": 123,
  "title": "Amazing Grace",
  "language": "English",
  "genre": "Gospel",
  "lyrics": "Amazing grace, how sweet the sound...",
  "description": "Classic hymn performed by JD Music",
  "audio_original_url": "https://s3.amazonaws.com/bucket/audio/amazing-grace.mp3",
  "status": "DRAFT",
  "album_id": 45,
  "track_number": 1,
  "created_at": "2025-02-04T12:00:00Z"
}
```

**Notes**:
- Song is created in `DRAFT` status by default
- Admin action is logged in audit logs
- **For standalone singles** (no `album_id`): `cover_image_url` is **REQUIRED**
- **For album songs**: `cover_image_url` is optional (will use album's cover image)
- Admins can add songs to albums in any status (DRAFT/PENDING/APPROVED)

---

### 3. Create Album on Behalf of Artist
**Endpoint**: `POST /api/albums/admin/create-for-artist`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "artist_user_id": 123,
  "title": "Worship Collection Vol. 1",
  "description": "Collection of worship songs",
  "language": "English",
  "release_type": "ALBUM",  // or "SINGLE", "EP"
  "cover_image_url": "https://s3.amazonaws.com/bucket/covers/worship-vol1.jpg"
}
```

**Response**:
```json
{
  "id": 45,
  "artist_user_id": 123,
  "title": "Worship Collection Vol. 1",
  "description": "Collection of worship songs",
  "language": "English",
  "release_type": "ALBUM",
  "cover_image_url": "https://s3.amazonaws.com/bucket/covers/worship-vol1.jpg",
  "status": "DRAFT",
  "created_at": "2025-02-04T11:00:00Z"
}
```

**Notes**:
- Album is created in `DRAFT` status
- Songs must be added separately after album creation
- Admin action is logged in audit logs

---

### 4. Submit Album for Review (On Behalf of Artist)
**Endpoint**: `POST /api/albums/admin/submit-for-artist`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "album_id": 45,
  "artist_user_id": 123
}
```

**Response**:
```json
{
  "message": "Album submitted for review"
}
```

**Notes**:
- Album must have at least one song before submission
- Changes album status from `DRAFT` to `PENDING`
- All songs in album are also marked as `PENDING`

---

## Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header
2. User must have admin role/privileges
3. Token format: `Bearer <jwt_token>`

**Getting the Token**:
- Admin logs in via `/api/auth/login`
- Store the returned token securely (localStorage/sessionStorage)
- Include in all subsequent requests

**Example**:
```javascript
const token = localStorage.getItem('adminToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## Implementation Flow

### Flow 1: Upload Standalone Song (Single)

```
1. Admin Login
   ↓
2. Navigate to "Upload for Artist" page
   ↓
3. GET /api/admin/artists
   → Display artist dropdown/search
   ↓
4. Admin selects artist
   ↓
5. Admin fills song form:
   - Title, Language, Genre
   - Lyrics, Description
   - Upload audio file to S3
   ↓
6. POST /api/songs/admin/create-for-artist
   {
     artist_user_id: <selected_artist_id>,
     title: "Song Title",
     audio_original_url: <s3_url>,
     ... (no album_id)
   }
   ↓
7. Song created in DRAFT status
   ↓
8. Admin can then approve it via existing approval flow:
   - GET /api/songs/admin/pending
   - POST /api/songs/admin/approve
```

---

### Flow 2: Upload Album with Multiple Songs

```
1. Admin Login
   ↓
2. Navigate to "Upload Album for Artist" page
   ↓
3. GET /api/admin/artists
   → Display artist dropdown/search
   ↓
4. Admin selects artist
   ↓
5. Admin fills album form:
   - Title, Description
   - Language, Release Type
   - Upload cover image to S3
   ↓
6. POST /api/albums/admin/create-for-artist
   {
     artist_user_id: <selected_artist_id>,
     title: "Album Title",
     cover_image_url: <s3_url>,
     ...
   }
   → Returns album with album.id
   ↓
7. For each song in album:
   a. Admin fills song form
   b. Upload audio file to S3
   c. POST /api/songs/admin/create-for-artist
      {
        artist_user_id: <selected_artist_id>,
        album_id: <created_album_id>,
        track_number: 1, 2, 3, ...
        title: "Song Title",
        audio_original_url: <s3_url>,
        ...
      }
   d. Repeat for all songs
   ↓
8. After all songs added:
   POST /api/albums/admin/submit-for-artist
   {
     album_id: <album_id>,
     artist_user_id: <artist_id>
   }
   ↓
9. Album + all songs moved to PENDING status
   ↓
10. Admin can approve via existing approval flow:
    - GET /api/albums/admin/pending
    - POST /api/albums/admin/approve
```

---

## React Implementation Guide

### Step 1: Create Artist Selection Component

```jsx
// components/ArtistSelector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ArtistSelector = ({ onArtistSelect, selectedArtistId }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/artists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArtists(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load artists');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading artists...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="artist-selector">
      <label>Select Artist:</label>
      <select 
        value={selectedArtistId || ''} 
        onChange={(e) => onArtistSelect(parseInt(e.target.value))}
        required
      >
        <option value="">-- Choose an Artist --</option>
        {artists.map(artist => (
          <option key={artist.id} value={artist.id}>
            {artist.artist_name} ({artist.name}) - {artist.email}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ArtistSelector;
```

---

### Step 2: Create Upload Song Component

```jsx
// pages/admin/UploadSongForArtist.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ArtistSelector from '../../components/ArtistSelector';

const UploadSongForArtist = () => {
  const [artistId, setArtistId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    language: '',
    genre: '',
    lyrics: '',
    description: '',
    audio_original_url: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    
    // Upload to S3 (implement your S3 upload logic)
    // This is a placeholder - implement based on your S3 setup
    try {
      const s3Url = await uploadToS3(file);
      setFormData({
        ...formData,
        audio_original_url: s3Url
      });
    } catch (err) {
      setMessage('Failed to upload audio file');
    }
  };

  const uploadToS3 = async (file) => {
    // Implement your S3 upload logic here
    // This could be presigned URLs or direct upload via API
    // Return the S3 URL after successful upload
    
    // Example with presigned URL:
    // 1. Get presigned URL from backend
    // 2. Upload file to S3 using presigned URL
    // 3. Return the file URL
    
    return 'https://s3.amazonaws.com/your-bucket/audio/' + file.name;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!artistId) {
      setMessage('Please select an artist');
      return;
    }

    if (!formData.audio_original_url) {
      setMessage('Please upload an audio file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        '/api/songs/admin/create-for-artist',
        {
          artist_user_id: artistId,
          ...formData
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage(`Song "${response.data.title}" created successfully!`);
      // Reset form
      setFormData({
        title: '',
        language: '',
        genre: '',
        lyrics: '',
        description: '',
        audio_original_url: ''
      });
      setAudioFile(null);
      setArtistId(null);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-song-container">
      <h1>Upload Song for Artist</h1>
      
      <form onSubmit={handleSubmit}>
        <ArtistSelector 
          selectedArtistId={artistId}
          onArtistSelect={setArtistId}
        />

        <div className="form-group">
          <label>Song Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Language:</label>
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
            {/* Add more languages */}
          </select>
        </div>

        <div className="form-group">
          <label>Genre:</label>
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
            {/* Add more genres */}
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

        <div className="form-group">
          <label>Audio File:</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            required
          />
          {audioFile && <p>Selected: {audioFile.name}</p>}
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Create Song'}
        </button>
      </form>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UploadSongForArtist;
```

---

### Step 3: Create Upload Album Component

```jsx
// pages/admin/UploadAlbumForArtist.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ArtistSelector from '../../components/ArtistSelector';

const UploadAlbumForArtist = () => {
  const [artistId, setArtistId] = useState(null);
  const [step, setStep] = useState(1); // 1: Album details, 2: Add songs
  const [albumData, setAlbumData] = useState({
    title: '',
    description: '',
    language: '',
    release_type: 'ALBUM',
    cover_image_url: ''
  });
  const [createdAlbumId, setCreatedAlbumId] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState({
    title: '',
    language: '',
    genre: '',
    lyrics: '',
    description: '',
    audio_original_url: '',
    track_number: 1
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1: Create Album
  const handleAlbumInputChange = (e) => {
    setAlbumData({
      ...albumData,
      [e.target.name]: e.target.value
    });
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const s3Url = await uploadToS3(file);
      setAlbumData({
        ...albumData,
        cover_image_url: s3Url
      });
    } catch (err) {
      setMessage('Failed to upload cover image');
    }
  };

  const createAlbum = async (e) => {
    e.preventDefault();
    
    if (!artistId) {
      setMessage('Please select an artist');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        '/api/albums/admin/create-for-artist',
        {
          artist_user_id: artistId,
          ...albumData
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCreatedAlbumId(response.data.id);
      setMessage(`Album "${response.data.title}" created! Now add songs.`);
      setStep(2); // Move to adding songs
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Add Songs to Album
  const handleSongInputChange = (e) => {
    setCurrentSong({
      ...currentSong,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const s3Url = await uploadToS3(file);
      setCurrentSong({
        ...currentSong,
        audio_original_url: s3Url
      });
    } catch (err) {
      setMessage('Failed to upload audio file');
    }
  };

  const addSongToAlbum = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        '/api/songs/admin/create-for-artist',
        {
          artist_user_id: artistId,
          album_id: createdAlbumId,
          ...currentSong
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSongs([...songs, response.data]);
      setMessage(`Song "${response.data.title}" added!`);
      
      // Reset song form for next song
      setCurrentSong({
        title: '',
        language: albumData.language, // Keep same language
        genre: '',
        lyrics: '',
        description: '',
        audio_original_url: '',
        track_number: songs.length + 2 // Next track number
      });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const submitAlbumForReview = async () => {
    if (songs.length === 0) {
      setMessage('Please add at least one song before submitting');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        '/api/albums/admin/submit-for-artist',
        {
          album_id: createdAlbumId,
          artist_user_id: artistId
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage('Album submitted for review successfully!');
      // Redirect or reset
      setTimeout(() => {
        window.location.href = '/admin/albums/pending';
      }, 2000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const uploadToS3 = async (file) => {
    // Implement your S3 upload logic
    return 'https://s3.amazonaws.com/your-bucket/' + file.name;
  };

  return (
    <div className="upload-album-container">
      <h1>Upload Album for Artist</h1>

      {step === 1 && (
        <div className="step-1">
          <h2>Step 1: Album Details</h2>
          <form onSubmit={createAlbum}>
            <ArtistSelector 
              selectedArtistId={artistId}
              onArtistSelect={setArtistId}
            />

            <div className="form-group">
              <label>Album Title:</label>
              <input
                type="text"
                name="title"
                value={albumData.title}
                onChange={handleAlbumInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={albumData.description}
                onChange={handleAlbumInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Language:</label>
              <select
                name="language"
                value={albumData.language}
                onChange={handleAlbumInputChange}
                required
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                {/* Add more */}
              </select>
            </div>

            <div className="form-group">
              <label>Release Type:</label>
              <select
                name="release_type"
                value={albumData.release_type}
                onChange={handleAlbumInputChange}
                required
              >
                <option value="ALBUM">Album</option>
                <option value="EP">EP</option>
                <option value="SINGLE">Single</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cover Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                required
              />
            </div>

            <button type="submit" disabled={uploading}>
              {uploading ? 'Creating...' : 'Create Album'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="step-2">
          <h2>Step 2: Add Songs to Album</h2>
          <p>Album: {albumData.title}</p>
          <p>Songs added: {songs.length}</p>

          <div className="songs-list">
            <h3>Songs in Album:</h3>
            {songs.map((song, idx) => (
              <div key={song.id} className="song-item">
                {idx + 1}. {song.title}
              </div>
            ))}
          </div>

          <form onSubmit={addSongToAlbum}>
            <h3>Add New Song</h3>

            <div className="form-group">
              <label>Track Number:</label>
              <input
                type="number"
                name="track_number"
                value={currentSong.track_number}
                onChange={handleSongInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Song Title:</label>
              <input
                type="text"
                name="title"
                value={currentSong.title}
                onChange={handleSongInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Language:</label>
              <input
                type="text"
                name="language"
                value={currentSong.language}
                onChange={handleSongInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Genre:</label>
              <input
                type="text"
                name="genre"
                value={currentSong.genre}
                onChange={handleSongInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={currentSong.description}
                onChange={handleSongInputChange}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Lyrics:</label>
              <textarea
                name="lyrics"
                value={currentSong.lyrics}
                onChange={handleSongInputChange}
                rows="6"
              />
            </div>

            <div className="form-group">
              <label>Audio File:</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                required
              />
            </div>

            <button type="submit" disabled={uploading}>
              {uploading ? 'Adding...' : 'Add Song to Album'}
            </button>
          </form>

          <div className="submit-album">
            <button 
              onClick={submitAlbumForReview}
              disabled={uploading || songs.length === 0}
              className="submit-btn"
            >
              Submit Album for Review
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UploadAlbumForArtist;
```

---

### Step 4: Setup Axios Configuration

```jsx
// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Step 5: Add Navigation/Routing

```jsx
// App.jsx or Routes configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadSongForArtist from './pages/admin/UploadSongForArtist';
import UploadAlbumForArtist from './pages/admin/UploadAlbumForArtist';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes ... */}
        
        {/* Admin Routes */}
        <Route path="/admin/upload-song" element={<UploadSongForArtist />} />
        <Route path="/admin/upload-album" element={<UploadAlbumForArtist />} />
        
        {/* ... other routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Error Handling

### Common Errors and Solutions

#### 1. **401 Unauthorized**
- **Cause**: Invalid or expired token, or user is not an admin
- **Solution**: Redirect to login page, ensure user has admin role

#### 2. **400 Bad Request**
- **Cause**: Missing required fields or invalid data format
- **Solution**: Validate all form fields before submission

#### 3. **404 Not Found**
- **Cause**: Artist ID doesn't exist or album ID is invalid
- **Solution**: Verify artist selection before proceeding

#### 4. **500 Internal Server Error**
- **Cause**: Database error or server issue
- **Solution**: Check server logs, retry operation

### Error Handling Example

```javascript
try {
  const response = await api.post('/api/songs/admin/create-for-artist', data);
  // Success handling
} catch (error) {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 401:
        setError('Unauthorized. Please login again.');
        // Redirect to login
        break;
      case 400:
        setError('Invalid data: ' + error.response.data.message);
        break;
      case 404:
        setError('Artist not found');
        break;
      default:
        setError('Server error. Please try again.');
    }
  } else if (error.request) {
    // Request made but no response
    setError('Network error. Please check your connection.');
  } else {
    // Other errors
    setError('An unexpected error occurred.');
  }
}
```

---

## Security Considerations

1. **Admin Authentication**: Always verify admin token on backend
2. **File Upload**: 
   - Validate file types (audio/image only)
   - Limit file sizes
   - Use presigned URLs for S3 uploads to avoid exposing credentials
3. **Input Validation**: Sanitize all inputs on backend
4. **Audit Logs**: All admin actions are logged automatically
5. **Rate Limiting**: Consider implementing rate limits on upload endpoints

---

## S3 Upload Implementation

### Option 1: Presigned URL (Recommended)

**Backend Endpoint** (create this):
```javascript
// In admin.controller.js
exports.getUploadUrl = async (req, res) => {
  const { filename, filetype } = req.body;
  
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: `uploads/${Date.now()}-${filename}`,
    ContentType: filetype,
    Expires: 300 // 5 minutes
  };
  
  const uploadUrl = await s3.getSignedUrl('putObject', s3Params);
  const fileUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Params.Key}`;
  
  res.json({ uploadUrl, fileUrl });
};
```

**Frontend Usage**:
```javascript
const uploadToS3 = async (file) => {
  // 1. Get presigned URL
  const { uploadUrl, fileUrl } = await api.post('/api/admin/upload-url', {
    filename: file.name,
    filetype: file.type
  });
  
  // 2. Upload to S3
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type }
  });
  
  // 3. Return the file URL
  return fileUrl;
};
```

### Option 2: Direct Backend Upload

Upload file to backend, backend handles S3 upload. Use multipart/form-data.

---

## Testing Checklist

- [ ] Admin can view list of verified artists
- [ ] Admin can create standalone song for artist
- [ ] Admin can create album for artist
- [ ] Admin can add multiple songs to album
- [ ] Admin can submit album for review
- [ ] All uploads are logged in audit logs
- [ ] Error messages display correctly
- [ ] File uploads work (audio and images)
- [ ] Form validation works
- [ ] Unauthorized access is blocked

---

## Summary

This feature enables admins to:
1. **Select any verified artist** from a dropdown
2. **Upload songs** individually or as part of albums
3. **Manage content** on behalf of artists who may not be tech-savvy
4. **Track all actions** via audit logs

The implementation is straightforward:
- Use admin authentication
- Fetch artist list
- Upload files to S3
- Call admin endpoints with artist_user_id
- All actions are automatically logged

The React implementation follows standard form handling patterns with proper error handling and loading states.
