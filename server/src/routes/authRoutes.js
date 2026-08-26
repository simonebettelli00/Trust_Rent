import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validation/authSchemas.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  validate({ body: registerSchema }),
  authController.register
);
router.post("/login", loginLimiter, validate({ body: loginSchema }), authController.login);
router.get("/me", authRequired, authController.me);

export default router;
