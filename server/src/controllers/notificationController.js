import * as notificationService from "../services/notificationService.js";

export async function list(req, res, next) {
  try {
    const notifications = await notificationService.listForUser(req.user.id);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(Number(req.params.id), req.user.id);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
}
