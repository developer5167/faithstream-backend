exports.validateSong = ({ title, lyrics, description }) => {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Song title is required');
  }
  if (title.length > 200) {
    throw new Error('Song title must be 200 characters or less');
  }
  if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length === 0) {
    throw new Error('Lyrics are required');
  }
  if (lyrics.length > 50000) {
    throw new Error('Lyrics must be 50000 characters or less');
  }
  if (description && description.length > 5000) {
    throw new Error('Description must be 5000 characters or less');
  }
};
