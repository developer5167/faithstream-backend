require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

(async () => {
  const hash = await bcrypt.hash('Admin@123', 10);

  await db.query(
    `INSERT INTO users (name, email, password_hash, is_admin)
     VALUES ($1,$2,$3,true)
     ON CONFLICT (email) DO NOTHING`,
    ['FaithStream Admin', 'admin@faithstream.com', hash]
  );

  console.log('Admin created');
  process.exit();
})();
