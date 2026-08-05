-- Sistema di prenotazioni/appuntamenti a due tipi di affitto (long/short).

-- properties: tipo di affitto scelto alla creazione dell'annuncio.
-- Default 'long' per compatibilità con gli immobili già esistenti; le nuove
-- creazioni dovranno impostarlo esplicitamente a livello applicativo.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rental_type VARCHAR(10) NOT NULL DEFAULT 'long'
  CHECK (rental_type IN ('long', 'short'));

-- owner_slots: fasce orarie di disponibilità del proprietario per le visite
-- (solo immobili 'long'). Non bloccano nulla di per sé: sono lo slot su cui
-- il tenant può richiedere un appuntamento.
CREATE TABLE IF NOT EXISTS owner_slots (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_owner_slots_property_id ON owner_slots(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_slots_property_date ON owner_slots(property_id, date);

-- appointments: richieste di VISITA per immobili 'long'. Sostituisce la
-- vecchia definizione (mai usata da alcun endpoint: tabella vuota) con lo
-- schema a data+fascia oraria richiesto dal nuovo flusso. Più richieste sullo
-- stesso slot sono ammesse: la visita non blocca nulla finché non è accettata.
DROP TABLE IF EXISTS appointments;

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id INTEGER REFERENCES owner_slots(id) ON DELETE SET NULL,
  requested_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_property_id ON appointments(property_id);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_owner_id ON appointments(owner_id);
CREATE INDEX idx_appointments_slot_id ON appointments(slot_id);

-- bookings: richieste di PRENOTAZIONE periodo per immobili 'short'. Un
-- periodo diventa bloccante (non più selezionabile da altri) solo quando
-- status = 'accepted': l'indice parziale sotto serve proprio a verificare
-- in modo efficiente le sovrapposizioni tra periodi già accettati.
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_accepted_dates
  ON bookings(property_id, check_in, check_out)
  WHERE status = 'accepted';

-- notifications: notifiche in-app generiche per richieste/esiti di visite e
-- prenotazioni. related_id punta a appointments.id o bookings.id a seconda
-- di "type" (nessuna FK diretta possibile su due tabelle diverse).
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'appointment_request', 'appointment_accepted', 'appointment_declined',
    'booking_request', 'booking_accepted', 'booking_declined'
  )),
  related_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
