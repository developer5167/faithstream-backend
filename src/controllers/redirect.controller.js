
const songService = require('../services/song.service');
const albumService = require('../services/album.service');
const artistService = require('../services/artist.service');

// Constants for App Store / Play Store URLs (Placeholders)
const APPLE_APP_STORE_URL = 'https://apps.apple.com/app/faithstream/id123456789';
const GOOGLE_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.faithstream.app';

/**
 * Handles redirection based on device type
 */
const handleRedirect = (req, res, deepLinkPath) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Custom Scheme URL for opening the app directly if installed
  const appDeepLink = `faithstream:/${deepLinkPath}`;

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    // For iOS, we can try to redirect to the app scheme first, 
    // but browser behavior varies. A more reliable way is to showing a landing page 
    // or redirecting directly to the store if we assume the app isn't there.
    // Real Universal Links handle the "if app exists" part automatically.
    res.redirect(APPLE_APP_STORE_URL);
  } else if (/Android/i.test(userAgent)) {
    // For Android, we can redirect to the Play Store
    res.redirect(GOOGLE_PLAY_STORE_URL);
  } else {
    // Desktop or other: Show a simple landing page
    res.send(`
      <html>
        <head>
          <title>FaithStream - Get the App</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #121212; color: white; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px; background: #6200EE; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            img { width: 120px; height: 120px; border-radius: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <img src="https://faithstream.app/logo.png" onerror="this.src='https://via.placeholder.com/120?text=FS'">
          <h1>FaithStream</h1>
          <p>You're invited to listen on FaithStream.</p>
          <a href="${APPLE_APP_STORE_URL}" class="btn">App Store</a>
          <a href="${GOOGLE_PLAY_STORE_URL}" class="btn">Play Store</a>
        </body>
      </html>
    `);
  }
};

exports.shareSong = async (req, res) => {
  const { id } = req.params;
  handleRedirect(req, res, `/song/${id}`);
};

exports.shareAlbum = async (req, res) => {
  const { id } = req.params;
  handleRedirect(req, res, `/album/${id}`);
};

exports.shareArtist = async (req, res) => {
  const { id } = req.params;
  handleRedirect(req, res, `/artist/${id}`);
};
