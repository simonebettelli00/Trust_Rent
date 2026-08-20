import { Router } from "express";
import * as conversationController from "../controllers/conversationController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createConversationBodySchema, conversationIdParamsSchema } from "../validation/conversationSchemas.js";

const router = Router();

router.post(
  "/",
  authRequired,
  requireRole("tenant"),
  validate({ body: createConversationBodySchema }),
  conversationController.create
);
router.get("/", authRequired, conversationController.list);
router.get(
  "/:id/messages",
  authRequired,
  validate({ params: conversationIdParamsSchema }),
  conversationController.getMessages
);

export default router;
