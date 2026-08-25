import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as conversationService from "../services/conversationService.js";

let ioInstance = null;

function userRoom(userId) {
  return `user:${userId}`;
}

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Token mancante"));
  }
  try {
    socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Token non valido o scaduto"));
  }
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL },
  });
  ioInstance = io;

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;
    socket.join(userRoom(userId));

    socket.on("join:conversation", async (conversationId) => {
      try {
        await conversationService.getConversationForUser(Number(conversationId), userId);
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("message:send", async ({ conversationId, body }) => {
      try {
        const message = await conversationService.sendMessage(
          Number(conversationId),
          userId,
          body
        );
        io.to(`conversation:${conversationId}`).emit("message:new", message);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("message:read", async ({ conversationId }) => {
      try {
        const messageIds = await conversationService.markRead(Number(conversationId), userId);
        if (messageIds.length > 0) {
          io.to(`conversation:${conversationId}`).emit("message:read", {
            conversationId: Number(conversationId),
            messageIds,
            readBy: userId,
          });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });
  });

  return io;
}

/**
 * Invia un evento realtime a un utente specifico (tutte le sue connessioni
 * attive), usato dai controller REST per notificare senza passare da una
 * conversazione. No-op silenzioso se il socket non è ancora inizializzato
 * (es. in ambiente di test, dove non si avvia mai initSocket).
 */
export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(userRoom(userId)).emit(event, payload);
}

export default initSocket;
