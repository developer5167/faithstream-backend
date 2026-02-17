const db = require('../config/db');

exports.create = async (data) => {
  const res = await db.query(
    `INSERT INTO albums
     (artist_user_id, title, description, language, release_type, cover_image_url)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.artist_user_id,
      data.title,
      data.description,
      data.language,
      data.release_type,
      data.cover_image_url
    ]
  );
  return res.rows[0];
};

exports.findByArtist = async (artistId) => {
  const res = await db.query(
    `SELECT * FROM albums WHERE artist_user_id=$1 ORDER BY created_at DESC`,
    [artistId]
  );
  return res.rows;
};

exports.findPublicByArtist = async (artistId) => {
  try{
  const res = await db.query(
    `SELECT a.*,
            u.name as artist_name,
            ap.artist_name as artist_display_name
     FROM albums a
     JOIN users u ON u.id = a.artist_user_id
     LEFT JOIN artist_profiles ap ON ap.user_id = a.artist_user_id
     WHERE a.artist_user_id=$1 AND a.status='APPROVED' 
     ORDER BY a.created_at DESC`,
    [artistId]
  );
  return res.rows;
}catch(error){
  console.log(error);
}
};

exports.findPending = async () => {
  const res = await db.query(
    `SELECT * FROM albums WHERE status='DRAFT' OR status='DRAFT' ORDER BY created_at DESC`
  );
  return res.rows;
};

exports.updateStatus = async (albumId, status) => {
 console.log('Updating album status:', { albumId, status });
  await db.query(
    `UPDATE albums SET status=$2 WHERE id=$1`,
    [albumId, status]
  );
};

exports.reject = async (albumId, reason) => {
  await db.query(
    `UPDATE albums SET status='REJECTED' WHERE id=$1`,
    [albumId]
  );
};

exports.findById = async (albumId) => {
  const res = await db.query(
    `SELECT * FROM albums WHERE id=$1`,
    [albumId]
  );
  return res.rows[0];
};


exports.update = async (albumId, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.cover_image_url !== undefined) {
    fields.push(`cover_image_url = $${paramCount}`);
    values.push(data.cover_image_url);
    paramCount++;
  }

  if (data.title !== undefined) {
    fields.push(`title = $${paramCount}`);
    values.push(data.title);
    paramCount++;
  }

  if (data.description !== undefined) {
    fields.push(`description = $${paramCount}`);
    values.push(data.description);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(albumId);
  const query = `UPDATE albums SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const res = await db.query(query, values);
  return res.rows[0];
};

exports.getRecentApproved = async (limit = 10) => {
  const res = await db.query(
    `SELECT 
       a.id, 
       a.title, 
       a.description,
       a.cover_image_url as image,
       a.release_type,
       a.language,
       a.created_at,
       u.name as artist_name,
       ap.artist_name as artist_display_name
     FROM albums a
     JOIN users u ON u.id = a.artist_user_id
     LEFT JOIN artist_profiles ap ON ap.user_id = a.artist_user_id
     WHERE a.status = 'APPROVED'
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};
