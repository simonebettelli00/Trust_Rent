import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";

const TEST_EMAIL = `vitest.auth.${Date.now()}@trustrent.local`;
const TEST_PASSWORD = "password123";

describe("Autenticazione", () => {
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
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

describe("Refresh token e logout", () => {
  const email = `vitest.refresh.${Date.now()}@trustrent.local`;
  const password = "password123";

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
    await pool.end();
  });

  function extractRefreshCookie(res) {
    const setCookie = res.headers["set-cookie"] || [];
    const cookie = setCookie.find((c) => c.startsWith("refresh_token="));
    return cookie.split(";")[0];
  }

  it("il login imposta un cookie refresh_token httpOnly", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password, full_name: "Vitest Refresh", role: "tenant" });

    expect(res.status).toBe(201);
    const setCookie = res.headers["set-cookie"] || [];
    const cookie = setCookie.find((c) => c.startsWith("refresh_token="));
    expect(cookie).toBeTruthy();
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("rifiuta il refresh senza cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("NO_REFRESH_TOKEN");
  });

  it("effettua rotation del refresh token e rifiuta il riuso di quello vecchio", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    const firstCookie = extractRefreshCookie(loginRes);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", firstCookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.token).toBeTruthy();
    const secondCookie = extractRefreshCookie(refreshRes);
    expect(secondCookie).not.toBe(firstCookie);

    const reuseRes = await request(app).post("/api/auth/refresh").set("Cookie", firstCookie);
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe("REFRESH_REUSED");

    // La family è stata revocata per intero: anche il token appena ruotato non funziona più.
    const afterReuseRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", secondCookie);
    expect(afterReuseRes.status).toBe(401);
  });

  it("il logout revoca il refresh token corrente", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    const cookie = extractRefreshCookie(loginRes);

    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(refreshRes.status).toBe(401);
  });
});
