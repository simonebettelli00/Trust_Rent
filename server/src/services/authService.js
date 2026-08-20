import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findByEmail, createUser } from "../models/userModel.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = "7d";

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

export async function register({ email, password, fullName, phone, role }) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "Email già registrata");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ email, passwordHash, role, fullName, phone });
  const token = generateToken(user);

  return { user, token };
}

export async function login({ email, password }) {
  const userRow = await findByEmail(email);
  if (!userRow) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenziali non valide");
  }

  const match = await bcrypt.compare(password, userRow.password_hash);
  if (!match) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenziali non valide");
  }

  const { password_hash, ...user } = userRow;
  const token = generateToken(user);

  return { user, token };
}
