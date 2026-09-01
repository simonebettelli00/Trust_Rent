import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

describe("GET /api/properties (ricerca per bounds)", () => {
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

  it("applica il filtro rooms", async () => {
    const res = await request(app).get(
      "/api/properties?north=90&south=-90&east=180&west=-180&rooms=3"
    );

    expect(res.status).toBe(200);
    for (const property of res.body.properties) {
      expect(property.num_rooms).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Properties CRUD", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("rifiuta la creazione a un tenant (403)", async () => {
    const { token } = await registerUser({ role: "tenant" });

    const res = await request(app)
      .post("/api/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Non dovrebbe crearsi",
        rental_type: "long",
        address: "Via Test 1",
        city: "Bologna",
        monthly_price: 500,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("permette la creazione a un owner", async () => {
    const { token } = await registerUser({ role: "owner" });
    const property = await createProperty(token);

    expect(property.id).toBeTruthy();
    expect(property.lat).toBeCloseTo(44.4949);
  });

  it("GET /:id espone il dettaglio pubblico senza autenticazione", async () => {
    const { token } = await registerUser({ role: "owner" });
    const property = await createProperty(token);

    const res = await request(app).get(`/api/properties/${property.id}`);

    expect(res.status).toBe(200);
    expect(res.body.property.id).toBe(property.id);
    expect(res.body).toHaveProperty("images");
  });

  it("GET /mine ritorna solo gli immobili del proprietario autenticato", async () => {
    const owner1 = await registerUser({ role: "owner" });
    const owner2 = await registerUser({ role: "owner" });
    const property1 = await createProperty(owner1.token);
    const property2 = await createProperty(owner2.token);

    const res = await request(app)
      .get("/api/properties/mine")
      .set("Authorization", `Bearer ${owner1.token}`);

    expect(res.status).toBe(200);
    const ids = res.body.properties.map((p) => p.id);
    expect(ids).toContain(property1.id);
    expect(ids).not.toContain(property2.id);
  });

  it("rifiuta la modifica di un immobile da parte di un altro owner (403)", async () => {
    const owner = await registerUser({ role: "owner" });
    const otherOwner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .put(`/api/properties/${property.id}`)
      .set("Authorization", `Bearer ${otherOwner.token}`)
      .send({
        title: "Modifica non autorizzata",
        rental_type: "long",
        address: property.address,
        city: property.city,
        monthly_price: 900,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("permette la modifica al proprietario", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .put(`/api/properties/${property.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Titolo aggiornato",
        rental_type: "long",
        address: property.address,
        city: property.city,
        monthly_price: 950,
      });

    expect(res.status).toBe(200);
    expect(res.body.property.title).toBe("Titolo aggiornato");
  });

  it("rifiuta l'eliminazione di un immobile da parte di un altro owner (403)", async () => {
    const owner = await registerUser({ role: "owner" });
    const otherOwner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set("Authorization", `Bearer ${otherOwner.token}`);

    expect(res.status).toBe(403);
  });

  it("permette l'eliminazione al proprietario", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/properties/${property.id}`);
    expect(getRes.status).toBe(404);
  });
});
