exports.validateArtist = ({ artist_name }) => {
  if (!artist_name) {
    throw new Error('Artist name required');
  }
};
