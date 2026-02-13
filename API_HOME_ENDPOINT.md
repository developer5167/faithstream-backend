# Home Feed API Documentation

## Endpoint
```
GET /home
```

## Description
Retrieves the home feed containing recent albums, popular songs, featured artists, and recently played songs (if user is authenticated).

## Authentication
- **Optional** - Works with or without authentication
- When authenticated: Returns personalized content including recently played songs
- When not authenticated: Returns public content only (albums, songs, artists)

---

## Request

### Headers

#### Without Authentication (Public Access)
```http
GET /home HTTP/1.1
Host: your-api-domain.com
Content-Type: application/json
```

#### With Authentication (Personalized)
```http
GET /home HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Query Parameters
None

---

## Response

### Success Response (200 OK)

#### Without Authentication
```json
{
  "albums": [
    {
      "id": 1,
      "title": "Worship Collection 2026",
      "description": "Latest worship songs",
      "image": "https://s3-url.com/album-cover.jpg",
      "release_type": "album",
      "language": "english",
      "created_at": "2026-02-01T10:30:00.000Z",
      "artist_name": "John Doe",
      "artist_display_name": "Pastor John"
    },
    {
      "id": 2,
      "title": "Praise & Glory",
      "description": "Uplifting praise songs",
      "image": "https://s3-url.com/album-cover-2.jpg",
      "release_type": "single",
      "language": "spanish",
      "created_at": "2026-01-28T15:20:00.000Z",
      "artist_name": "Maria Garcia",
      "artist_display_name": "Maria"
    }
  ],
  "songs": [
    {
      "id": 101,
      "title": "Amazing Grace",
      "description": "Classic hymn reimagined",
      "genre": "worship",
      "language": "english",
      "audio_original_url": "s3://bucket/songs/amazing-grace.mp3",
      "created_at": "2026-02-01T08:00:00.000Z",
      "image": "https://s3-url.com/song-cover.jpg",
      "album_title": "Worship Collection 2026",
      "artist_name": "John Doe",
      "artist_display_name": "Pastor John",
      "stream_count": 1523
    },
    {
      "id": 102,
      "title": "Oceans",
      "description": "Faith and trust song",
      "genre": "contemporary",
      "language": "english",
      "audio_original_url": "s3://bucket/songs/oceans.mp3",
      "created_at": "2026-01-30T12:15:00.000Z",
      "image": "https://s3-url.com/song-cover-2.jpg",
      "album_title": "Deep Waters",
      "artist_name": "Sarah Johnson",
      "artist_display_name": "Sarah J.",
      "stream_count": 2847
    }
  ],
  "artists": [
    {
      "id": 5,
      "name": "Pastor John",
      "bio": "Worship leader and songwriter with 20 years of experience",
      "image": "https://s3-url.com/artist-profile.jpg",
      "created_at": "2025-06-15T10:00:00.000Z",
      "song_count": 45,
      "album_count": 8
    },
    {
      "id": 12,
      "name": "Maria",
      "bio": "Contemporary Christian artist spreading faith through music",
      "image": "https://s3-url.com/artist-profile-2.jpg",
      "created_at": "2025-08-20T14:30:00.000Z",
      "song_count": 32,
      "album_count": 5
    }
  ]
}
```

#### With Authentication (Includes Recently Played)
```json
{
  "albums": [
    {
      "id": 1,
      "title": "Worship Collection 2026",
      "description": "Latest worship songs",
      "image": "https://s3-url.com/album-cover.jpg",
      "release_type": "album",
      "language": "english",
      "created_at": "2026-02-01T10:30:00.000Z",
      "artist_name": "John Doe",
      "artist_display_name": "Pastor John"
    }
  ],
  "songs": [
    {
      "id": 101,
      "title": "Amazing Grace",
      "description": "Classic hymn reimagined",
      "genre": "worship",
      "language": "english",
      "audio_original_url": "s3://bucket/songs/amazing-grace.mp3",
      "created_at": "2026-02-01T08:00:00.000Z",
      "image": "https://s3-url.com/song-cover.jpg",
      "album_title": "Worship Collection 2026",
      "artist_name": "John Doe",
      "artist_display_name": "Pastor John",
      "stream_count": 1523
    }
  ],
  "artists": [
    {
      "id": 5,
      "name": "Pastor John",
      "bio": "Worship leader and songwriter",
      "image": "https://s3-url.com/artist-profile.jpg",
      "created_at": "2025-06-15T10:00:00.000Z",
      "song_count": 45,
      "album_count": 8
    }
  ],
  "recentlyPlayed": [
    {
      "id": 205,
      "title": "How Great Thou Art",
      "description": "Classic hymn",
      "genre": "traditional",
      "language": "english",
      "artist_user_id": 8,
      "cover_image_url": "https://s3-url.com/album-cover-3.jpg",
      "album_title": "Hymns Collection",
      "artist_name": "David Wilson",
      "artist_display_name": "David W.",
      "artist_image": "https://s3-url.com/artist-8.jpg",
      "played_at": "2026-02-03T09:15:30.000Z"
    },
    {
      "id": 102,
      "title": "Oceans",
      "description": "Faith and trust song",
      "genre": "contemporary",
      "language": "english",
      "artist_user_id": 12,
      "cover_image_url": "https://s3-url.com/album-cover-2.jpg",
      "album_title": "Deep Waters",
      "artist_name": "Sarah Johnson",
      "artist_display_name": "Sarah J.",
      "artist_image": "https://s3-url.com/artist-12.jpg",
      "played_at": "2026-02-03T08:45:20.000Z"
    },
    {
      "id": 101,
      "title": "Amazing Grace",
      "description": "Classic hymn reimagined",
      "genre": "worship",
      "language": "english",
      "artist_user_id": 5,
      "cover_image_url": "https://s3-url.com/album-cover.jpg",
      "album_title": "Worship Collection 2026",
      "artist_name": "John Doe",
      "artist_display_name": "Pastor John",
      "artist_image": "https://s3-url.com/artist-5.jpg",
      "played_at": "2026-02-02T20:30:15.000Z"
    }
  ]
}
```

---

## Response Fields

### Albums Array
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Album unique identifier |
| `title` | String | Album title |
| `description` | String | Album description |
| `image` | String | Cover image URL |
| `release_type` | String | Type: "album", "single", "ep" |
| `language` | String | Album language |
| `created_at` | DateTime | Album creation timestamp |
| `artist_name` | String | Artist account name |
| `artist_display_name` | String | Artist display name (nullable) |

### Songs Array
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Song unique identifier |
| `title` | String | Song title |
| `description` | String | Song description (nullable) |
| `genre` | String | Music genre |
| `language` | String | Song language |
| `audio_original_url` | String | S3 key for audio file |
| `created_at` | DateTime | Song creation timestamp |
| `image` | String | Cover image URL (from album) |
| `album_title` | String | Associated album title (nullable) |
| `artist_name` | String | Artist account name |
| `artist_display_name` | String | Artist display name (nullable) |
| `stream_count` | Integer | Total number of streams |

### Artists Array
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Artist user ID |
| `name` | String | Artist display name |
| `bio` | String | Artist biography (nullable) |
| `image` | String | Profile image URL (nullable) |
| `created_at` | DateTime | Account creation timestamp |
| `song_count` | Integer | Number of approved songs |
| `album_count` | Integer | Number of approved albums |

### Recently Played Array (Only when authenticated)
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Song unique identifier |
| `title` | String | Song title |
| `description` | String | Song description (nullable) |
| `genre` | String | Music genre |
| `language` | String | Song language |
| `artist_user_id` | Integer | Artist user ID |
| `cover_image_url` | String | Album cover image URL (nullable) |
| `album_title` | String | Associated album title (nullable) |
| `artist_name` | String | Artist account name |
| `artist_display_name` | String | Artist display name (nullable) |
| `artist_image` | String | Artist profile image URL (nullable) |
| `played_at` | DateTime | Last played timestamp |

---

## Error Responses

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Notes

1. **Recently Played Tracking**: Songs are automatically added to recently played when a user streams a song for more than 30 seconds
2. **Limit**: 
   - Albums: 10 items
   - Songs: 20 items
   - Artists: 10 items
   - Recently Played: 10 items (most recent first)
3. **Sorting**:
   - Albums: By creation date (newest first)
   - Songs: By stream count (most popular first)
   - Artists: By song count (most songs first)
   - Recently Played: By played_at timestamp (most recent first)
4. **Only approved content is returned**: All albums, songs, and artists must have approved status
5. **Recently Played uniqueness**: Each song appears only once per user, with the most recent play time

---

## Implementation in Flutter

### Example API Call (using http package)

```dart
// Without authentication
Future<Map<String, dynamic>> getHomeFeed() async {
  final response = await http.get(
    Uri.parse('$baseUrl/home'),
    headers: {'Content-Type': 'application/json'},
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to load home feed');
  }
}

// With authentication
Future<Map<String, dynamic>> getHomeFeedAuth(String token) async {
  final response = await http.get(
    Uri.parse('$baseUrl/home'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to load home feed');
  }
}
```

### Usage
```dart
// Call without auth for public users
final publicFeed = await getHomeFeed();
// Response will have: albums, songs, artists (no recentlyPlayed)

// Call with auth for logged-in users
final personalizedFeed = await getHomeFeedAuth(userToken);
// Response will have: albums, songs, artists, recentlyPlayed
```
