import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.test") });

const { Pool } = pg;
const testUrl = new URL(process.env.DATABASE_URL);
const testDbName = testUrl.pathname.replace(/^\//, "");

async function ensureDatabaseExists() {
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const adminPool = new Pool({ connectionString: adminUrl.toString() });

  const { rows } = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    testDbName,
  ]);
  if (rows.length === 0) {
    console.log(`Creo il database di test "${testDbName}"...`);
    await adminPool.query(`CREATE DATABASE "${testDbName}"`);
  }
  await adminPool.end();
}

async function runMigrations() {
  const pool = new Pool({ connectionString: testUrl.toString() });
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
  }
  await pool.end();
}

async function main() {
  await ensureDatabaseExists();
  await runMigrations();
  console.log(`Database di test "${testDbName}" pronto.`);
}

main().catch((err) => {
  console.error("Errore nella preparazione del database di test:", err);
  process.exit(1);
});
