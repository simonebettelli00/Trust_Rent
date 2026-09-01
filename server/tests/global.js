import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Gira in un processo separato dai file di test (contratto di Vitest per
// globalSetup): serve un proprio caricamento env e una propria connessione.
// Il default export gira all'avvio dell'intera run; la funzione che ritorna
// gira una sola volta alla fine (teardown), dopo tutti i file di test.
export default async function globalSetup() {
  dotenv.config({ path: path.join(__dirname, "..", ".env.test"), override: true });
  const databaseUrl = process.env.DATABASE_URL;

  return async function teardown() {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    await pool.query(`
      TRUNCATE TABLE
        notifications, messages, conversations,
        bookings, blocked_periods, appointments, owner_slots,
        property_images, properties,
        refresh_tokens, users
      RESTART IDENTITY CASCADE
    `);
    await pool.end();
  };
}
