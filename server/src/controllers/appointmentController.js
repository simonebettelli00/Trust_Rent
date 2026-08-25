import * as appointmentService from "../services/appointmentService.js";

export async function create(req, res, next) {
  try {
    const appointment = await appointmentService.requestAppointment(req.user.id, {
      propertyId: req.body.property_id,
      slotId: req.body.slot_id,
      note: req.body.note,
    });
    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req, res, next) {
  try {
    const appointments = await appointmentService.listForUser(req.user.id);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function respond(req, res, next) {
  try {
    const appointment = await appointmentService.respondToAppointment(
      Number(req.params.id),
      req.user.id,
      req.body.status
    );
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
}
