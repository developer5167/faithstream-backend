
const songService = require('../services/song.service');
const albumService = require('../services/album.service');
const artistService = require('../services/artist.service');

// Constants for App Store / Play Store URLs (Placeholders)
const APPLE_APP_STORE_URL = 'https://apps.apple.com/app/faithstream/id123456789';
const GOOGLE_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.faithstream.app';

/**
 * Deep Link Bridge: Serves a premium landing page that attempts to 
 * open the app via custom scheme 'faithstream://' with a manual fallback button.
 */
const handleRedirect = (req, res, deepLinkPath, metadata = {}) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  
  // Custom Scheme URL for opening the app directly
  const appDeepLink = `faithstream:/${deepLinkPath}`;
  
  // Store links (Placeholders - updated to search for better UX)
  const APPLE_STORE = 'https://apps.apple.com/app/faithstream/id123456789'; 
  const GOOGLE_PLAY = 'https://play.google.com/store/apps/details?id=com.faithstream.app';

  // Social Meta Tags
  const title = metadata.title || 'FaithStream Music';
  const description = metadata.description || 'Listen to gospel music, albums, and artists on FaithStream.';
  const image = metadata.image || 'https://faithstream.app/logo.png';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - FaithStream</title>
      
      <!-- Social Meta Tags -->
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${image}">
      <meta name="twitter:card" content="summary_large_image">
      
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;800&display=swap" rel="stylesheet">
      
      <style>
        :root {
          --brand-indigo: #040B1F;
          --brand-magenta: #D946EF;
          --brand-purple: #8B5CF6;
          --text-primary: #FFFFFF;
          --text-secondary: rgba(255, 255, 255, 0.7);
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Figtree', sans-serif;
          background-color: var(--brand-indigo);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          overflow: hidden;
        }

        .background-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, #2E1065 0%, transparent 40%),
                      radial-gradient(circle at bottom left, #0F172A 0%, transparent 40%);
          z-index: -1;
        }

        .container {
          padding: 40px 24px;
          max-width: 400px;
          width: 90%;
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, var(--brand-magenta), var(--brand-purple));
          border-radius: 24px;
          margin-bottom: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(217, 70, 239, 0.3);
          font-size: 40px;
          font-weight: 800;
        }

        h1 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        }

        p {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 40px;
          line-height: 1.5;
        }

        .btn-primary {
          display: block;
          background-color: var(--brand-magenta);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 18px;
          font-weight: 800;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 20px rgba(217, 70, 239, 0.4);
        }

        .btn-primary:active {
          transform: scale(0.96);
        }

        .footer {
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .store-btn {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: underline;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .store-btn:hover {
          opacity: 1;
        }

        #lottie-container {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
        }
      </style>
      
      <script>
        window.onload = function() {
          const deepLink = "${appDeepLink}";
          
          // Only attempt auto-redirect on mobile
          if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            // Attempt to open the app after a tiny delay
            setTimeout(function() {
              window.location.href = deepLink;
            }, 500);
          }
        };
      </script>
    </head>
    <body>
      <div class="background-gradient"></div>
      
      <div class="container">
        <div class="logo">f</div>
        <h1>FaithStream</h1>
        <p>Opening your content in the FaithStream app...</p>
        
        <a href="${appDeepLink}" class="btn-primary">OPEN IN APP</a>
        
        <div class="footer">
          <a href="${APPLE_STORE}" class="store-btn">Download on App Store</a>
          <a href="${GOOGLE_PLAY}" class="store-btn">Get it on Google Play</a>
        </div>
      </div>
    </body>
    </html>
  `);
};

exports.shareSong = async (req, res) => {
  const { id } = req.params;
  try {
    const song = await songService.getSongById(id);
    handleRedirect(req, res, `/song/${id}`, {
      title: song ? `Listen to ${song.title}` : 'Shared Song',
      description: song ? `by ${song.displayArtist} on FaithStream` : 'Enjoy this song on FaithStream Music app.',
    });
  } catch (err) {
    handleRedirect(req, res, `/song/${id}`);
  }
};

exports.shareAlbum = async (req, res) => {
  const { id } = req.params;
  try {
    const album = await albumService.getAlbumById(id);
    handleRedirect(req, res, `/album/${id}`, {
      title: album ? `Album: ${album.title}` : 'Shared Album',
      description: album ? `by ${album.displayArtist} on FaithStream` : 'Check out this album on FaithStream Music app.',
    });
  } catch (err) {
    handleRedirect(req, res, `/album/${id}`);
  }
};

exports.shareArtist = async (req, res) => {
  const { id } = req.params;
  try {
    const artist = await artistService.getArtistDetails(id);
    handleRedirect(req, res, `/artist/${id}`, {
      title: artist ? `Discover ${artist.name}` : 'FaithStream Artist',
      description: 'Follow this artist and listen to their gospel music on FaithStream.',
    });
  } catch (err) {
    handleRedirect(req, res, `/artist/${id}`);
  }
};
