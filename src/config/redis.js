const { createClient } = require('redis');
const dotenv = require('dotenv');
dotenv.config();

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
  console.log('[Redis] Connected successfully');
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
