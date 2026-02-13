# Song Cover Images & Album Management - Implementation Guide

## Overview of Changes

This document addresses two important scenarios:
1. **Standalone singles** need their own cover images
2. **Artists adding songs to albums** needs proper validation

---

## 1. 🎨 Song Cover Images (Standalone Singles)

### Problem
Previously, songs relied only on album cover images:
- ✅ **Album songs** → Use album's `cover_image_url` ✅
- ❌ **Standalone singles** → Had NO cover image ❌

### Solution
Songs now have their own `cover_image_url` field with smart fallback logic.

### Database Changes
**Migration File**: `migrations/002_add_song_cover_image.sql`

```sql
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
```

**Run Migration**:
```bash
node scripts/run-migration.js migrations/002_add_song_cover_image.sql
```

### Cover Image Logic

```
When displaying a song:
├── If song has cover_image_url → Use song's cover ✅
├── Else if song is in album → Use album's cover ✅
└── Else → No cover (show default placeholder) ⚠️
```

**SQL Query Uses**: `COALESCE(s.cover_image_url, a.cover_image_url)`
- First tries song's cover
- Falls back to album's cover
- Returns NULL if neither exists

---

## 2. 📁 Artist Adding Songs to Albums

### Artist Can Add Songs to Albums: ✅ YES

**Endpoint**: `POST /api/songs/`

**Workflow**:
1. Artist creates an album → Status: `DRAFT`
2. Artist adds songs with `album_id` → Allowed ✅
3. Artist continues adding more songs → Allowed ✅ (while DRAFT)
4. Artist submits album → Status: `PENDING`
5. Artist tries to add more songs → **BLOCKED** ❌

### Validation Rules

#### For Artists (Mobile App):
```javascript
✅ CAN add songs to album if:
   - Album is in DRAFT status
   - Album belongs to them
   - Album exists

❌ CANNOT add songs to album if:
   - Album is PENDING (under review)
   - Album is APPROVED (published)
   - Album is REJECTED
   - Album belongs to another artist
```

#### For Admins:
```javascript
✅ CAN add songs to any album (more flexible)
   - Even to PENDING/APPROVED albums
   - Useful for fixing published content
```

---

## API Changes

### Creating Standalone Single (No Album)

**Endpoint**: `POST /api/songs/`

**Request Body**:
```json
{
  "title": "Amazing Grace",
  "language": "English",
  "genre": "Gospel",
  "lyrics": "Amazing grace...",
  "description": "Beautiful hymn",
  "audio_original_url": "https://s3.../audio.mp3",
  "cover_image_url": "https://s3.../cover.jpg",  // ⭐ NEW!
  "album_id": null,  // No album = standalone single
  "track_number": null
}
```

**Notes**:
- ⭐ `cover_image_url` is **REQUIRED** for standalone singles
- If `album_id` is provided, `cover_image_url` is optional (uses album cover)

---

### Creating Song in Album (Part of Album)

**Endpoint**: `POST /api/songs/`

**Request Body**:
```json
{
  "title": "Track 1",
  "language": "English",
  "genre": "Gospel",
  "lyrics": "...",
  "description": "First track",
  "audio_original_url": "https://s3.../audio.mp3",
  "cover_image_url": null,  // Optional - will use album cover
  "album_id": 45,  // Part of album
  "track_number": 1
}
```

**Validation**:
- Album must exist ✅
- Album must belong to the artist ✅
- Album must be in `DRAFT` status ✅ (for artists)

**Error Responses**:
```json
// If album not found
{ "error": "Album not found" }

// If album not owned by artist
{ "error": "You can only add songs to your own albums" }

// If album already submitted/approved
{ 
  "error": "Cannot add songs to an album that has already been submitted or approved" 
}
```

---

## React/Mobile App Implementation

### Scenario 1: Upload Standalone Single

```javascript
// Step 1: Upload audio file to S3
const audioUrl = await uploadToS3(audioFile);

// Step 2: Upload cover image to S3
const coverUrl = await uploadToS3(coverImage);

// Step 3: Create song
const response = await api.post('/api/songs/', {
  title: "Amazing Grace",
  language: "English",
  genre: "Gospel",
  lyrics: "...",
  description: "...",
  audio_original_url: audioUrl,
  cover_image_url: coverUrl,  // ⭐ Required for singles!
  album_id: null,
  track_number: null
});

// Song is created as standalone single ✅
```

---

### Scenario 2: Create Album with Multiple Songs

```javascript
// Step 1: Create album
const albumResponse = await api.post('/api/albums/', {
  title: "Worship Collection",
  language: "English",
  release_type: "ALBUM",
  cover_image_url: albumCoverUrl,  // Album cover
  description: "..."
});

const albumId = albumResponse.data.id;
// Album status: DRAFT ✅

// Step 2: Add first song to album
await api.post('/api/songs/', {
  title: "Track 1",
  language: "English",
  genre: "Gospel",
  audio_original_url: audioUrl1,
  cover_image_url: null,  // Optional - uses album cover
  album_id: albumId,
  track_number: 1,
  lyrics: "...",
  description: "..."
});
// ✅ Allowed - Album is DRAFT

// Step 3: Add second song to album
await api.post('/api/songs/', {
  title: "Track 2",
  audio_original_url: audioUrl2,
  album_id: albumId,
  track_number: 2,
  // ... other fields
});
// ✅ Allowed - Album is still DRAFT

// Step 4: Submit album for review
await api.post('/api/albums/submit', {
  album_id: albumId
});
// Album status: PENDING ⚠️

// Step 5: Try to add another song
await api.post('/api/songs/', {
  title: "Track 3",
  album_id: albumId,  // Same album
  track_number: 3,
  // ... other fields
});
// ❌ ERROR: "Cannot add songs to an album that has already been submitted or approved"
```

---

### Scenario 3: Adding Song to Existing Draft Album

```javascript
// Artist created album yesterday (still DRAFT)
const existingAlbumId = 45;

// Check album status first (optional, for UI)
const album = await api.get(`/api/albums/my`);
const targetAlbum = album.data.find(a => a.id === existingAlbumId);

if (targetAlbum.status === 'DRAFT') {
  // Artist can add more songs ✅
  await api.post('/api/songs/', {
    title: "New Track",
    album_id: existingAlbumId,
    track_number: targetAlbum.song_count + 1,
    audio_original_url: audioUrl,
    // ... other fields
  });
} else {
  // Show error: "Album is already submitted, cannot add more songs"
  alert('This album is already submitted for review');
}
```

---

## Mobile App UI Flow

### Upload New Song Screen

```
┌─────────────────────────────┐
│  Upload New Song            │
├─────────────────────────────┤
│                             │
│ ○ Standalone Single         │
│ ○ Add to Album              │  ← Radio buttons
│                             │
├─────────────────────────────┤
│ [If Standalone Selected]    │
│                             │
│ Title: [_____________]      │
│ Genre: [_____________]      │
│ Audio: [Upload File]        │
│ Cover: [Upload Image] ⭐    │  ← Required!
│                             │
├─────────────────────────────┤
│ [If Add to Album Selected]  │
│                             │
│ Select Album:               │
│   [Dropdown - DRAFT only]   │  ← Only show DRAFT albums
│                             │
│ Title: [_____________]      │
│ Track #: [__]               │
│ Audio: [Upload File]        │
│ Cover: [Optional]           │  ← Optional, uses album cover
│                             │
└─────────────────────────────┘
```

### Album Management Screen

```
┌─────────────────────────────┐
│  My Albums                  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ Worship Vol. 1          │ │
│ │ Status: DRAFT           │ │
│ │ Songs: 3                │ │
│ │                         │ │
│ │ [Add Songs]  [Submit]   │ │  ← Both available
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Gospel Hits             │ │
│ │ Status: PENDING         │ │
│ │ Songs: 5                │ │
│ │                         │ │
│ │ [View Only]             │ │  ← Cannot add songs
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Classics Collection     │ │
│ │ Status: APPROVED ✓      │ │
│ │ Songs: 10               │ │
│ │                         │ │
│ │ [View Songs]            │ │  ← Cannot modify
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

## Validation Summary

| Scenario | Artist Can Add Songs? | Requires Cover Image? |
|----------|----------------------|----------------------|
| Standalone Single | ✅ Always | ✅ Yes (Required) |
| Album in DRAFT | ✅ Yes | ❌ No (Uses album cover) |
| Album in PENDING | ❌ No | N/A |
| Album APPROVED | ❌ No | N/A |
| Album REJECTED | ❌ No | N/A |
| Another Artist's Album | ❌ No | N/A |

**Admin Exception**: Admins can add songs to albums in any status ⚠️

---

## Testing Checklist

### For Singles:
- [ ] Upload standalone single with cover image → ✅ Success
- [ ] Upload standalone single without cover image → ❌ Error or fallback
- [ ] Display single → Shows song's cover image
- [ ] Edit single cover image → Updates song's cover

### For Albums:
- [ ] Create album → Status is DRAFT
- [ ] Add song to DRAFT album → ✅ Success
- [ ] Add multiple songs to DRAFT album → ✅ All succeed
- [ ] Submit album → Status changes to PENDING
- [ ] Try to add song to PENDING album → ❌ Error message
- [ ] Try to add song to APPROVED album → ❌ Error message
- [ ] Try to add song to another artist's album → ❌ Error message
- [ ] Display album songs → Shows album cover (if song has no cover)

### For Admin:
- [ ] Admin adds song to DRAFT album → ✅ Success
- [ ] Admin adds song to PENDING album → ✅ Success (admin override)
- [ ] Admin adds song to APPROVED album → ✅ Success (admin override)

---

## Error Handling in Mobile App

```javascript
try {
  await api.post('/api/songs/', songData);
  showSuccess('Song uploaded successfully!');
} catch (error) {
  if (error.response?.status === 400) {
    const message = error.response.data.error;
    
    if (message.includes('already been submitted')) {
      showError('This album is already submitted. Create a new album or upload as a single.');
    } else if (message.includes('your own albums')) {
      showError('You can only add songs to your own albums.');
    } else if (message.includes('not found')) {
      showError('Album not found. Please select a valid album.');
    } else {
      showError(message);
    }
  } else {
    showError('Failed to upload song. Please try again.');
  }
}
```

---

## Summary

### ✅ What Changed:

1. **Songs now have `cover_image_url` field**
   - Required for standalone singles
   - Optional for album songs (uses album cover)
   - Smart fallback: Song cover → Album cover → Null

2. **Album song addition validation**
   - Artists can add songs only to DRAFT albums
   - Cannot modify PENDING/APPROVED albums
   - Proper error messages

3. **Admin flexibility**
   - Admins can add songs to any album status
   - Useful for content management

### 📱 Mobile App Impact:

1. **Upload Single**: Must include cover image upload
2. **Upload to Album**: 
   - Filter albums to show only DRAFT status
   - Disable "Add to Album" for non-DRAFT albums
   - Show clear error messages if album locked

### 🔄 Workflow:

```
Create Album → DRAFT
  ↓
Add Songs (multiple times) → Still DRAFT ✅
  ↓
Submit Album → PENDING
  ↓
Cannot add more songs → Locked ❌
  ↓
Admin Approves → APPROVED
  ↓
Content is Live → Locked ❌
```

This ensures data integrity and prevents artists from modifying content under review or already published! 🎯
