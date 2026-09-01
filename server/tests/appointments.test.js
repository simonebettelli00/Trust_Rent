import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

async function createSlot(ownerToken, propertyId, overrides = {}) {
  const res = await request(app)
    .post(`/api/properties/${propertyId}/slots`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      date: overrides.date || "2027-01-10",
      start_time: overrides.startTime || "10:00",
      end_time: overrides.endTime || "11:00",
    });
  if (res.status !== 201) {
    throw new Error(`createSlot fallita: ${JSON.stringify(res.body)}`);
  }
  return res.body.slot;
}

describe("Richieste di visita (appuntamenti)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("un tenant può richiedere una visita su uno slot aperto", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "long" });
    const slot = await createSlot(owner.token, property.id);

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, slot_id: slot.id, note: "Vorrei visitare" });

    expect(res.status).toBe(201);
    expect(res.body.appointment.status).toBe("pending");
  });

  it("l'owner accetta la richiesta: lo slot si chiude e le richieste concorrenti sullo stesso slot vengono rifiutate", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant1 = await registerUser({ role: "tenant" });
    const tenant2 = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "long" });
    const slot = await createSlot(owner.token, property.id, { date: "2027-01-11" });

    const req1 = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant1.token}`)
      .send({ property_id: property.id, slot_id: slot.id });
    const req2 = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant2.token}`)
      .send({ property_id: property.id, slot_id: slot.id });

    const acceptRes = await request(app)
      .patch(`/api/appointments/${req1.body.appointment.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "accepted" });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.appointment.status).toBe("accepted");

    const tenant2Appointments = await request(app)
      .get("/api/appointments/mine")
      .set("Authorization", `Bearer ${tenant2.token}`);
    const declined = tenant2Appointments.body.appointments.find(
      (a) => a.id === req2.body.appointment.id
    );
    expect(declined.status).toBe("declined");

    // Un terzo tenant non può più richiedere lo stesso slot, ora chiuso.
    const tenant3 = await registerUser({ role: "tenant" });
    const req3 = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant3.token}`)
      .send({ property_id: property.id, slot_id: slot.id });
    expect(req3.status).toBe(409);
    expect(req3.body.error.code).toBe("SLOT_NOT_OPEN");
  });

  it("l'owner può rifiutare una richiesta di visita", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "long" });
    const slot = await createSlot(owner.token, property.id, { date: "2027-01-12" });

    const created = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, slot_id: slot.id });

    const res = await request(app)
      .patch(`/api/appointments/${created.body.appointment.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "declined" });

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe("declined");
  });

  it("rifiuta la risposta a una richiesta di visita da parte di un owner diverso (403)", async () => {
    const owner = await registerUser({ role: "owner" });
    const otherOwner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "long" });
    const slot = await createSlot(owner.token, property.id, { date: "2027-01-13" });

    const created = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, slot_id: slot.id });

    const res = await request(app)
      .patch(`/api/appointments/${created.body.appointment.id}`)
      .set("Authorization", `Bearer ${otherOwner.token}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(403);
  });

  it("non permette di creare fasce di visita su un immobile a breve termine", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    const res = await request(app)
      .post(`/api/properties/${property.id}/slots`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ date: "2027-01-14", start_time: "10:00", end_time: "11:00" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOT_LONG_TERM_PROPERTY");
  });

  it("rifiuta una richiesta di visita se l'immobile indicato non è a lungo termine", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const longProperty = await createProperty(owner.token, { rentalType: "long" });
    const shortProperty = await createProperty(owner.token, { rentalType: "short" });
    const slot = await createSlot(owner.token, longProperty.id, { date: "2027-01-15" });

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: shortProperty.id, slot_id: slot.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOT_LONG_TERM_PROPERTY");
  });
});
