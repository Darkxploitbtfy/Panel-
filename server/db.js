const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 2000) console.warn(`[db] slow query (${duration}ms):`, text);
    return res;
  } catch (err) {
    console.error('[db] query error:', err.message, '|', text);
    throw err;
  }
}

module.exports = { query, pool };
