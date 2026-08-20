import { Router } from "express";
import * as propertyController from "../controllers/propertyController.js";
import * as ownerSlotController from "../controllers/ownerSlotController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import upload from "../middleware/upload.js";
import {
  propertyIdParamsSchema,
  propertyImageParamsSchema,
  propertySlotParamsSchema,
  propertyBodySchema,
  propertyPublishBodySchema,
  propertyImageOrderBodySchema,
  propertySearchQuerySchema,
  slotBodySchema,
} from "../validation/propertySchemas.js";

const router = Router();
const ownerOnly = [authRequired, requireRole("owner")];

router.get("/mine", ...ownerOnly, propertyController.getMine);
router.get("/", validate({ query: propertySearchQuerySchema }), propertyController.search);
router.get("/:id", validate({ params: propertyIdParamsSchema }), propertyController.getOne);
router.get(
  "/:id/availability",
  validate({ params: propertyIdParamsSchema }),
  propertyController.getAvailability
);

router.post("/", ...ownerOnly, validate({ body: propertyBodySchema }), propertyController.create);
router.put(
  "/:id",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema, body: propertyBodySchema }),
  propertyController.update
);
router.patch(
  "/:id/publish",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema, body: propertyPublishBodySchema }),
  propertyController.setPublished
);
router.delete(
  "/:id",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema }),
  propertyController.remove
);

router.post(
  "/:id/images",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema }),
  upload.array("images", 10),
  propertyController.uploadImages
);
router.delete(
  "/:id/images/:imageId",
  ...ownerOnly,
  validate({ params: propertyImageParamsSchema }),
  propertyController.deleteImage
);
router.put(
  "/:id/images/order",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema, body: propertyImageOrderBodySchema }),
  propertyController.reorderImages
);

router.get("/:id/slots", validate({ params: propertyIdParamsSchema }), ownerSlotController.list);
router.post(
  "/:id/slots",
  ...ownerOnly,
  validate({ params: propertyIdParamsSchema, body: slotBodySchema }),
  ownerSlotController.create
);
router.delete(
  "/:id/slots/:slotId",
  ...ownerOnly,
  validate({ params: propertySlotParamsSchema }),
  ownerSlotController.remove
);

export default router;
