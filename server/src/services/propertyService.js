import * as propertyModel from "../models/propertyModel.js";
import { geocodeAddress } from "./geocodingService.js";
import AppError from "../utils/AppError.js";

export async function createProperty(ownerId, payload) {
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

// north/south/east/west/minPrice/maxPrice/rooms sono già validati e
// coercizzati a number da propertySearchQuerySchema (middleware validate).
export function searchProperties(query) {
  return propertyModel.searchInBounds(query);
}
