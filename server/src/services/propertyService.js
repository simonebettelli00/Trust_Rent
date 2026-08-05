import * as propertyModel from "../models/propertyModel.js";
import * as availabilityModel from "../models/availabilityModel.js";
import { geocodeAddress } from "./geocodingService.js";
import AppError from "../utils/AppError.js";

function validatePayload(payload) {
  const { title, address, city, monthlyPrice, rentalType } = payload;
  if (!title || !address || !city || monthlyPrice === undefined || monthlyPrice === null) {
    throw new AppError(
      400,
      "MISSING_FIELDS",
      "Titolo, indirizzo, città e canone mensile sono obbligatori"
    );
  }
  if (Number.isNaN(Number(monthlyPrice)) || Number(monthlyPrice) <= 0) {
    throw new AppError(400, "INVALID_PRICE", "Il canone mensile deve essere un numero positivo");
  }
  if (!["long", "short"].includes(rentalType)) {
    throw new AppError(
      400,
      "INVALID_RENTAL_TYPE",
      "Il tipo di affitto deve essere 'long' (lungo termine) o 'short' (breve termine)"
    );
  }
}

export async function createProperty(ownerId, payload) {
  validatePayload(payload);
  const coords = await geocodeAddress({
    address: payload.address,
    city: payload.city,
    postalCode: payload.postalCode,
  });
  return propertyModel.create({
    ownerId,
    ...payload,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    geocodePrecision: coords?.precision ?? null,
  });
}

export async function updateProperty(id, ownerId, payload) {
  validatePayload(payload);
  const existing = await propertyModel.findById(id);
  if (!existing) {
    throw new AppError(404, "PROPERTY_NOT_FOUND", "Immobile non trovato");
  }
  if (existing.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi modificare un immobile che non è tuo");
  }

  let lat = existing.lat;
  let lng = existing.lng;
  let geocodePrecision = existing.geocode_precision;
  const addressChanged =
    payload.address !== existing.address ||
    payload.city !== existing.city ||
    (payload.postalCode || null) !== existing.postal_code;

  if (addressChanged) {
    const coords = await geocodeAddress({
      address: payload.address,
      city: payload.city,
      postalCode: payload.postalCode,
    });
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
    geocodePrecision = coords?.precision ?? null;
  }

  return propertyModel.update(id, {
    ...payload,
    lat,
    lng,
    geocodePrecision,
    isPublished: payload.isPublished ?? existing.is_published,
  });
}

export async function setPublished(id, ownerId, isPublished) {
  const existing = await propertyModel.findById(id);
  if (!existing) {
    throw new AppError(404, "PROPERTY_NOT_FOUND", "Immobile non trovato");
  }
  if (existing.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi modificare un immobile che non è tuo");
  }
  return propertyModel.setPublished(id, isPublished);
}

export async function deleteProperty(id, ownerId) {
  const existing = await propertyModel.findById(id);
  if (!existing) {
    throw new AppError(404, "PROPERTY_NOT_FOUND", "Immobile non trovato");
  }
  if (existing.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi eliminare un immobile che non è tuo");
  }
  await propertyModel.remove(id);
}

export async function getProperty(id) {
  const property = await propertyModel.findById(id);
  if (!property) {
    throw new AppError(404, "PROPERTY_NOT_FOUND", "Immobile non trovato");
  }
  return property;
}

export async function getAvailability(id) {
  await getProperty(id);
  return availabilityModel.findByProperty(id);
}

export async function getOwnerProperty(id, ownerId) {
  const property = await getProperty(id);
  if (property.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi accedere a un immobile che non è tuo");
  }
  return property;
}

export function listOwnerProperties(ownerId) {
  return propertyModel.findByOwner(ownerId);
}

function parseBound(value, name) {
  const parsed = Number(value);
  if (value === undefined || Number.isNaN(parsed)) {
    throw new AppError(400, "INVALID_BOUNDS", `Il parametro ${name} è obbligatorio ed è numerico`);
  }
  return parsed;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

export function searchProperties(query) {
  const north = parseBound(query.north, "north");
  const south = parseBound(query.south, "south");
  const east = parseBound(query.east, "east");
  const west = parseBound(query.west, "west");

  return propertyModel.searchInBounds({
    north,
    south,
    east,
    west,
    minPrice: parseOptionalNumber(query.minPrice),
    maxPrice: parseOptionalNumber(query.maxPrice),
    rooms: parseOptionalNumber(query.rooms),
  });
}
