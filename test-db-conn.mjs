import pg from 'pg';

const conn = process.env.DATABASE_URL;
console.log('Using DATABASE_URL:', !!conn);

async function main(){
  if(!conn){
    console.log('No DATABASE_URL set, aborting.');
    process.exit(0);
  }
  const { Pool } = pg;
  const pool = new Pool({ connectionString: conn, idleTimeoutMillis: 1000 });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected OK:', res.rows);
  } catch (err) {
    console.error('DB connect error:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch(e){/*ignore*/ }
  }
}
main();