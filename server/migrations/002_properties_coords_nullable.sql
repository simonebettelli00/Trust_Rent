-- Permette di salvare un immobile senza coordinate quando il geocoding
-- (con tutti i tentativi di fallback) non trova un risultato, in modo da
-- non bloccare la pubblicazione: l'immobile potrà essere posizionato
-- manualmente in un secondo momento.
ALTER TABLE properties ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN lng DROP NOT NULL;
