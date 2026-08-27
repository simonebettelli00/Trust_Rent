import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { findByEmail, createUser, findById } from "../models/userModel.js";
import * as refreshTokenModel from "../models/refreshTokenModel.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function issueRefreshToken({ userId, family, userAgent }) {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await refreshTokenModel.create({
    userId,
    tokenHash: hashRefreshToken(rawToken),
    family,
    expiresAt,
    userAgent,
  });
  return rawToken;
}

async function issueSession(user, { userAgent } = {}) {
  const family = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = await issueRefreshToken({ userId: user.id, family, userAgent });
  return { accessToken, refreshToken };
}

export async function register({ email, password, fullName, phone, role }, options) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "Email già registrata");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ email, passwordHash, role, fullName, phone });
  const { accessToken, refreshToken } = await issueSession(user, options);

  return { user, accessToken, refreshToken };
}

export async function login({ email, password }, options) {
  const userRow = await findByEmail(email);
  if (!userRow) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenziali non valide");
  }

  const match = await bcrypt.compare(password, userRow.password_hash);
  if (!match) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenziali non valide");
  }

  const { password_hash, ...user } = userRow;
  const { accessToken, refreshToken } = await issueSession(user, options);

  return { user, accessToken, refreshToken };
}

export async function refresh(rawToken, options) {
  if (!rawToken) {
    throw new AppError(401, "NO_REFRESH_TOKEN", "Refresh token mancante");
  }

  const tokenHash = hashRefreshToken(rawToken);
  const row = await refreshTokenModel.findByHash(tokenHash);
  if (!row) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token non valido");
  }

  if (row.revoked_at) {
    // Un refresh token già ruotato che viene riusato è un segnale di furto:
    // si revoca l'intera family per invalidare anche eventuali copie rubate.
    await refreshTokenModel.revokeFamily(row.family);
    throw new AppError(401, "REFRESH_REUSED", "Sessione non valida, effettua di nuovo il login");
  }

  if (row.expires_at < new Date()) {
    throw new AppError(401, "REFRESH_EXPIRED", "Sessione scaduta, effettua di nuovo il login");
  }

  await refreshTokenModel.revoke(row.id);

  const user = await findById(row.user_id);
  if (!user) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token non valido");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await issueRefreshToken({
    userId: user.id,
    family: row.family,
    userAgent: options?.userAgent,
  });

  return { user, accessToken, refreshToken };
}

export async function logout(rawToken) {
  if (!rawToken) return;
  const row = await refreshTokenModel.findByHash(hashRefreshToken(rawToken));
  if (row) {
    await refreshTokenModel.revoke(row.id);
  }
}

export async function logoutAll(userId) {
  await refreshTokenModel.revokeAllForUser(userId);
}
