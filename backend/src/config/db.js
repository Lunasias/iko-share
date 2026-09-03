const { Pool } = require('pg');

try {
  require('dotenv').config();
} catch (e) {
  // Ignore in environments where dotenv is not installed or unnecessary
}

const connectionString = process.env.DATABASE_URL;

let pool;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
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

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
