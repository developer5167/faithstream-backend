exports.validateSong = ({ title, lyrics }) => {
  if (!title || !lyrics) {
    throw new Error('Title and lyrics required');
  }
};
