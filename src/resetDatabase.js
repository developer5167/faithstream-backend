
const pool =require("./config/db")
async function resetDatabase() {
  try {
    await pool.connect();

    console.log("⚠️ Deleting all data from tables...");

    await pool.query(`
      TRUNCATE TABLE
      wallet_transactions,
      user_fcm_tokens,
      user_follows,
      user_tokens,
      support_tickets,
      subscriptions,
      streams,
      songs,
      song_fingerprints,
      song_disputes,
      recently_played,
      playlists,
      playlist_songs,
      favorites,
      favorite_albums,
      complaints,
      artist_wallets,
      artist_profiles_supportings,
      artist_profiles,
      artist_payout_requests,
      artist_earnings,
      artist_bank_details,
      albums,
      advertisers,
      advertiser_tokens,
      advertiser_otps,
      advertisements,
      admin_actions,
      ad_analytics
      RESTART IDENTITY CASCADE;
    `);

    console.log("✅ Database reset successful");

    await pool.query(`
      DELETE FROM users 
      WHERE id != 'f843d0ac-b189-4d19-aee4-5b07c8262001';
    `);
    console.log("🧹 Cleared users except admin...");

  } catch (err) {
    console.error("❌ Error resetting database:", err);
  } finally {
    await pool.end();
  }
}

resetDatabase();