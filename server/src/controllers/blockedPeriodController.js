import * as blockedPeriodService from "../services/blockedPeriodService.js";

export async function create(req, res, next) {
  try {
    const blockedPeriod = await blockedPeriodService.createBlockedPeriod(
      Number(req.params.id),
      req.user.id,
      { startDate: req.body.start_date, endDate: req.body.end_date }
    );
    res.status(201).json({ blockedPeriod });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const blockedPeriods = await blockedPeriodService.listBlockedPeriods(
      Number(req.params.id),
      req.user.id
    );
    res.json({ blockedPeriods });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await blockedPeriodService.deleteBlockedPeriod(
      Number(req.params.id),
      req.user.id,
      Number(req.params.blockedPeriodId)
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
