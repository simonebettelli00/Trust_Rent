import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("GET /api/geocode (ricerca libera, Nominatim mockato)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ritorna lat/lng quando Nominatim trova un risultato, senza chiamate di rete reali", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          lat: "44.4949",
          lon: "11.3426",
          address: { city: "Bologna", postcode: "40100" },
        },
      ],
    });

    const res = await request(app).get("/api/geocode?q=Via+Roma+1+Bologna");

    expect(res.status).toBe(200);
    expect(res.body.location).toEqual({ lat: 44.4949, lng: 11.3426 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("nominatim.openstreetmap.org");
  });

  it("risponde 422 ADDRESS_NOT_FOUND quando Nominatim non trova nulla", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const res = await request(app).get("/api/geocode?q=Indirizzo+inesistente+xyz");

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("ADDRESS_NOT_FOUND");
  });

  it("risponde 502 se Nominatim non è raggiungibile", async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    const res = await request(app).get("/api/geocode?q=Qualsiasi+indirizzo");

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("GEOCODING_FAILED");
  });
});
