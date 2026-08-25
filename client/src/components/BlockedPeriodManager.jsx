import { useState } from "react";
import * as blockedPeriodsApi from "../api/blockedPeriodsApi";
import Button from "./Button";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function BlockedPeriodManager({ propertyId, token, periods, onPeriodsChange }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Compila data di inizio e fine");
      return;
    }
    if (endDate <= startDate) {
      setError("La data di fine deve essere successiva a quella di inizio");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { blockedPeriod } = await blockedPeriodsApi.create(token, propertyId, {
        startDate,
        endDate,
      });
      onPeriodsChange([...periods, blockedPeriod]);
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await blockedPeriodsApi.remove(token, propertyId, id);
      onPeriodsChange(periods.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!propertyId) {
    return (
      <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        Salva prima l'immobile per poter bloccare dei periodi.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-gray-700">Periodi bloccati manualmente</span>

      {periods.length > 0 && (
        <ul className="flex flex-col gap-2">
          {periods.map((period) => (
            <li
              key={period.id}
              className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              <span>
                {formatDate(period.start_date)} → {formatDate(period.end_date)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(period.id)}
                className="text-red-600 hover:underline text-xs"
              >
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Da
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          A
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <Button type="submit" variant="outline" loading={submitting}>
          + Blocca periodo
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default BlockedPeriodManager;
