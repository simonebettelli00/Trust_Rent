-- Traccia il livello di precisione ottenuto dal geocoding (civico | via |
-- comune | null), così il frontend può segnalare quando una posizione è
-- approssimata invece che esatta sul civico.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS geocode_precision VARCHAR(10);
