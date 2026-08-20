import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

function formatZodError(err) {
  const first = err.issues[0];
  if (!first) return "Dati non validi";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

/**
 * Middleware di validazione generico: valida body/query/params con gli
 * schemi Zod passati (con eventuali coercizioni/default già applicati). In
 * caso di errore, lo normalizza nel formato uniforme { error: { code, message } }.
 *
 * req.query e req.params sono proprietà con solo getter in Express 5: non si
 * possono riassegnare (req.query = ...), quindi il risultato "parsato" viene
 * fuso nell'oggetto esistente invece di sostituirlo. req.body resta invece
 * un oggetto normale scritto da express.json(), quindi si può riassegnare.
 */
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) Object.assign(req.query, query.parse(req.query));
      if (params) Object.assign(req.params, params.parse(req.params));
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", formatZodError(err)));
      }
      next(err);
    }
  };
}
