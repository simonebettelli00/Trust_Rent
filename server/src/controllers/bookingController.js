import * as bookingService from "../services/bookingService.js";

export async function create(req, res, next) {
  try {
    const booking = await bookingService.requestBooking(req.user.id, {
      propertyId: req.body.property_id,
      checkIn: req.body.check_in,
      checkOut: req.body.check_out,
      note: req.body.note,
    });
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req, res, next) {
  try {
    const bookings = await bookingService.listForUser(req.user.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function respond(req, res, next) {
  try {
    const booking = await bookingService.respondToBooking(
      Number(req.params.id),
      req.user.id,
      req.body.status
    );
    res.json({ booking });
  } catch (err) {
    next(err);
  }
}
