import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import * as propertiesApi from "../api/propertiesApi";
import * as bookingsApi from "../api/bookingsApi";
import Button from "./Button";

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function toISODateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function BookingRequestForm({ propertyId, token, isTenant, onRequireLogin }) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [range, setRange] = useState(undefined);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    propertiesApi
      .getAvailability(propertyId)
      .then((data) => {
        setBookedRanges(data.bookedRanges || []);
        setBlockedRanges(data.blockedRanges || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isTenant) {
      onRequireLogin();
      return;
    }
    if (!range?.from || !range?.to) {
      setError("Seleziona un intervallo di date");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await bookingsApi.create(token, {
        propertyId,
        checkIn: toISODateString(range.from),
        checkOut: toISODateString(range.to),
        note,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Caricamento disponibilità...</p>;
  }

  if (success) {
    return (
      <p className="text-sm text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-lg px-3 py-2">
        Richiesta di prenotazione inviata! Riceverai una notifica quando il proprietario
        risponde.
      </p>
    );
  }

  const occupiedRanges = [...bookedRanges, ...blockedRanges].map((r) => ({
    from: new Date(r.start),
    to: addDays(new Date(r.end), -1),
  }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={[{ before: new Date() }, ...occupiedRanges]}
        modifiers={{ occupied: occupiedRanges }}
        modifiersClassNames={{ occupied: "!bg-red-100 !text-red-400 line-through" }}
      />
      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-100 inline-block" />
          Non disponibile
        </span>
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
        Richiedi prenotazione
      </Button>
    </form>
  );
}

export default BookingRequestForm;
