import { Router } from "express";
import * as bookingController from "../controllers/bookingController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createBookingBodySchema,
  bookingIdParamsSchema,
  bookingStatusBodySchema,
} from "../validation/bookingSchemas.js";

const router = Router();

router.post(
  "/",
  authRequired,
  requireRole("tenant"),
  validate({ body: createBookingBodySchema }),
  bookingController.create
);
router.get("/mine", authRequired, bookingController.listMine);
router.patch(
  "/:id",
  authRequired,
  requireRole("owner"),
  validate({ params: bookingIdParamsSchema, body: bookingStatusBodySchema }),
  bookingController.respond
);

export default router;
