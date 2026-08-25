-- Completa il modello di visite/prenotazioni (FASE 10): riusa owner_slots,
-- appointments, bookings e notifications già esistenti, aggiunge solo ciò
-- che manca, e rimuove la vecchia tabella availability (0 righe, mai usata).

-- owner_slots: uno slot si "chiude" quando una richiesta di visita viene
-- accettata, per evitare ulteriori richieste sullo stesso slot.
ALTER TABLE owner_slots ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true;

-- blocked_periods: periodi che l'owner blocca manualmente (solo immobili
-- 'short'), indipendentemente dalle prenotazioni.
CREATE TABLE IF NOT EXISTS blocked_periods (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_periods_property_id ON blocked_periods(property_id);
CREATE INDEX IF NOT EXISTS idx_blocked_periods_property_dates
  ON blocked_periods(property_id, start_date, end_date);

-- availability: sostituita dal calcolo dinamico su bookings + blocked_periods
-- (breve) e da owner_slots/appointments (lungo). Mai popolata (0 righe).
DROP TABLE IF EXISTS availability;
