import { geocodeFreeText } from "../services/geocodingService.js";

export async function geocode(req, res, next) {
  try {
    const { q } = req.query;
    const location = await geocodeFreeText(q);
    res.json({ location });
  } catch (err) {
    next(err);
  }
}
