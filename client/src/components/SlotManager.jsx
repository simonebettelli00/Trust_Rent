import { useState } from "react";
import * as propertiesApi from "../api/propertiesApi";
import Button from "./Button";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function SlotManager({ propertyId, token, slots, onSlotsChange }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      setError("Compila data, ora inizio e ora fine");
      return;
    }
    if (startTime >= endTime) {
      setError("L'ora di fine deve essere successiva all'ora di inizio");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { slot } = await propertiesApi.createSlot(token, propertyId, { date, startTime, endTime });
      onSlotsChange([...slots, slot].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)));
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(slotId) {
    setError("");
    try {
      await propertiesApi.deleteSlot(token, propertyId, slotId);
      onSlotsChange(slots.filter((s) => s.id !== slotId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!propertyId) {
    return (
      <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        Salva prima l'immobile per poter aggiungere le fasce di visita.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-gray-700">Disponibilità per le visite</span>

      {slots.length > 0 && (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              <span>
                {formatDate(slot.date)} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(slot.id)}
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
          Data
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Dalle
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Alle
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <Button type="submit" variant="outline" loading={submitting}>
          + Aggiungi fascia
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default SlotManager;
