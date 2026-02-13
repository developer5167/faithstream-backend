const db = require('../config/db');

exports.log = async ({
  admin_id,
  action_type,
  target_id,
  description
}) => {
  await db.query(
    `
    INSERT INTO admin_actions
      (admin_id, action_type, target_id, description)
    VALUES ($1,$2,$3,$4)
    `,
    [admin_id, action_type, target_id, description]
  );
};
exports.getAuditLogs = async () => {
  const res = await db.query(
    `
    SELECT
      aa.id,
      aa.action_type,
      aa.target_id,
      aa.description,
      aa.created_at,
      u.name AS admin_name,
      u.email AS admin_email
    FROM admin_actions aa
    JOIN users u ON u.id = aa.admin_id
    ORDER BY aa.created_at DESC
    LIMIT 500
    `
  );

  return res.rows;
};

exports.getStats = async () => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM artist_profiles WHERE verification_status = 'REQUESTED') AS pending_artists,
      (SELECT COUNT(*) FROM songs WHERE status = 'DRAFT') AS pending_songs,
      (SELECT COUNT(*) FROM albums WHERE status = 'DRAFT') AS pending_albums,
      (SELECT COUNT(*) FROM complaints WHERE status = 'OPEN') AS open_complaints
  `);

  return result.rows[0];
};
