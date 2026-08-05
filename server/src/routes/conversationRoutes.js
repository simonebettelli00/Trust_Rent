import { Router } from "express";
import * as conversationController from "../controllers/conversationController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", authRequired, requireRole("tenant"), conversationController.create);
router.get("/", authRequired, conversationController.list);
router.get("/:id/messages", authRequired, conversationController.getMessages);

export default router;
