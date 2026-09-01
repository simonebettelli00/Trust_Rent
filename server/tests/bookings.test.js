import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

describe("Richieste di prenotazione (short-term)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("un tenant può richiedere una prenotazione su un immobile short-term", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, check_in: "2027-02-01", check_out: "2027-02-05" });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe("pending");
  });

  it("rifiuta una prenotazione su un immobile a lungo termine", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "long" });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, check_in: "2027-02-01", check_out: "2027-02-05" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOT_SHORT_TERM_PROPERTY");
  });

  it("rifiuta una prenotazione che si sovrappone a una già in attesa (409)", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant1 = await registerUser({ role: "tenant" });
    const tenant2 = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant1.token}`)
      .send({ property_id: property.id, check_in: "2027-03-10", check_out: "2027-03-15" });

    const overlapping = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant2.token}`)
      .send({ property_id: property.id, check_in: "2027-03-12", check_out: "2027-03-18" });

    expect(overlapping.status).toBe(409);
    expect(overlapping.body.error.code).toBe("PERIOD_OVERLAP");
  });

  it("accetta una prenotazione: le richieste concorrenti sovrapposte vengono rifiutate automaticamente", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant1 = await registerUser({ role: "tenant" });
    const tenant2 = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    const booking1 = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant1.token}`)
      .send({ property_id: property.id, check_in: "2027-04-01", check_out: "2027-04-05" });

    // Periodo non sovrapposto al momento della richiesta: entrambe restano pending.
    const booking2 = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant2.token}`)
      .send({ property_id: property.id, check_in: "2027-04-03", check_out: "2027-04-08" })
      .catch(() => null);

    // La seconda richiesta si sovrappone comunque alla prima "pending": deve fallire.
    expect(booking2.status).toBe(409);

    const acceptRes = await request(app)
      .patch(`/api/bookings/${booking1.body.booking.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "accepted" });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.booking.status).toBe("accepted");
  });

  it("rifiuta una nuova richiesta sovrapposta a una prenotazione già accettata", async () => {
    const owner = await registerUser({ role: "owner" });
    const tenant1 = await registerUser({ role: "tenant" });
    const tenant2 = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    const booking1 = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant1.token}`)
      .send({ property_id: property.id, check_in: "2027-05-01", check_out: "2027-05-10" });

    await request(app)
      .patch(`/api/bookings/${booking1.body.booking.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "accepted" });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant2.token}`)
      .send({ property_id: property.id, check_in: "2027-05-05", check_out: "2027-05-07" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PERIOD_OVERLAP");
  });

  it("rifiuta la risposta a una prenotazione da parte di un owner diverso (403)", async () => {
    const owner = await registerUser({ role: "owner" });
    const otherOwner = await registerUser({ role: "owner" });
    const tenant = await registerUser({ role: "tenant" });
    const property = await createProperty(owner.token, { rentalType: "short" });

    const booking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${tenant.token}`)
      .send({ property_id: property.id, check_in: "2027-06-01", check_out: "2027-06-05" });

    const res = await request(app)
      .patch(`/api/bookings/${booking.body.booking.id}`)
      .set("Authorization", `Bearer ${otherOwner.token}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(403);
  });
});
