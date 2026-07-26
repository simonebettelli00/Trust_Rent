# A. CONTESTO DI PROGETTO (memoria fissa — incollare sempre)

> Copia questo blocco all'inizio di ogni sessione, così l'assistente conosce sempre stack, convenzioni e modello dati.

```
Stai lavorando al progetto "Trust Rent", una piattaforma web che mette in
contatto affittuari (chi cerca casa) e proprietari (chi affitta). Il cuore
dell'app è una mappa interattiva con ricerca dinamica degli immobili.

## Stack (fisso, non cambiare)
- Frontend: React 18 + Vite, React Router, TailwindCSS.
- Mappe: Leaflet + react-leaflet, tile OpenStreetMap (nessuna API key).
  Geocoding con Nominatim (OpenStreetMap).
- Backend: Node.js + Express, struttura routes/controllers/services/middleware.
- Database: PostgreSQL con estensione PostGIS (query geospaziali).
- Auth: JWT + bcrypt.
- Realtime: Socket.io.
- Upload immagini: Multer su filesystem locale (predisponi per futuro switch a cloud).

## Convenzioni
- Commenti e messaggi utente in italiano; nomi di variabili/funzioni in inglese.
- Codice modulare e leggibile; niente file monolitici.
- API REST con risposte JSON. Formato errore uniforme: { "error": { "code", "message" } }.
- Non esporre mai password_hash nelle risposte.
- Variabili sensibili in .env (mai hardcoded).
- Ogni rotta protetta verifica JWT; le rotte per ruolo verificano anche role.

## Due ruoli utente
- tenant (affittuario): cerca su mappa, apre annunci, contatta proprietari, chiede appuntamenti.
- owner (proprietario): pubblica/gestisce immobili, immagini, calendario disponibilità, risponde ai messaggi.
Dopo il login: tenant -> /app, owner -> /owner.

## Modello dati
- users: id, email (unico), password_hash, role ('tenant'|'owner'), full_name, phone, created_at
- properties: id, owner_id(FK), title, description, address, city, postal_code,
  lat, lng, geom(PostGIS opz.), floor, sqm, num_rooms, num_bathrooms,
  furnishings(JSON array), monthly_price, deposit, available_from,
  is_published(bool), created_at, updated_at
- property_images: id, property_id(FK), url, sort_order
- availability: id, property_id(FK), date, status ('available'|'booked'|'blocked')
- conversations: id, property_id(FK), tenant_id(FK), owner_id(FK), created_at
- messages: id, conversation_id(FK), sender_id(FK), body, is_read(bool), created_at
- appointments: id, property_id(FK), tenant_id(FK), owner_id(FK),
  requested_datetime, status ('pending'|'accepted'|'declined'), note, created_at

## Struttura cartelle
trust-rent/
├─ client/  (React+Vite: src/pages, src/components, src/context, src/api, App.jsx)
├─ server/  (Express: src/routes, src/controllers, src/services, src/middleware,
│            src/models, src/socket, src/index.js; migrations/)
└─ README.md

## Modo di lavorare
Procedi UNA FASE ALLA VOLTA. Prima di scrivere codice elenca cosa creerai/modificherai
e attendi conferma se qualcosa è ambiguo. Alla fine di ogni fase fai un breve riepilogo
dei file creati e degli endpoint/route esposti.
```

---