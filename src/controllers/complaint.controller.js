const complaintService = require('../services/complaint.service');
const db = require('../config/db');

exports.createComplaint = async (req, res) => {
  try {
    await complaintService.create(
      req.body.title,
      req.body.description,
      req.body.content_id,
      req.body.content_type,
      req.user.id,
      req.body.artist_name,
      req.body.song_name,
      req.body.album_name
    );
    res.json({ message: 'Complaint submitted' });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getByUser(req.user.id);
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getOpenComplaints();
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    await complaintService.resolve(
      req.body.complaint_id,
      req.body.action?.toUpperCase(),
      req.body.master_song_id,
      req.user.id
    );
    res.json({ message: 'Complaint resolved' });
  } catch (err) {
    console.error('Error resolving complaint:', err);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
};

// Admin searches songs by name/artist to find the reported content
exports.searchSongs = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim()}%`;
    const result = await db.query(
      `SELECT 
        s.id, s.title, s.status, s.artist_user_id,
        u.name AS artist_name,
        a.title AS album_title,
        COALESCE(s.cover_image_url, a.cover_image_url) AS cover_image_url
       FROM songs s
       JOIN users u ON u.id = s.artist_user_id
       LEFT JOIN albums a ON a.id = s.album_id
       WHERE s.title ILIKE $1 OR u.name ILIKE $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching songs:', err);
    res.status(500).json({ error: 'Failed to search songs' });
  }
};

// Admin links a song to a complaint
exports.linkContent = async (req, res) => {
  try {
    const { complaint_id, content_id, content_type } = req.body;
    if (!complaint_id || !content_id) {
      return res.status(400).json({ error: 'complaint_id and content_id are required' });
    }
    await complaintService.linkContent(complaint_id, content_id, content_type || 'SONG');
    res.json({ message: 'Content linked to complaint' });
  } catch (err) {
    console.error('Error linking content:', err);
    res.status(500).json({ error: 'Failed to link content' });
  }
};
