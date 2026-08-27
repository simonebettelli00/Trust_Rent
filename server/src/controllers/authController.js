import * as authService from "../services/authService.js";
import { findById } from "../models/userModel.js";
import AppError from "../utils/AppError.js";

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
  const { httpOnly, secure, sameSite, path } = REFRESH_COOKIE_OPTIONS;
  res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly, secure, sameSite, path });
}

export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, role } = req.body;
    const { user, accessToken, refreshToken } = await authService.register(
      { email, password, fullName: full_name, phone, role },
      { userAgent: req.headers["user-agent"] }
    );
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, token: accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(
      { email, password },
      { userAgent: req.headers["user-agent"] }
    );
    setRefreshCookie(res, refreshToken);
    res.json({ user, token: accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const { user, accessToken, refreshToken } = await authService.refresh(rawToken, {
      userAgent: req.headers["user-agent"],
    });
    setRefreshCookie(res, refreshToken);
    res.json({ user, token: accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(rawToken);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req, res, next) {
  try {
    await authService.logoutAll(req.user.id);
    clearRefreshCookie(res);
    res.status(204).send();
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
