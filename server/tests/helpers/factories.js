import request from "supertest";
import app from "../../src/app.js";

let counter = 0;
function unique(prefix) {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}`;
}

export async function registerUser({ role = "tenant", ...overrides } = {}) {
  const email = overrides.email || `${unique("user")}@trustrent.test`;
  const password = overrides.password || "password123";

  const res = await request(app).post("/api/auth/register").send({
    email,
    password,
    full_name: overrides.fullName || "Utente di test",
    phone: overrides.phone,
    role,
  });

  if (res.status !== 201) {
    throw new Error(`registerUser fallita: ${JSON.stringify(res.body)}`);
  }

  return { user: res.body.user, token: res.body.token, email, password };
}

// La creazione di un immobile chiama sempre il geocoding: qui si assume che
// `geocodingService.geocodeAddress` sia già mockato dal test chiamante
// (vedi tests/helpers/mockGeocoding.js).
export async function createProperty(ownerToken, overrides = {}) {
  const payload = {
    title: overrides.title || `Immobile di test ${unique("prop")}`,
    description: overrides.description || "Descrizione di test",
    rental_type: overrides.rentalType || "long",
    address: overrides.address || "Via Roma 1",
    city: overrides.city || "Bologna",
    postal_code: overrides.postalCode || "40100",
    monthly_price: overrides.monthlyPrice ?? 800,
    is_published: overrides.isPublished ?? true,
  };

  const res = await request(app)
    .post("/api/properties")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`createProperty fallita: ${JSON.stringify(res.body)}`);
  }

  return res.body.property;
}

export function uniqueEmailPattern(prefix) {
  return `${prefix}%@trustrent.test`;
}
