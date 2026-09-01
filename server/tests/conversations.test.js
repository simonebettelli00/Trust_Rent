import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import * as messageModel from "../src/models/messageModel.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

describe("Conversations & messages", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("crea una conversazione tra tenant e owner", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id });

    expect(res.status).toBe(201);
    expect(res.body.conversation.property_id).toBe(property.id);
    expect(res.body.conversation.tenant_id).toBe(tenant.user.id);
    expect(res.body.conversation.owner_id).toBe(owner.user.id);
  });

  it("è idempotente: stesso tenant+property ritorna la stessa conversazione", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token);

    const first = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id });
    const second = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id });

    expect(first.body.conversation.id).toBe(second.body.conversation.id);
  });

  it("nega l'accesso ai messaggi a chi non fa parte della conversazione", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const outsider = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token);

    const createRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id });
    const conversationId = createRes.body.conversation.id;

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("ritorna lo storico messaggi ai partecipanti", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token);

    const createRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id });
    const conversationId = createRes.body.conversation.id;

    // L'invio reale avviene via Socket.io (Fase 7): qui si seeda direttamente
    // il messaggio a livello di model per testare la sola lettura dello storico.
    await messageModel.create({
      conversationId,
      senderId: tenant.user.id,
      body: "Salve, è ancora disponibile?",
    });

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].body).toBe("Salve, è ancora disponibile?");
  });
});
