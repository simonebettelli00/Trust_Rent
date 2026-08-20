import * as ownerSlotModel from "../models/ownerSlotModel.js";
import * as propertyService from "./propertyService.js";
import AppError from "../utils/AppError.js";

export async function createSlot(propertyId, ownerId, payload) {
  const property = await propertyService.getOwnerProperty(propertyId, ownerId);
  if (property.rental_type !== "long") {
    throw new AppError(
      400,
      "NOT_LONG_TERM_PROPERTY",
      "Le fasce di visita sono disponibili solo per gli immobili a lungo termine"
    );
  }

  return ownerSlotModel.create({
    propertyId,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
  });
}

export async function listSlots(propertyId) {
  await propertyService.getProperty(propertyId);
  return ownerSlotModel.findByProperty(propertyId);
}

export async function deleteSlot(propertyId, ownerId, slotId) {
  await propertyService.getOwnerProperty(propertyId, ownerId);

  const slot = await ownerSlotModel.findById(slotId);
  if (!slot || slot.property_id !== propertyId) {
    throw new AppError(404, "SLOT_NOT_FOUND", "Fascia oraria non trovata");
  }

  await ownerSlotModel.remove(slotId);
}
