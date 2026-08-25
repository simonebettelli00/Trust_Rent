import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAppointmentBodySchema,
  appointmentIdParamsSchema,
  appointmentStatusBodySchema,
} from "../validation/appointmentSchemas.js";

const router = Router();

router.post(
  "/",
  authRequired,
  requireRole("tenant"),
  validate({ body: createAppointmentBodySchema }),
  appointmentController.create
);
router.get("/mine", authRequired, appointmentController.listMine);
router.patch(
  "/:id",
  authRequired,
  requireRole("owner"),
  validate({ params: appointmentIdParamsSchema, body: appointmentStatusBodySchema }),
  appointmentController.respond
);

export default router;
