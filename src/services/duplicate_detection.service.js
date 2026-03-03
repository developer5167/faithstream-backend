const songRepo = require('../repositories/song.repo');
const notificationService = require('./notification.service');
const adminLog = require('../repositories/adminAction.repo');

/**
 * Service to handle identification and merging of duplicate songs.
 */

exports.getPotentialDuplicates = async () => {
    return await songRepo.findPotentialDuplicates();
};

/**
 * Merges a duplicate song into a master song.
 * Transfers all metrics (streams, favorites) and notifies artists.
 */
exports.mergeSongs = async (masterId, duplicateId, adminId) => {
    const masterSong = await songRepo.getSongById(masterId);
    const duplicateSong = await songRepo.getSongById(duplicateId);

    if (!masterSong || !duplicateSong) {
        throw new Error('One or both songs not found');
    }

    // Perform the merge in DB
    await songRepo.mergeSongs(masterId, duplicateId);

    // Log the admin action
    if (adminId) {
        await adminLog.log({
            admin_id: adminId,
            action_type: 'SONG_MERGED',
            target_id: masterId,
            description: `Merged duplicate song "${duplicateSong.title}" (ID: ${duplicateId}) into master song (ID: ${masterId})`
        });
    }

    // Notify original artist
    if (masterSong.artist_user_id) {
        notificationService.sendToUser(
            masterSong.artist_user_id,
            '📈 Song Stats Updated',
            `Good news! We found a duplicate of your song "${masterSong.title}" and merged its streams and favorites into your version.`,
            { type: 'song_merged_master', song_id: masterId }
        ).catch(err => console.error('Failed to notify master artist:', err));
    }

    // Notify duplicate uploader
    if (duplicateSong.artist_user_id && duplicateSong.artist_user_id !== masterSong.artist_user_id) {
        notificationService.sendToUser(
            duplicateSong.artist_user_id,
            '🚫 Content Removal Notice',
            `Your upload of "${duplicateSong.title}" was identified as a duplicate/copyrighted work and has been removed. All counts have been moved to the original owner.`,
            { type: 'song_merged_duplicate', song_id: masterId }
        ).catch(err => console.error('Failed to notify duplicate artist:', err));
    }

    return { message: 'Songs merged successfully' };
};
