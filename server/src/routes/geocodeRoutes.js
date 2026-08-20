import { Router } from "express";
import * as geocodeController from "../controllers/geocodeController.js";
import { validate } from "../middleware/validate.js";
import { geocodeQuerySchema } from "../validation/geocodeSchemas.js";

const router = Router();

router.get("/", validate({ query: geocodeQuerySchema }), geocodeController.geocode);

export default router;
