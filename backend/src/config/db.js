const { Pool } = require('pg');

try {
  require('dotenv').config();
} catch (e) {
  // Ignore in environments where dotenv is not installed or unnecessary
}

const connectionString = process.env.DATABASE_URL;

// In Serverless environments (like Vercel), reuse existing pool across warm invocations
let pool = globalThis.__ikoDbPool;

if (!pool) {
  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: process.env.NODE_ENV === 'production' ? 5 : 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 7000,
      keepAlive: true,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    globalThis.__ikoDbPool = pool;
  } else {
    console.warn('DATABASE_URL is not set. Database operations will log warnings.');
    // Fallback in-memory mock store mechanism for environment without live Postgres connection
    pool = {
      query: async (text, params) => {
        console.warn('Executing query without live database connection:', text);
        return { rows: [] };
      }
    };
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
