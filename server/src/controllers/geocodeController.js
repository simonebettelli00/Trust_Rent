import { geocodeFreeText } from "../services/geocodingService.js";
import AppError from "../utils/AppError.js";

export async function geocode(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      throw new AppError(400, "MISSING_QUERY", "Il parametro q è obbligatorio");
    }
    const location = await geocodeFreeText(q);
    res.json({ location });
  } catch (err) {
    next(err);
  }
}
