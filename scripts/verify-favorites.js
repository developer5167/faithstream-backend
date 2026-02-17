const db = require('../src/config/db');
const favoriteRepo = require('../src/repositories/favorite.repo');

async function verifyFavorites() {
  try {
    console.log('Starting verification...');

    // 1. Get a random user
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.error('No users found. Cannot verify.');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;
    console.log(`Using User ID: ${userId}`);

    // 2. Get a random artist (user with artist_profile)
    const artistRes = await db.query('SELECT user_id FROM artist_profiles WHERE verification_status = \'APPROVED\' LIMIT 1');
    let artistId;
    if (artistRes.rows.length === 0) {
      console.log('No approved artists found. Trying unapproved...');
      const anyArtistRes = await db.query('SELECT user_id FROM artist_profiles LIMIT 1');
       if (anyArtistRes.rows.length === 0) {
          console.error('No artists found. Cannot verify artists.');
       } else {
          artistId = anyArtistRes.rows[0].user_id;
       }
    } else {
      artistId = artistRes.rows[0].user_id;
    }

    if (artistId) {
        console.log(`Using Artist ID: ${artistId}`);

        // 3. Test Add Favorite Artist
        console.log('Adding favorite artist...');
        await favoriteRepo.addFavoriteArtist(userId, artistId);
        
        // 4. Test Check Favorite Artist
        const isFavArtist = await favoriteRepo.isFavoriteArtist(userId, artistId);
        console.log(`Is Favorite Artist? ${isFavArtist}`);
        if (!isFavArtist) throw new Error('Failed to add favorite artist');

        // 5. Test Get User Favorite Artists
        const favArtists = await favoriteRepo.getUserFavoriteArtists(userId);
        console.log(`Favorite Artists Count: ${favArtists.length}`);
        if (favArtists.length === 0) throw new Error('Failed to get favorite artists');

        // 6. Test Remove Favorite Artist
        console.log('Removing favorite artist...');
        await favoriteRepo.removeFavoriteArtist(userId, artistId);
        const isFavArtistAfter = await favoriteRepo.isFavoriteArtist(userId, artistId);
        console.log(`Is Favorite Artist After Remove? ${isFavArtistAfter}`);
        if (isFavArtistAfter) throw new Error('Failed to remove favorite artist');
    }

    // 7. Get a random album
    const albumRes = await db.query('SELECT id FROM albums LIMIT 1');
    if (albumRes.rows.length === 0) {
      console.error('No albums found. Cannot verify albums.');
    } else {
        const albumId = albumRes.rows[0].id;
        console.log(`Using Album ID: ${albumId}`);

        // 8. Test Add Favorite Album
        console.log('Adding favorite album...');
        await favoriteRepo.addFavoriteAlbum(userId, albumId);

        // 9. Test Check Favorite Album
        const isFavAlbum = await favoriteRepo.isFavoriteAlbum(userId, albumId);
        console.log(`Is Favorite Album? ${isFavAlbum}`);
        if (!isFavAlbum) throw new Error('Failed to add favorite album');

        // 10. Test Get User Favorite Albums
        const favAlbums = await favoriteRepo.getUserFavoriteAlbums(userId);
        console.log(`Favorite Albums Count: ${favAlbums.length}`);
        if (favAlbums.length === 0) throw new Error('Failed to get favorite albums');

        // 11. Test Remove Favorite Album
        console.log('Removing favorite album...');
        await favoriteRepo.removeFavoriteAlbum(userId, albumId);
        const isFavAlbumAfter = await favoriteRepo.isFavoriteAlbum(userId, albumId);
        console.log(`Is Favorite Album After Remove? ${isFavAlbumAfter}`);
        if (isFavAlbumAfter) throw new Error('Failed to remove favorite album');
    }

    console.log('✅ Verification completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyFavorites();
