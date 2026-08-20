import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";

const TEST_EMAIL = `vitest.auth.${Date.now()}@trustrent.local`;
const TEST_PASSWORD = "password123";

describe("Autenticazione", () => {
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
    await pool.end();
  });

  it("registra un nuovo utente e non espone mai password_hash", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      full_name: "Vitest Auth",
      role: "tenant",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("rifiuta la registrazione con email duplicata", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      full_name: "Vitest Auth",
      role: "tenant",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rifiuta la registrazione con dati non validi (formato uniforme errore)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "non-una-email",
      password: TEST_PASSWORD,
      full_name: "Vitest Auth",
      role: "tenant",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBeTruthy();
  });

  it("effettua il login con credenziali corrette", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("rifiuta il login con password errata", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "password-sbagliata",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
