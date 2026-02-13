# Log Stream API Documentation

## Endpoint
```
POST /stream/log
```

## Description
Logs a song stream event when user plays a song. Tracks the play duration for analytics, payouts, and automatically adds the song to user's recently played history (if duration ≥ 30 seconds).

## Authentication
**Required** - Must include valid JWT Bearer token

---

## Request

### Headers
```http
POST /stream/log HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Body
```json
{
  "song_id": 101,
  "duration": 45
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `song_id` | Integer | Yes | The ID of the song that was played |
| `duration` | Integer | Yes | Play duration in seconds |

---

## Response

### Success Response (200 OK)
```json
{
  "ok": true
}
```

### Error Responses

#### 401 Unauthorized (No token or invalid token)
```json
{
  "error": "Authorization header missing"
}
```
or
```json
{
  "error": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Important Notes

1. **30-Second Threshold**: Only streams with `duration >= 30` seconds are logged (anti-fraud measure)
2. **Recently Played**: When duration ≥ 30s, the song is automatically added/updated in user's recently played list
3. **Call Timing**: Call this endpoint when:
   - User finishes playing a song
   - User skips to next song
   - User exits the player
   - App goes to background
4. **No Response Data Needed**: The `{ "ok": true }` response just confirms the log was received

---

## Flutter Implementation

### 1. Create API Service Method

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class StreamService {
  final String baseUrl = 'https://your-api-domain.com';
  
  /// Log a song stream event
  /// Call this when user finishes playing or skips a song
  Future<void> logStream({
    required int songId,
    required int durationSeconds,
    required String authToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/stream/log'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'song_id': songId,
          'duration': durationSeconds,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to log stream: ${response.body}');
      }
    } catch (e) {
      print('Error logging stream: $e');
      // Handle error silently - don't block user experience
    }
  }
}
```

### 2. Usage in Audio Player

```dart
class AudioPlayerController {
  final StreamService _streamService = StreamService();
  final String _authToken = 'user_jwt_token'; // Get from auth state
  
  int _currentSongId = 0;
  int _playedDuration = 0;
  Timer? _progressTimer;
  
  void playSong(int songId) {
    _currentSongId = songId;
    _playedDuration = 0;
    
    // Start tracking play time
    _progressTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      _playedDuration++;
    });
    
    // Start audio playback...
  }
  
  void onSongEnded() {
    _progressTimer?.cancel();
    
    // Log the stream
    _streamService.logStream(
      songId: _currentSongId,
      durationSeconds: _playedDuration,
      authToken: _authToken,
    );
  }
  
  void onSkipOrStop() {
    _progressTimer?.cancel();
    
    // Log whatever was played so far
    _streamService.logStream(
      songId: _currentSongId,
      durationSeconds: _playedDuration,
      authToken: _authToken,
    );
  }
  
  @override
  void dispose() {
    _progressTimer?.cancel();
    // Log before disposing
    if (_playedDuration > 0) {
      _streamService.logStream(
        songId: _currentSongId,
        durationSeconds: _playedDuration,
        authToken: _authToken,
      );
    }
    super.dispose();
  }
}
```

### 3. Using with audio_players Package

```dart
import 'package:audioplayers/audioplayers.dart';

class MusicPlayer {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final StreamService _streamService = StreamService();
  
  int _currentSongId = 0;
  DateTime? _startTime;
  
  Future<void> play(int songId, String audioUrl, String token) async {
    _currentSongId = songId;
    _startTime = DateTime.now();
    
    await _audioPlayer.play(UrlSource(audioUrl));
    
    // Listen for completion
    _audioPlayer.onPlayerComplete.listen((_) {
      _logCurrentStream(token);
    });
  }
  
  Future<void> pause(String token) async {
    await _audioPlayer.pause();
    _logCurrentStream(token);
  }
  
  Future<void> stop(String token) async {
    await _audioPlayer.stop();
    _logCurrentStream(token);
  }
  
  void _logCurrentStream(String token) {
    if (_startTime == null) return;
    
    final duration = DateTime.now().difference(_startTime!).inSeconds;
    
    _streamService.logStream(
      songId: _currentSongId,
      durationSeconds: duration,
      authToken: token,
    );
    
    _startTime = null;
  }
}
```

---

## Testing

### Test with cURL

```bash
curl -X POST http://localhost:3000/stream/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "song_id": 101,
    "duration": 45
  }'
```

### Expected Behavior

| Duration | Result |
|----------|--------|
| 15 seconds | ❌ Not logged (< 30s threshold) |
| 30 seconds | ✅ Logged to streams + Added to recently played |
| 120 seconds | ✅ Logged to streams + Added to recently played |

---

## Best Practices

1. **Don't block UI**: Log streams asynchronously, handle errors silently
2. **Track actual play time**: Use timers or audio player position
3. **Handle app lifecycle**: Log on app background/termination
4. **Batch if needed**: For poor connectivity, consider queuing and retrying
5. **User experience first**: Don't wait for response before allowing next action
