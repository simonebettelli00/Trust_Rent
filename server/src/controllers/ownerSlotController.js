import * as ownerSlotService from "../services/ownerSlotService.js";

export async function create(req, res, next) {
  try {
    const slot = await ownerSlotService.createSlot(Number(req.params.id), req.user.id, {
      date: req.body.date,
      startTime: req.body.start_time,
      endTime: req.body.end_time,
    });
    res.status(201).json({ slot });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const slots = await ownerSlotService.listSlots(Number(req.params.id));
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await ownerSlotService.deleteSlot(Number(req.params.id), req.user.id, Number(req.params.slotId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
