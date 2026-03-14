const db = require('../config/db');
const redisClient = require('../config/redis');

class SearchService {
  async performSearch(query) {
    const rawQuery = query.toLowerCase().trim();
    const cacheKey = `search:${rawQuery}`;

    // 1. Check Redis Cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('[Redis] Search cache read error:', err.message);
    }

    // Add wildcards for ILIKE matching
    const searchTerm = `%${rawQuery}%`;
    const searchParams = [searchTerm];

    // Combine 3 concurrent searches into a single Promise.all
    const [artistsResult, albumsResult, songsResult] = await Promise.all([
      // 1. Search Artists
      db.query(
        `SELECT u.id, u.name, u.profile_pic_url, ap.bio, u.role, u.created_at,
                COUNT(st.id) as total_streams
         FROM users u
         JOIN artist_profiles ap ON ap.user_id = u.id
         LEFT JOIN songs s ON s.artist_user_id = u.id AND s.status = 'APPROVED'
         LEFT JOIN streams st ON st.song_id = s.id
         WHERE u.role = 'ARTIST' AND (u.name ILIKE $1 OR ap.artist_name ILIKE $1)
         GROUP BY u.id, u.name, u.profile_pic_url, ap.bio, u.role, u.created_at
         LIMIT 20`,
        searchParams
      ),

      // 2. Search Albums (Approved only)
      db.query(
        `SELECT a.id, a.title, a.cover_image_url, a.created_at as release_date, a.status,
                u.name as display_artist, a.artist_user_id
         FROM albums a
         JOIN users u ON a.artist_user_id = u.id
         WHERE a.status = 'APPROVED'
           AND (a.title ILIKE $1 OR u.name ILIKE $1)
         LIMIT 20`,
        searchParams
      ),

      // 3. Search Songs (Approved only)
      db.query(
        `SELECT s.id, s.title, s.audio_original_url, s.audio_processed_url,
                s.genre, s.language, s.status, s.lyrics, s.description,
                u.name as display_artist, s.artist_user_id,
                a.title as album_title, s.album_id,
                COALESCE(stream_counts.count, 0) as stream_count,
                COALESCE(
                  s.cover_image_url,
                  a.cover_image_url,
                  ap.profile_image_url,
                  u.profile_pic_url
                ) as image
         FROM songs s
         JOIN users u ON s.artist_user_id = u.id
         LEFT JOIN albums a ON s.album_id = a.id
         LEFT JOIN artist_profiles ap ON ap.user_id = s.artist_user_id
         LEFT JOIN (
           SELECT song_id, COUNT(*) as count
           FROM streams
           GROUP BY song_id
         ) stream_counts ON stream_counts.song_id = s.id
         WHERE s.status = 'APPROVED'
           AND (s.title ILIKE $1 OR u.name ILIKE $1 OR s.genre ILIKE $1 OR a.title ILIKE $1)
         ORDER BY stream_counts.count DESC NULLS LAST, s.created_at DESC
         LIMIT 50`,
        searchParams
      )
    ]);

    // Map the database output to camelCase objects for the Flutter frontend
    return {
      songs: songsResult.rows.map(song => ({
        id: song.id,
        title: song.title,
        cover_image_url: song.image,
        audio_original_url: song.audio_original_url,
        audio_processed_url: song.audio_processed_url,
        genre: song.genre,
        language: song.language,
        status: song.status,
        lyrics: song.lyrics,
        description: song.description,
        artist_display_name: song.display_artist,
        artist_user_id: song.artist_user_id,
        album_title: song.album_title,
        album_id: song.album_id,
        stream_count: song.stream_count
      })),

      albums: albumsResult.rows.map(album => ({
        id: album.id,
        title: album.title,
        coverImageUrl: album.cover_image_url,
        releaseDate: album.release_date,
        status: album.status,
        displayArtist: album.display_artist,
        artistId: album.artist_user_id
      })),

      artists: artistsResult.rows.map(artist => ({
        id: artist.id,
        name: artist.name,
        profilePicUrl: artist.profile_pic_url,
        bio: artist.bio,
        role: artist.role,
        createdAt: artist.created_at,
        total_streams: artist.total_streams
      }))
    };

    // 2. Set to Redis Cache (10 minutes = 600 seconds)
    try {
      await redisClient.set(cacheKey, JSON.stringify(results), { EX: 600 });
    } catch (err) {
      console.error('[Redis] Search cache write error:', err.message);
    }

    return results;
  }
}

module.exports = new SearchService();
