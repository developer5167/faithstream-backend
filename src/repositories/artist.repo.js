const db = require('../config/db');

exports.create = async (data) => {
  const res = await db.query(
    `INSERT INTO artist_profiles
     (user_id, artist_name, bio, govt_id_url, selfie_video_url)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [
      data.user_id,
      data.artist_name,
      data.bio,
      data.govt_id_url,
      data.selfie_video_url
    ]
  );
  return res.rows[0];
};

exports.findByUserId = async (userId) => {
  const res = await db.query(
    `SELECT * FROM artist_profiles WHERE user_id=$1`,
    [userId]
  );
  return res.rows[0];
};

exports.getPendingRequests = async () => {
  const res = await db.query(
    `SELECT ap.*, u.name, u.email,
       COALESCE(
         (SELECT json_agg(aps.supporting_links)
          FROM artist_profiles_supportings aps
          WHERE aps.artist_id = ap.id
         ), '[]'::json
       ) as supporting_links
     FROM artist_profiles ap
     JOIN users u ON u.id = ap.user_id
     WHERE ap.verification_status='REQUESTED'`
  );
  return res.rows;
};

exports.approve = async (userId, adminId) => {
 return await db.query(
    `UPDATE artist_profiles
     SET verification_status='APPROVED',
         verified_by=$2,
         verified_at=now()
     WHERE id=$1 RETURNING *`,
    [userId, adminId]
  );
};

exports.reject = async (userId, reason) => {
  await db.query(
    `UPDATE artist_profiles
     SET verification_status='REJECTED'
     WHERE id=$1`,
    [userId]
  );
};

exports.getFeaturedArtists = async (limit = 10) => {
  const res = await db.query(
    `SELECT 
       u.id,
       COALESCE(ap.artist_name, u.name) as name,
       ap.bio,
       u.profile_pic_url as image,
       u.profile_pic_url as profile_image_url,
       u.profile_pic_url as profile_pic_url,
       u.created_at,
       COUNT(DISTINCT s.id) as song_count,
       COUNT(DISTINCT a.id) as album_count
     FROM users u
     JOIN artist_profiles ap ON ap.user_id = u.id
     LEFT JOIN songs s ON s.artist_user_id = u.id AND s.status = 'APPROVED'
     LEFT JOIN albums a ON a.artist_user_id = u.id AND a.status = 'APPROVED'
     WHERE u.artist_status = 'APPROVED'
       AND ap.verification_status = 'APPROVED'
     GROUP BY u.id, ap.artist_name, u.name, ap.bio, ap.profile_image_url, u.created_at
     ORDER BY song_count DESC, u.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};

exports.getVerifiedArtists = async (options = {}) => {
  const { search, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  let searchCondition = '';

  let params = [];
  let paramCount = 1;
  
  if (search) {
    searchCondition = `AND (LOWER(ap.artist_name) LIKE $${paramCount} OR LOWER(u.name) LIKE $${paramCount} OR LOWER(u.email) LIKE $${paramCount})`;
    params.push(`%${search.toLowerCase()}%`);
    paramCount++;
  }
  
  // Get total count
  const countRes = await db.query(
    `SELECT COUNT(*) as total
     FROM users u
     JOIN artist_profiles ap ON ap.user_id = u.id
     WHERE u.artist_status = 'APPROVED'
       AND ap.verification_status = 'APPROVED'
       ${searchCondition}`,
    params
  );
  
  // Add pagination params
  params.push(limit, offset);
  
  // Get artists with pagination
  const res = await db.query(
    `SELECT 
       u.id,
       u.name,
       u.email,
       ap.artist_name,
       ap.bio,
       u.profile_pic_url as profile_image_url,
       ap.verified_at,
       u.created_at,
       COUNT(DISTINCT s.id) as song_count,
       COUNT(DISTINCT a.id) as album_count
     FROM users u
     JOIN artist_profiles ap ON ap.user_id = u.id
     LEFT JOIN songs s ON s.artist_user_id = u.id AND s.status = 'APPROVED'
     LEFT JOIN albums a ON a.artist_user_id = u.id AND a.status = 'APPROVED'
     WHERE u.artist_status = 'APPROVED'
       AND ap.verification_status = 'APPROVED'
       ${searchCondition}
     GROUP BY u.id, u.name, u.email, ap.artist_name, ap.bio, ap.profile_image_url, ap.verified_at, u.created_at
     ORDER BY ap.verified_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );
  
  return {
    data: res.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countRes.rows[0].total),
      totalPages: Math.ceil(countRes.rows[0].total / limit)
    }
  };
};

exports.getVerifiedArtistById = async (artistId) => {
  const res = await db.query(
    `SELECT 
       u.id,
       u.name,
       u.email,
       u.phone,
       ap.artist_name,
       ap.bio,
       u.profile_pic_url as profile_image_url,
       ap.verified_at,
       ap.verified_by,
       u.created_at,
       COUNT(DISTINCT s.id) as song_count,
       COUNT(DISTINCT a.id) as album_count,
       admin.name as verified_by_name
     FROM users u
     JOIN artist_profiles ap ON ap.user_id = u.id
     LEFT JOIN users admin ON admin.id = ap.verified_by
     LEFT JOIN songs s ON s.artist_user_id = u.id AND s.status = 'APPROVED'
     LEFT JOIN albums a ON a.artist_user_id = u.id AND a.status = 'APPROVED'
     WHERE u.id = $1
       AND u.artist_status = 'APPROVED'
       AND ap.verification_status = 'APPROVED'
     GROUP BY u.id, u.name, u.email, u.phone, ap.artist_name, ap.bio, ap.profile_image_url, ap.verified_at, ap.verified_by, u.created_at, admin.name`,
    [artistId]
  );
  return res.rows[0];
};

// Supporting Links
exports.addSupportingLinks = async (artistId, links) => {
  // links is an array of URL strings
  const values = links.map((link, i) => `($1, $${i + 2})`).join(', ');
  const params = [artistId, ...links];
  await db.query(
    `INSERT INTO artist_profiles_supportings (artist_id, supporting_links) VALUES ${values}`,
    params
  );
};

exports.getSupportingLinks = async (artistId) => {
  const res = await db.query(
    `SELECT id, supporting_links FROM artist_profiles_supportings WHERE artist_id = $1`,
    [artistId]
  );
  return res.rows;
};

exports.getSupportingLinksByUserId = async (userId) => {
  const res = await db.query(
    `SELECT aps.id, aps.supporting_links
     FROM artist_profiles_supportings aps
     JOIN artist_profiles ap ON ap.id = aps.artist_id
     WHERE ap.user_id = $1`,
    [userId]
  );
  return res.rows;
};

exports.deleteSupportingLink = async (linkId) => {
  await db.query(
    `DELETE FROM artist_profiles_supportings WHERE id = $1`,
    [linkId]
  );
};
