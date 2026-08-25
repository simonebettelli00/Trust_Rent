import * as notificationModel from "../models/notificationModel.js";
import { emitToUser } from "../socket/index.js";
import AppError from "../utils/AppError.js";

/**
 * Crea una notifica, la persiste su DB e la spinge in tempo reale
 * all'utente destinatario (se connesso via Socket.io).
 */
export async function notify({ userId, type, relatedId, message }) {
  const notification = await notificationModel.create({ userId, type, relatedId, message });
  emitToUser(userId, "notification:new", notification);
  return notification;
}

export function listForUser(userId) {
  return notificationModel.findByUser(userId);
}

export async function markRead(id, userId) {
  const notification = await notificationModel.findById(id);
  if (!notification) {
    throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notifica non trovata");
  }
  if (notification.user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Non puoi modificare una notifica che non è tua");
  }
  return notificationModel.markRead(id);
}
