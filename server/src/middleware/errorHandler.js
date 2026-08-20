import multer from "multer";
import AppError from "../utils/AppError.js";

export function notFoundHandler(req, res, next) {
  next(new AppError(404, "NOT_FOUND", "Risorsa non trovata"));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
  }

  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Il corpo della richiesta non è un JSON valido" },
    });
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Errore interno del server" } });
}
