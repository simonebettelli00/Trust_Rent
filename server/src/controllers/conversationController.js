import * as conversationService from "../services/conversationService.js";

export async function create(req, res, next) {
  try {
    const conversation = await conversationService.getOrCreateConversation(
      req.user.id,
      Number(req.body.property_id)
    );
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const conversations = await conversationService.listForUser(req.user.id);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    const messages = await conversationService.getMessages(
      Number(req.params.id),
      req.user.id
    );
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}
