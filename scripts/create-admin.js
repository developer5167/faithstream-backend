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


// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
// CREATE EXTENSION IF NOT EXISTS "pgcrypto";

// DROP SCHEMA public CASCADE;
// CREATE SCHEMA public;

// SELECT * FROM pg_extension;
// SELECT uuid_generate_v4();

// SELECT n.nspname AS schema,
//        p.proname AS function
// FROM pg_proc p
// JOIN pg_namespace n ON p.pronamespace = n.oid
// WHERE p.proname = 'uuid_generate_v4';

// CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
// RETURNS uuid
// LANGUAGE sql
// AS $$
// SELECT extensions.uuid_generate_v4();
// $$;

// SELECT public.uuid_generate_v4();
//Sy.3vF$m5DTLYW/
