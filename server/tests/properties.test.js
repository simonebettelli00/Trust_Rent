import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";

describe("GET /api/properties (ricerca per bounds)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("rifiuta la ricerca senza i bounds obbligatori", async () => {
    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rifiuta bounds non numerici", async () => {
    const res = await request(app).get(
      "/api/properties?north=abc&south=45&east=10&west=9"
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accetta bounds validi e ritorna un array di immobili pubblicati", async () => {
    const res = await request(app).get(
      "/api/properties?north=90&south=-90&east=180&west=-180"
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.properties)).toBe(true);
    for (const property of res.body.properties) {
      expect(property).toHaveProperty("id");
      expect(property).toHaveProperty("lat");
      expect(property).toHaveProperty("lng");
    }
  });

  it("applica il filtro maxPrice", async () => {
    const res = await request(app).get(
      "/api/properties?north=90&south=-90&east=180&west=-180&maxPrice=100000"
    );

    expect(res.status).toBe(200);
    for (const property of res.body.properties) {
      expect(Number(property.monthly_price)).toBeLessThanOrEqual(100000);
    }
  });
});
