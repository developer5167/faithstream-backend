const favoriteRepo = require('../repositories/favorite.repo');
const songRepo = require('../repositories/song.repo');
const artistRepo = require('../repositories/artist.repo');
const albumRepo = require('../repositories/album.repo');

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

  // --- Artist Favorites ---

  async isFavoriteArtist(userId, artistId) {
    return await favoriteRepo.isFavoriteArtist(userId, artistId);
  }

  async addFavoriteArtist(userId, artistId) {
    // Verify artist exists
    const artist = await artistRepo.getVerifiedArtistById(artistId);
    if (!artist) {
      throw new Error('Artist not found');
    }
    return await favoriteRepo.addFavoriteArtist(userId, artistId);
  }

  async removeFavoriteArtist(userId, artistId) {
    return await favoriteRepo.removeFavoriteArtist(userId, artistId);
  }

  async getUserFavoriteArtists(userId) {
    return await favoriteRepo.getUserFavoriteArtists(userId);
  }

  // --- Album Favorites ---

  async isFavoriteAlbum(userId, albumId) {
    return await favoriteRepo.isFavoriteAlbum(userId, albumId);
  }

  async addFavoriteAlbum(userId, albumId) {
    // Verify album exists
    const album = await albumRepo.findById(albumId);
    if (!album) {
      throw new Error('Album not found');
    }
    return await favoriteRepo.addFavoriteAlbum(userId, albumId);
  }

  async removeFavoriteAlbum(userId, albumId) {
    return await favoriteRepo.removeFavoriteAlbum(userId, albumId);
  }

  async getUserFavoriteAlbums(userId) {
    return await favoriteRepo.getUserFavoriteAlbums(userId);
  }
}

module.exports = new FavoriteService();
