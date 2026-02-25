const searchService = require('../services/search.service');

exports.searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({
        songs: [],
        albums: [],
        artists: []
      });
    }

    const results = await searchService.performSearch(q);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};
