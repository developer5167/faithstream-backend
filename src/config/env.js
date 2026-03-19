const path = require('path');
const dotenv = require('dotenv');

/**
 * Centrally loads environment variables based on NODE_ENV.
 * Defaults to .env.dev if NODE_ENV is not 'production'.
 */
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.dev';

dotenv.config({
  path: path.resolve(process.cwd(), envFile)
});

console.log(`[Config] Loaded environment from ${envFile}`);

module.exports = process.env;
