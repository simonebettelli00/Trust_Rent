import * as bookingModel from "../models/bookingModel.js";
import * as blockedPeriodModel from "../models/blockedPeriodModel.js";
import * as propertyService from "./propertyService.js";
import * as notificationService from "./notificationService.js";
import AppError from "../utils/AppError.js";

export async function requestBooking(tenantId, { propertyId, checkIn, checkOut, note }) {
  const property = await propertyService.getProperty(propertyId);
  if (property.rental_type !== "short") {
    throw new AppError(
      400,
      "NOT_SHORT_TERM_PROPERTY",
      "Le prenotazioni per periodo sono disponibili solo per gli immobili a breve termine"
    );
  }
  if (property.owner_id === tenantId) {
    throw new AppError(400, "INVALID_REQUEST", "Non puoi prenotare un immobile tuo");
  }

  const overlappingBookings = await bookingModel.findOverlapping(propertyId, checkIn, checkOut, [
    "accepted",
    "pending",
  ]);
  if (overlappingBookings.length > 0) {
    throw new AppError(
      409,
      "PERIOD_OVERLAP",
      "Il periodo richiesto si sovrappone a una prenotazione già esistente"
    );
  }

  const overlappingBlocks = await blockedPeriodModel.findOverlapping(propertyId, checkIn, checkOut);
  if (overlappingBlocks.length > 0) {
    throw new AppError(409, "PERIOD_BLOCKED", "Il periodo richiesto non è disponibile");
  }

  const booking = await bookingModel.create({
    propertyId,
    tenantId,
    ownerId: property.owner_id,
    checkIn,
    checkOut,
    note,
  });

  await notificationService.notify({
    userId: property.owner_id,
    type: "booking_request",
    relatedId: booking.id,
    message: `Nuova richiesta di prenotazione per "${property.title}"`,
  });

  return booking;
}

export function listForUser(userId) {
  return bookingModel.findByUser(userId);
}

export async function respondToBooking(id, ownerId, status) {
  if (!["accepted", "declined"].includes(status)) {
    throw new AppError(400, "INVALID_STATUS", "Lo stato deve essere 'accepted' o 'declined'");
  }

  const booking = await bookingModel.findById(id);
  if (!booking) {
    throw new AppError(404, "BOOKING_NOT_FOUND", "Prenotazione non trovata");
  }
  if (booking.owner_id !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi rispondere a una prenotazione che non è tua");
  }
  if (booking.status !== "pending") {
    throw new AppError(409, "ALREADY_RESOLVED", "Questa prenotazione ha già una risposta");
  }

  const updated = await bookingModel.setStatus(id, status);
  const property = await propertyService.getProperty(booking.property_id);

  if (status === "accepted") {
    const competing = await bookingModel.findPendingOverlapping(
      booking.property_id,
      booking.check_in,
      booking.check_out,
      id
    );
    for (const other of competing) {
      await bookingModel.setStatus(other.id, "declined");
      await notificationService.notify({
        userId: other.tenant_id,
        type: "booking_declined",
        relatedId: other.id,
        message: `Il periodo richiesto per "${property.title}" non è più disponibile`,
      });
    }
  }

  await notificationService.notify({
    userId: booking.tenant_id,
    type: status === "accepted" ? "booking_accepted" : "booking_declined",
    relatedId: booking.id,
    message:
      status === "accepted"
        ? `La tua richiesta di prenotazione per "${property.title}" è stata accettata`
        : `La tua richiesta di prenotazione per "${property.title}" è stata rifiutata`,
  });

  return updated;
}

export async function getAvailability(propertyId) {
  const property = await propertyService.getProperty(propertyId);
  if (property.rental_type !== "short") {
    return { bookedRanges: [], blockedRanges: [] };
  }

  const [bookings, blocks] = await Promise.all([
    bookingModel.findAcceptedByProperty(propertyId),
    blockedPeriodModel.findByProperty(propertyId),
  ]);

  return {
    bookedRanges: bookings.map((b) => ({ start: b.check_in, end: b.check_out })),
    blockedRanges: blocks.map((b) => ({ start: b.start_date, end: b.end_date })),
  };
}
