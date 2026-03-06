exports.validateArtist = ({ artist_name }) => {
  if (!artist_name || typeof artist_name !== 'string' || artist_name.trim().length === 0) {
    throw new Error('Artist name is required');
  }
  if (artist_name.length > 100) {
    throw new Error('Artist name must be 100 characters or less');
  }
};
