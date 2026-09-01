import { describe, it, expect, vi, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db.js";
import { UPLOADS_DIR } from "../src/middleware/upload.js";
import { registerUser, createProperty } from "./helpers/factories.js";

vi.mock("../src/services/geocodingService.js", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 44.4949, lng: 11.3426, precision: "civico" }),
  geocodeFreeText: vi.fn(),
}));

// 1x1 px PNG valido (data URL trasparente), usato come file "immagine" reale.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

// Multer scrive su disco reale (non mockato, vedi nota nel piano FASE 14):
// si fa uno snapshot dei file presenti prima dei test e si eliminano solo
// quelli nuovi al termine, compresi eventuali upload orfani (es. il file
// scritto da multer prima che il controller rifiuti per 403 di ownership).
const filesBefore = new Set(fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []);

describe("Upload immagini immobile", () => {
  afterAll(async () => {
    const filesAfter = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
    for (const filename of filesAfter) {
      if (!filesBefore.has(filename)) {
        fs.rmSync(path.join(UPLOADS_DIR, filename), { force: true });
      }
    }
    await pool.end();
  });

  it("associa le immagini caricate a property_images", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .post(`/api/properties/${property.id}/images`)
      .set("Authorization", `Bearer ${owner.token}`)
      .attach("images", TINY_PNG, "foto.png");

    expect(res.status).toBe(201);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0].property_id).toBe(property.id);

    const detail = await request(app).get(`/api/properties/${property.id}`);
    expect(detail.body.images).toHaveLength(1);
  });

  it("rifiuta un file che non è un'immagine", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .post(`/api/properties/${property.id}/images`)
      .set("Authorization", `Bearer ${owner.token}`)
      .attach("images", Buffer.from("questo non è un'immagine"), {
        filename: "documento.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("rifiuta un file oltre il limite di dimensione (5MB)", async () => {
    const owner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1024, 1);

    const res = await request(app)
      .post(`/api/properties/${property.id}/images`)
      .set("Authorization", `Bearer ${owner.token}`)
      .attach("images", oversized, { filename: "grande.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UPLOAD_ERROR");
  });

  it("rifiuta l'upload da parte di un owner che non possiede l'immobile", async () => {
    const owner = await registerUser({ role: "owner" });
    const otherOwner = await registerUser({ role: "owner" });
    const property = await createProperty(owner.token);

    const res = await request(app)
      .post(`/api/properties/${property.id}/images`)
      .set("Authorization", `Bearer ${otherOwner.token}`)
      .attach("images", TINY_PNG, "foto.png");

    expect(res.status).toBe(403);
  });
});
