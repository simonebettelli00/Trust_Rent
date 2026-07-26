import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

async function runMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Eseguo migrazione: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrazioni completate.");
  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Errore durante le migrazioni:", err);
  process.exit(1);
});
