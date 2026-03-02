const artistRepo = require('../repositories/artist.repo');
const userRepo = require('../repositories/user.repo');
const adminLog = require('../repositories/adminAction.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');
const otpService = require('./otp.service');

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

exports.getDashboardStats = async (userId) => {
  return artistRepo.getDashboardStats(userId);
};

/**
 * Admin creates an artist account directly (bypasses verification flow).
 * The artist gets APPROVED status immediately.
 */
exports.createArtistAccount = async (adminId, { name, email, password, artist_name, bio }) => {
  // Check if email already exists
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const hash = await bcrypt.hash(password);

  // Create user
  const user = await userRepo.createUser(name, email, hash);

  // Set artist_status to APPROVED
  await userRepo.updateArtistStatus(user.id, 'APPROVED');

  // Create artist profile with APPROVED status directly
  const artistProfile = await artistRepo.createApprovedByAdmin({
    user_id: user.id,
    artist_name: artist_name || name,
    bio: bio || '',
    admin_id: adminId,
  });

  // Log admin action
  await adminLog.log({
    admin_id: adminId,
    action_type: 'ARTIST_ACCOUNT_CREATED',
    target_id: user.id,
    description: `Admin created artist account for "${name}" (${email})`,
  });

  // Generate token so artist can start using immediately
  const updatedUser = await userRepo.findById(user.id);
  const token = jwt.sign(updatedUser);
  await userRepo.saveToken(user.id, token);

  const result = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: 'APPROVED',
    },
    artist_profile: artistProfile,
    credentials: { email, password }, // returned once so admin can share with artist
  };

  // Send welcome email with credentials to artist (non-blocking — don't fail if email fails)
  otpService.sendArtistCredentials({ name, email, password }).catch(err => {
    console.error('[ArtistService] Failed to send credentials email:', err.message);
  });

  return result;
};

