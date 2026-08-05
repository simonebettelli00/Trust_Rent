import { Router } from "express";
import * as propertyController from "../controllers/propertyController.js";
import * as ownerSlotController from "../controllers/ownerSlotController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();
const ownerOnly = [authRequired, requireRole("owner")];

router.get("/mine", ...ownerOnly, propertyController.getMine);
router.get("/", propertyController.search);
router.get("/:id", propertyController.getOne);
router.get("/:id/availability", propertyController.getAvailability);

router.post("/", ...ownerOnly, propertyController.create);
router.put("/:id", ...ownerOnly, propertyController.update);
router.patch("/:id/publish", ...ownerOnly, propertyController.setPublished);
router.delete("/:id", ...ownerOnly, propertyController.remove);

router.post("/:id/images", ...ownerOnly, upload.array("images", 10), propertyController.uploadImages);
router.delete("/:id/images/:imageId", ...ownerOnly, propertyController.deleteImage);
router.put("/:id/images/order", ...ownerOnly, propertyController.reorderImages);

router.get("/:id/slots", ownerSlotController.list);
router.post("/:id/slots", ...ownerOnly, ownerSlotController.create);
router.delete("/:id/slots/:slotId", ...ownerOnly, ownerSlotController.remove);

export default router;
