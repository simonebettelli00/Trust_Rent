import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { notificationIdParamsSchema } from "../validation/notificationSchemas.js";

const router = Router();

router.get("/", authRequired, notificationController.list);
router.patch(
  "/:id/read",
  authRequired,
  validate({ params: notificationIdParamsSchema }),
  notificationController.markRead
);

export default router;
