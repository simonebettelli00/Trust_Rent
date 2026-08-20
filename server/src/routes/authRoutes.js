import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validation/authSchemas.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", validate({ body: loginSchema }), authController.login);
router.get("/me", authRequired, authController.me);

export default router;
