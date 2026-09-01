import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

function assertNoSensitiveFields(obj) {
  const json = JSON.stringify(obj);
  expect(json).not.toMatch(/password_hash/i);
  expect(json).not.toMatch(/token_hash/i);
}

describe("Sicurezza trasversale", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("register non espone mai password_hash", async () => {
    const { user } = await registerUser({ role: "tenant" });
    assertNoSensitiveFields(user);
  });

  it("login non espone mai password_hash", async () => {
    const { email, password } = await registerUser({ role: "tenant" });
    const res = await request(app).post("/api/auth/login").send({ email, password });
    assertNoSensitiveFields(res.body);
  });

  it("GET /api/auth/me non espone password_hash", async () => {
    const { token } = await registerUser({ role: "tenant" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    assertNoSensitiveFields(res.body);
  });

  it("GET /api/properties/:id non espone password_hash del proprietario", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);
    const res = await request(app).get(`/api/properties/${property.id}`);
    assertNoSensitiveFields(res.body);
  });

  it("una rotta protetta senza JWT risponde 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("NO_TOKEN");
  });

  it("una rotta protetta con JWT malformato risponde 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer non-un-jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("una rotta per soli owner risponde 403 a un tenant", async () => {
    const { token } = await registerUser({ role: "tenant" });
    const res = await request(app)
      .get("/api/properties/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("una rotta per soli tenant risponde 403 a un owner", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ property_id: property.id });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
