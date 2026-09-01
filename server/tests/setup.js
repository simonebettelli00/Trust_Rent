import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = "test";
// Deve essere caricato PRIMA che app.js/db.js chiamino dotenv.config(): quelle
// chiamate non sovrascrivono variabili già impostate, quindi il DB di test
// dedicato (mai quello di sviluppo) vince sempre nei test.
dotenv.config({ path: path.join(__dirname, "..", ".env.test"), override: true });
