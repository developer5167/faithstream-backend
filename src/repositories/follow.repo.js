const db = require('../config/db');

exports.follow = async (followerId, artistId) => {
  const res = await db.query(
    `INSERT INTO user_follows (follower_user_id, artist_user_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_user_id, artist_user_id) DO NOTHING
     RETURNING *`,
    [followerId, artistId]
  );
  return res.rows[0];
};

exports.unfollow = async (followerId, artistId) => {
  const res = await db.query(
    `DELETE FROM user_follows
     WHERE follower_user_id = $1 AND artist_user_id = $2
     RETURNING *`,
    [followerId, artistId]
  );
  return res.rows[0];
};

exports.isFollowing = async (followerId, artistId) => {
  const res = await db.query(
    `SELECT EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_user_id = $1 AND artist_user_id = $2
    )`,
    [followerId, artistId]
  );
  return res.rows[0].exists;
};

exports.getFollowerCount = async (artistId) => {
  const res = await db.query(
    `SELECT COUNT(*) FROM user_follows WHERE artist_user_id = $1`,
    [artistId]
  );
  return parseInt(res.rows[0].count);
};

exports.getFollowers = async (artistId) => {
  const res = await db.query(
    `SELECT follower_user_id FROM user_follows WHERE artist_user_id = $1`,
    [artistId]
  );
  return res.rows.map(row => row.follower_user_id);
};

exports.getTopArtistsByFollowers = async (limit = 10) => {
  const res = await db.query(
    `SELECT u.id, 
            COALESCE(ap.artist_name, u.name) as name, 
            u.profile_pic_url, 
            u.profile_pic_url as profile_image_url,
            COUNT(f.follower_user_id) as total_followers,
            COUNT(f.follower_user_id) as follower_count
     FROM users u
     LEFT JOIN artist_profiles ap ON u.id = ap.user_id
     LEFT JOIN user_follows f ON u.id = f.artist_user_id
     WHERE u.artist_status = 'APPROVED'
     GROUP BY u.id, ap.artist_name, u.name, u.profile_pic_url
     HAVING COUNT(f.follower_user_id) > 0
     ORDER BY follower_count DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};
exports.getFollowedArtists = async (followerId, limit = 10) => {
  const res = await db.query(
    `SELECT u.id, 
            COALESCE(ap.artist_name, u.name) as name, 
            u.profile_pic_url, 
            u.profile_pic_url as profile_image_url
     FROM users u
     JOIN artist_profiles ap ON u.id = ap.user_id
     JOIN user_follows f ON u.id = f.artist_user_id
     WHERE f.follower_user_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2`,
    [followerId, limit]
  );
  return res.rows;
};
