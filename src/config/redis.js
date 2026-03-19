const { createClient } = require('redis');
require('./env');

let redisUrl = process.env.REDIS_URL;

// Upstash requires TLS natively. If the URL starts with redis://, upgrade it to rediss://
if (redisUrl && redisUrl.includes('upstash.io') && redisUrl.startsWith('redis://')) {
  redisUrl = redisUrl.replace('redis://', 'rediss://');
}

// Initialize Redis client
const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  console.error('[Redis] Client Error:', err.message);
});

redisClient.on('connect', () => {
  // Mask password for safety
  const safeUrl = redisUrl ? redisUrl.replace(/:[^:@]+@/, ':****@') : 'undefined';
  console.log('[Redis] Connected successfully to:', safeUrl);
});

// Connect immediately
(async () => {
  try {
    await redisClient.connect();
    await redisClient.set('foo','bar');
  } catch (err) {
    console.error('[Redis] Initial connection error:', err.message);
  }
})();

module.exports = redisClient;
