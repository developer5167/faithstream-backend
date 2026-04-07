const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Sy.3vF$m5DTLYW/@db.djygeyobuzqejtotyuvn.supabase.co:5432/postgres?sslmode=require');

async function test() {
  try {
    const result = await sql`SELECT 1 as x`;
    console.log("Connected successfully:", result);
  } catch (e) {
    console.error("Connection failed:", e.message);
  } finally {
    process.exit(0);
  }
}
test();
