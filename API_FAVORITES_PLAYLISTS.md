# Favorites and Playlists API Documentation

## Overview
Complete implementation of favorites and playlists features with full backend APIs and Flutter integration.

## Backend APIs

### Favorites Endpoints

#### GET /favorites
Get all favorite songs for the authenticated user.

**Response:**
```json
{
  "success": true,
  "favorites": [
    {
      "id": "1",
      "title": "Song Title",
      "artist_name": "Artist Name",
      "duration": 180,
      "image_url": "https://...",
      ...
    }
  ],
  "message": "Favorites retrieved successfully"
}
```

#### POST /favorites
Add a song to favorites.

**Request Body:**
```json
{
  "song_id": "123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Song added to favorites"
}
```

#### DELETE /favorites/:songId
Remove a song from favorites.

**Response:**
```json
{
  "success": true,
  "message": "Song removed from favorites"
}
```

#### GET /favorites/:songId/check
Check if a song is in favorites.

**Response:**
```json
{
  "success": true,
  "is_favorite": true
}
```

### Playlist Endpoints

#### GET /playlists
Get all playlists for the authenticated user.

**Response:**
```json
{
  "success": true,
  "playlists": [
    {
      "id": "1",
      "name": "My Playlist",
      "description": "Description",
      "is_public": false,
      "song_count": 5,
      "songs": [...],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /playlists/:id
Get a single playlist with all its songs.

**Response:**
```json
{
  "success": true,
  "playlist": {
    "id": "1",
    "name": "My Playlist",
    "songs": [...]
  }
}
```

#### POST /playlists
Create a new playlist.

**Request Body:**
```json
{
  "name": "My Playlist",
  "description": "Optional description",
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "playlist": { ... },
  "message": "Playlist created successfully"
}
```

#### PUT /playlists/:id
Update playlist details.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "is_public": true
}
```

#### DELETE /playlists/:id
Delete a playlist.

#### POST /playlists/:id/songs
Add a song to a playlist.

**Request Body:**
```json
{
  "song_id": "123"
}
```

#### DELETE /playlists/:id/songs/:songId
Remove a song from a playlist.

## Database Schema

### favorites table
```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, song_id)
);
```

### playlists table
```sql
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### playlist_songs table
```sql
CREATE TABLE playlist_songs (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, song_id)
);
```

## Flutter Integration

### Features Implemented

1. **Favorites Screen** (`lib/ui/screens/favorites_screen.dart`)
   - Display all favorite songs
   - Play all favorites
   - Remove from favorites
   - Empty state with call-to-action

2. **Playlists Screen** (`lib/ui/screens/playlists_screen.dart`)
   - Grid view of all playlists
   - Create new playlist dialog
   - Show song count per playlist
   - Public/private indicators

3. **Playlist Detail Screen** (`lib/ui/screens/playlist_detail_screen.dart`)
   - View all songs in playlist
   - Play all songs in playlist
   - Edit playlist details
   - Delete playlist
   - Remove songs from playlist

4. **Library Screen** (`lib/ui/screens/library_screen.dart`)
   - Tab navigation (Favorites & Playlists)
   - Refresh functionality
   - Integrated into main bottom navigation

5. **Favorite Button Integration**
   - Home screen song cards show favorite status
   - Search results show favorite status
   - All songs screen shows favorite status
   - Song detail screen shows favorite status
   - Heart icon turns red when favorited
   - Toggle favorite with single tap

6. **Add to Playlist Dialog**
   - Available from song detail screen
   - Shows all user playlists
   - Add song to selected playlist
   - Confirmation snackbar

### State Management

- **LibraryBloc**: Manages favorites and playlists state
- **LibraryRepository**: API calls for all library operations
- Integrated with existing PlayerBloc for playback
- Real-time UI updates when adding/removing favorites

### User Flow

1. **Favorite a Song**:
   - Tap heart icon on any song card
   - Icon turns red immediately
   - Added to favorites list
   - Synced with backend

2. **Create Playlist**:
   - Navigate to Library → Playlists
   - Tap "Create New Playlist"
   - Enter name, description, public/private
   - Playlist created and displayed

3. **Add Song to Playlist**:
   - Open song detail screen
   - Tap "Add to Playlist"
   - Select playlist from dialog
   - Song added with confirmation

4. **Play from Library**:
   - Navigate to Favorites or Playlist
   - Tap "Play All" or individual song
   - Full queue functionality
   - Mini player appears at bottom

## Testing

To test the complete flow:

1. **Backend Setup**:
   ```bash
   cd /Users/kcs/Documents/MPP/faithstream-backend
   # Migration already run ✅
   npm start
   ```

2. **Flutter App**:
   ```bash
   cd /Users/kcs/Documents/MPP/faithstream-backend/faith_stream_music_app
   flutter run
   ```

3. **Test Favorites**:
   - Tap heart icon on any song
   - Navigate to Library → Favorites
   - Verify song appears
   - Tap heart again to remove

4. **Test Playlists**:
   - Navigate to Library → Playlists
   - Create new playlist
   - Add songs from detail screens
   - View playlist detail
   - Play playlist

## Files Created/Modified

### Backend
- `migrations/002_create_favorites_and_playlists.sql` ✅
- `src/repositories/favorite.repo.js` ✅
- `src/repositories/playlist.repo.js` ✅
- `src/services/favorite.service.js` ✅
- `src/services/playlist.service.js` ✅
- `src/controllers/favorite.controller.js` ✅
- `src/controllers/playlist.controller.js` ✅
- `src/routes/favorite.routes.js` ✅
- `src/routes/playlist.routes.js` ✅
- `src/app.js` (modified) ✅

### Flutter
- `lib/models/playlist.dart` ✅
- `lib/repositories/library_repository.dart` ✅
- `lib/blocs/library/library_event.dart` ✅
- `lib/blocs/library/library_state.dart` ✅
- `lib/blocs/library/library_bloc.dart` ✅
- `lib/ui/screens/library_screen.dart` ✅
- `lib/ui/screens/favorites_screen.dart` ✅
- `lib/ui/screens/playlists_screen.dart` ✅
- `lib/ui/screens/playlist_detail_screen.dart` ✅
- `lib/ui/screens/main_navigation_screen.dart` ✅
- `lib/ui/widgets/song_card.dart` (modified) ✅
- `lib/ui/screens/home_screen.dart` (modified) ✅
- `lib/ui/screens/song_detail_screen.dart` (modified) ✅
- `lib/ui/screens/all_songs_screen.dart` (modified) ✅
- `lib/ui/screens/search_screen.dart` (modified) ✅
- `lib/main.dart` (modified) ✅
- `lib/config/app_router.dart` (modified) ✅
