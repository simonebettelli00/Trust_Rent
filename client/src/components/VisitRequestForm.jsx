import { useEffect, useState } from "react";
import * as propertiesApi from "../api/propertiesApi";
import * as appointmentsApi from "../api/appointmentsApi";
import Button from "./Button";

function VisitRequestForm({ propertyId, token, isTenant, onRequireLogin }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    propertiesApi
      .getSlots(propertyId)
      .then(({ slots }) => setSlots(slots.filter((s) => s.is_open)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isTenant) {
      onRequireLogin();
      return;
    }
    if (!selectedSlotId) {
      setError("Seleziona una fascia oraria");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await appointmentsApi.create(token, { propertyId, slotId: selectedSlotId, note });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Caricamento fasce disponibili...</p>;
  }

  if (success) {
    return (
      <p className="text-sm text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-lg px-3 py-2">
        Richiesta di visita inviata! Riceverai una notifica quando il proprietario risponde.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Il proprietario non ha ancora reso disponibili fasce orarie per le visite.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {slots.map((slot) => (
          <label
            key={slot.id}
            className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${
              selectedSlotId === slot.id
                ? "border-primary-600 bg-primary-50"
                : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="slot"
              checked={selectedSlotId === slot.id}
              onChange={() => setSelectedSlotId(slot.id)}
            />
            {new Date(slot.date).toLocaleDateString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}{" "}
            · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota facoltativa"
        rows={2}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="primary" loading={submitting}>
        Richiedi visita
      </Button>
    </form>
  );
}

export default VisitRequestForm;
