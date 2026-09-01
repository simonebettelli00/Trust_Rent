import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.js"],
    globalSetup: ["./tests/global.js"],
    // File eseguiti in sequenza: ogni file apre il proprio pool di connessioni
    // Postgres (db.js), e in parallelo su un singolo Postgres locale si sono
    // osservati errori intermittenti da contesa di connessioni.
    fileParallelism: false,
  },
});
