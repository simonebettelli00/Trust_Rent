import { Router } from "express";
import * as geocodeController from "../controllers/geocodeController.js";

const router = Router();

router.get("/", geocodeController.geocode);

export default router;
