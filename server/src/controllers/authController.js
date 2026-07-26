import * as authService from "../services/authService.js";
import { findById } from "../models/userModel.js";
import AppError from "../utils/AppError.js";

export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, role } = req.body;
    const { user, token } = await authService.register({
      email,
      password,
      fullName: full_name,
      phone,
      role,
    });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Utente non trovato");
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
