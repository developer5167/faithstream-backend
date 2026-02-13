const favoriteRepo = require('../repositories/favorite.repo');
const songRepo = require('../repositories/song.repo');

class FavoriteService {
  async getUserFavorites(userId) {
    return await favoriteRepo.getUserFavorites(userId);
  }

  async isFavorite(userId, songId) {
    return await favoriteRepo.isFavorite(userId, songId);
  }

  async addFavorite(userId, songId) {
    // Verify song exists
    const song = await songRepo.getSongById(songId);
    if (!song) {
      throw new Error('Song not found');
    }

    const result = await favoriteRepo.addFavorite(userId, songId);
    return result;
  }

  async removeFavorite(userId, songId) {
    const result = await favoriteRepo.removeFavorite(userId, songId);
    if (!result) {
      throw new Error('Favorite not found');
    }
    return result;
  }

  async getFavoriteCount(songId) {
    return await favoriteRepo.getFavoriteCount(songId);
  }
}

module.exports = new FavoriteService();
