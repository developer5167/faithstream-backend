
const client =require("./config/db")
const SAFE_USER_ID = 'f843d0ac-b189-4d19-aee4-5b07c8262001';

async function resetDatabase() {
  try {
    await client.connect();
    console.log("Connected to DB");

    // Get all tables
    const res = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    const tables = res.rows.map(row => row.tablename);

    for (const table of tables) {
      if (table === 'users') {
        // Special condition for users table
        console.log("Cleaning users table (keeping one user)");

        await client.query(`
          DELETE FROM public.users 
          WHERE id <> $1;
        `, [SAFE_USER_ID]);

      } else {
        // Truncate other tables
        console.log(`Truncating table: ${table}`);

        await client.query(`
          TRUNCATE TABLE public."${table}" 
          RESTART IDENTITY CASCADE;
        `);
      }
    }
    console.log("✅ Database cleaned successfully");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
    console.log("Disconnected");
  }
}

resetDatabase();