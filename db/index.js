const { Pool } = require("pg");

let pool;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function init() {
  const connectionString = process.env.DATABASE_URL || `postgres://${required("PGUSER")}@${process.env.PGHOST || "127.0.0.1"}:${process.env.PGPORT || 5432}/${required("PGDATABASE")}`;
  pool = new Pool({
    connectionString,
    password: process.env.PGPASSWORD,
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
    application_name: "intentpost"
  });
  await pool.query("SELECT 1");
}

function query(sql, params = []) {
  if (!pool) throw new Error("Database is not initialized");
  return pool.query(sql, params);
}

async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function close() { if (pool) await pool.end(); }

module.exports = { init, query, transaction, close, get pool() { return pool; } };
