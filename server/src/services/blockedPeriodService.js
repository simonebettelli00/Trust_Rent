import * as blockedPeriodModel from "../models/blockedPeriodModel.js";
import * as propertyService from "./propertyService.js";
import AppError from "../utils/AppError.js";

export async function createBlockedPeriod(propertyId, ownerId, { startDate, endDate }) {
  const property = await propertyService.getOwnerProperty(propertyId, ownerId);
  if (property.rental_type !== "short") {
    throw new AppError(
      400,
      "NOT_SHORT_TERM_PROPERTY",
      "I periodi bloccati sono disponibili solo per gli immobili a breve termine"
    );
  }

  return blockedPeriodModel.create({ propertyId, startDate, endDate });
}

export async function listBlockedPeriods(propertyId, ownerId) {
  await propertyService.getOwnerProperty(propertyId, ownerId);
  return blockedPeriodModel.findByProperty(propertyId);
}

export async function deleteBlockedPeriod(propertyId, ownerId, blockedPeriodId) {
  await propertyService.getOwnerProperty(propertyId, ownerId);

  const period = await blockedPeriodModel.findById(blockedPeriodId);
  if (!period || period.property_id !== propertyId) {
    throw new AppError(404, "BLOCKED_PERIOD_NOT_FOUND", "Periodo bloccato non trovato");
  }

  await blockedPeriodModel.remove(blockedPeriodId);
}
