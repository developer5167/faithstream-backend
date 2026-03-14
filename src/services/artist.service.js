const artistRepo = require('../repositories/artist.repo');
const userRepo = require('../repositories/user.repo');
const adminLog = require('../repositories/adminAction.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');
const otpService = require('./otp.service');
const notificationService = require('./notification.service');
const db = require('../config/db');

exports.requestArtist = async (userId, data) => {
  const existing = await artistRepo.findByUserId(userId);
  if (existing) {
    if (existing.verification_status === 'REJECTED' && existing.rejected_at) {
      const rejectedAt = new Date(existing.rejected_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (rejectedAt > thirtyDaysAgo) {
        const daysRemaining = Math.ceil((rejectedAt.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(`Your previous application was rejected. Please wait ${daysRemaining} more days before reapplying.`);
      }
      
      // If cooldown is over, reset the profile for a new request
      await db.query(`DELETE FROM artist_profiles_supportings WHERE artist_id = $1`, [existing.id]);
      await db.query(`DELETE FROM artist_profiles WHERE id = $1`, [existing.id]);
    } else {
      throw new Error('Artist request already exists');
    }
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
  const artist_name = artist.rows[0].artist_name;
  
  await userRepo.updateArtistStatus(user_id, 'APPROVED');

  // Send push notification to the artist
  notificationService.sendToUser(
    user_id,
    'Congratulations!',
    `Your artist application for "${artist_name}" has been approved! You can now start uploading music.`,
    { type: 'ARTIST_APPROVAL_SUCCESS', artistId: user_id }
  ).catch(err => console.error('[ArtistService] Approval notification failed:', err.message));
};

exports.rejectArtist = async (userId, reason) => {
  await artistRepo.reject(userId, reason);
  await userRepo.updateArtistStatus(userId, 'REJECTED');

  // Send push notification to the artist
  notificationService.sendToUser(
    userId,
    'Artist Application Status',
    `Your application has been reviewed. Status: Rejected. Reason: ${reason || 'Not specified'}.`,
    { type: 'ARTIST_APPROVAL_REJECT', reason: reason || '' }
  ).catch(err => console.error('[ArtistService] Rejection notification failed:', err.message));
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
exports.createArtistAccount = async (adminId, { name, email, artist_name, bio }) => {
  // Check if email already exists
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  // Generate secure temporary password
  const crypto = require('crypto');
  const tempPassword = crypto.randomBytes(8).toString('hex');

  // Hash password
  const hash = await bcrypt.hash(tempPassword);

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
    message: 'Temporary credentials have been emailed to the artist.',
  };

  // Send welcome email with credentials to artist (non-blocking — don't fail if email fails)
  otpService.sendArtistCredentials({ name, email, password: tempPassword }).catch(err => {
    console.error('[ArtistService] Failed to send credentials email:', err.message);
  });

  return result;
};

