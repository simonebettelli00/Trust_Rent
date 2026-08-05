import * as conversationModel from "../models/conversationModel.js";
import * as messageModel from "../models/messageModel.js";
import * as propertyModel from "../models/propertyModel.js";
import AppError from "../utils/AppError.js";

function assertParticipant(conversation, userId) {
  if (conversation.tenant_id !== userId && conversation.owner_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Non fai parte di questa conversazione");
  }
}

export async function getOrCreateConversation(tenantId, propertyId) {
  const property = await propertyModel.findById(propertyId);
  if (!property) {
    throw new AppError(404, "PROPERTY_NOT_FOUND", "Immobile non trovato");
  }
  if (property.owner_id === tenantId) {
    throw new AppError(400, "INVALID_CONVERSATION", "Non puoi contattare te stesso");
  }

  const existing = await conversationModel.findByPropertyAndTenant(propertyId, tenantId);
  if (existing) return existing;

  return conversationModel.create({
    propertyId,
    tenantId,
    ownerId: property.owner_id,
  });
}

export function listForUser(userId) {
  return conversationModel.findByUser(userId);
}

export async function getConversationForUser(conversationId, userId) {
  const conversation = await conversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversazione non trovata");
  }
  assertParticipant(conversation, userId);
  return conversation;
}

export async function getMessages(conversationId, userId) {
  await getConversationForUser(conversationId, userId);
  return messageModel.findByConversation(conversationId);
}

export async function sendMessage(conversationId, senderId, body) {
  if (!body || !body.trim()) {
    throw new AppError(400, "EMPTY_MESSAGE", "Il messaggio non può essere vuoto");
  }
  await getConversationForUser(conversationId, senderId);
  return messageModel.create({ conversationId, senderId, body: body.trim() });
}

export async function markRead(conversationId, userId) {
  await getConversationForUser(conversationId, userId);
  return messageModel.markRead(conversationId, userId);
}
