import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "NO_TOKEN", "Token mancante"));
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError(401, "TOKEN_EXPIRED", "Token scaduto"));
    }
    next(new AppError(401, "INVALID_TOKEN", "Token non valido"));
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new AppError(403, "FORBIDDEN", "Non hai i permessi per questa risorsa"));
    }
    next();
  };
}
