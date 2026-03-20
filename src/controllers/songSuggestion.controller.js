const repo = require('../repositories/songSuggestion.repo');

exports.createSuggestion = async (req, res) => {
  try {
    const { song_name, ministry_name, singer_name, album_name } = req.body;
    
    if (!song_name || !ministry_name) {
      return res.status(400).json({ error: 'Song name and Ministry name are mandatory' });
    }

    const suggestion = await repo.create({
      song_name,
      ministry_name,
      singer_name,
      album_name
    });
    
    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await repo.findAll();
    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    await repo.delete(id);
    res.json({ message: 'Suggestion removed successfully' });
  } catch (error) {
    console.error('Delete suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
};
