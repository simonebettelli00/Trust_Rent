import * as appointmentModel from "../models/appointmentModel.js";
import * as ownerSlotModel from "../models/ownerSlotModel.js";
import * as propertyService from "./propertyService.js";
import * as notificationService from "./notificationService.js";
import AppError from "../utils/AppError.js";

export async function requestAppointment(tenantId, { propertyId, slotId, note }) {
  const property = await propertyService.getProperty(propertyId);
  if (property.rental_type !== "long") {
    throw new AppError(
      400,
      "NOT_LONG_TERM_PROPERTY",
      "Le richieste di visita sono disponibili solo per gli immobili a lungo termine"
    );
  }
  if (property.owner_id === tenantId) {
    throw new AppError(400, "INVALID_REQUEST", "Non puoi richiedere una visita a te stesso");
  }

  const slot = await ownerSlotModel.findById(slotId);
  if (!slot || slot.property_id !== propertyId) {
    throw new AppError(404, "SLOT_NOT_FOUND", "Fascia oraria non trovata");
  }
  if (!slot.is_open) {
    throw new AppError(409, "SLOT_NOT_OPEN", "Questa fascia oraria non è più disponibile");
  }

  const appointment = await appointmentModel.create({
    propertyId,
    tenantId,
    ownerId: property.owner_id,
    slotId: slot.id,
    requestedDate: slot.date,
    startTime: slot.start_time,
    endTime: slot.end_time,
    note,
  });

  await notificationService.notify({
    userId: property.owner_id,
    type: "appointment_request",
    relatedId: appointment.id,
    message: `Nuova richiesta di visita per "${property.title}"`,
  });

  return appointment;
}

export function listForUser(userId) {
  return appointmentModel.findByUser(userId);
}

export async function respondToAppointment(id, ownerId, status) {
  if (!["accepted", "declined"].includes(status)) {
    throw new AppError(400, "INVALID_STATUS", "Lo stato deve essere 'accepted' o 'declined'");
  }

  const appointment = await appointmentModel.findById(id);
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Richiesta di visita non trovata");
  }
  if (appointment.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi rispondere a una richiesta che non è tua");
  }
  if (appointment.status !== "pending") {
    throw new AppError(409, "ALREADY_RESOLVED", "Questa richiesta ha già una risposta");
  }

  const updated = await appointmentModel.setStatus(id, status);
  const property = await propertyService.getProperty(appointment.property_id);

  if (status === "accepted") {
    await ownerSlotModel.setOpen(appointment.slot_id, false);

    const competing = await appointmentModel.findPendingBySlot(appointment.slot_id, id);
    for (const other of competing) {
      await appointmentModel.setStatus(other.id, "declined");
      await notificationService.notify({
        userId: other.tenant_id,
        type: "appointment_declined",
        relatedId: other.id,
        message: `La fascia richiesta per "${property.title}" non è più disponibile`,
      });
    }
  }

  await notificationService.notify({
    userId: appointment.tenant_id,
    type: status === "accepted" ? "appointment_accepted" : "appointment_declined",
    relatedId: appointment.id,
    message:
      status === "accepted"
        ? `La tua richiesta di visita per "${property.title}" è stata accettata`
        : `La tua richiesta di visita per "${property.title}" è stata rifiutata`,
  });

  return updated;
}
