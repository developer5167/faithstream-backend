const artistRepo = require('../repositories/artist.repo');
const userRepo = require('../repositories/user.repo');

exports.requestArtist = async (userId, data) => {
  const existing = await artistRepo.findByUserId(userId);
  if (existing) {
    throw new Error('Artist request already exists');
  }

  const artistProfile = await artistRepo.create({
    user_id: userId,
    artist_name: data.artist_name,
    bio: data.bio,
    govt_id_url: data.govt_id_url,
    selfie_video_url: data.selfie_video_url
  });

  // Save supporting links if provided
  if (data.supporting_links && Array.isArray(data.supporting_links) && data.supporting_links.length > 0) {
    const validLinks = data.supporting_links.filter(link => link && link.trim() !== '');
    if (validLinks.length > 0) {
      await artistRepo.addSupportingLinks(artistProfile.id, validLinks);
    }
  }

  await userRepo.updateArtistStatus(userId, 'REQUESTED');
};

exports.getArtistStatus = async (userId) => {
  return artistRepo.findByUserId(userId);
};

exports.getArtistRequests = async () => {
  return artistRepo.getPendingRequests();
};

exports.approveArtist = async (userId, adminId) => {
 const artist = await artistRepo.approve(userId, adminId);
 const user_id = artist.rows[0].user_id;
  await userRepo.updateArtistStatus(user_id, 'APPROVED');
};

exports.rejectArtist = async (userId, reason) => {
  await artistRepo.reject(userId, reason);
  await userRepo.updateArtistStatus(userId, 'REJECTED');
};

exports.getVerifiedArtists = async (options = {}) => {
  return artistRepo.getVerifiedArtists(options);
};

exports.getVerifiedArtistById = async (artistId) => {
  const artist = await artistRepo.getVerifiedArtistById(artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }
  return artist;
};

exports.getSupportingLinks = async (artistId) => {
  return artistRepo.getSupportingLinks(artistId);
};

exports.getSupportingLinksByUserId = async (userId) => {
  return artistRepo.getSupportingLinksByUserId(userId);
};
