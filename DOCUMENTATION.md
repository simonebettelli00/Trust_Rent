# Trust Rent — Documentazione tecnica

Documentazione di riferimento dell'intero progetto: architettura, modello dati,
API REST, eventi realtime e struttura del frontend. Per l'installazione e
l'avvio rapido vedi [README.md](README.md).

---

## 1. Panoramica

Trust Rent è una piattaforma che mette in contatto **affittuari** (`tenant`) e
**proprietari** (`owner`). Ogni immobile ha un **tipo di affitto**:

- **`long`** (lungo termine): l'affittuario richiede una **visita** su una
  fascia oraria proposta dal proprietario.
- **`short`** (breve termine): l'affittuario richiede la **prenotazione** di
  un periodo (check-in → check-out).

In entrambi i casi è sempre disponibile il contatto diretto via chat
(Socket.io) e le notifiche in-app in tempo reale su richieste ed esiti.

## 2. Stack tecnologico

| Livello | Tecnologie |
|---|---|
| Frontend | React 18, Vite, React Router, TailwindCSS |
| Mappe | Leaflet, react-leaflet, tile OpenStreetMap |
| Geocoding | Nominatim (OpenStreetMap), ricerca strutturata con fallback |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL + PostGIS |
| Validazione | Zod |
| Auth | JWT + bcrypt |
| Realtime | Socket.io |
| Upload | Multer (filesystem locale) |
| Test | Vitest + Supertest |

## 3. Struttura cartelle

```
trust-rent/
├─ client/src/
│  ├─ api/          chiamate REST al backend (un file per risorsa)
│  ├─ components/   componenti riutilizzabili e di dominio
│  ├─ context/       stato globale via React Context
│  ├─ pages/         una pagina per rotta (pages/owner/ per l'area proprietario)
│  ├─ App.jsx        definizione delle rotte
│  └─ main.jsx       bootstrap React, provider, CSS globali
├─ server/src/
│  ├─ routes/        definizione endpoint Express + middleware di validazione
│  ├─ controllers/   estraggono i dati dalla request, chiamano i service, rispondono
│  ├─ services/       logica di business (regole, side-effect, notifiche)
│  ├─ models/         query SQL parametrizzate (unico punto di accesso al DB)
│  ├─ middleware/     auth, validate, upload, errorHandler
│  ├─ validation/     schemi Zod per body/query/params
│  ├─ socket/         inizializzazione Socket.io e gestione eventi
│  ├─ utils/          AppError
│  ├─ app.js          istanza Express (usata anche dai test, senza listen)
│  └─ index.js        crea l'HTTP server, avvia Socket.io, mette in ascolto
├─ server/migrations/  script SQL eseguiti in ordine da scripts/migrate.js
└─ server/tests/       test Vitest + Supertest
```

Flusso di una richiesta REST: `routes` (auth + validate) → `controller` →
`service` (regole di business) → `model` (query SQL) → risposta JSON. Gli
errori attesi sono istanze di `AppError` (vedi §5.6) e arrivano tutte al
middleware `errorHandler`.

## 4. Modello dati

Schema finale (dopo tutte le migrazioni in `server/migrations/`).

### `users`
| Colonna | Tipo | Note |
|---|---|---|
| id | SERIAL PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt, mai esposto nelle risposte API |
| role | VARCHAR | `'tenant'` \| `'owner'` |
| full_name | VARCHAR | |
| phone | VARCHAR | opzionale |
| created_at | TIMESTAMPTZ | |

### `properties`
| Colonna | Tipo | Note |
|---|---|---|
| id | SERIAL PK | |
| owner_id | FK → users | `ON DELETE CASCADE` |
| title, description | | |
| rental_type | VARCHAR | `'long'` \| `'short'`, default `'long'` |
| address, city, postal_code | | |
| lat, lng | DOUBLE PRECISION, nullable | null se il geocoding non trova nulla |
| geom | GEOGRAPHY(Point,4326) | derivato da lat/lng, usato per la ricerca su bounds |
| geocode_precision | VARCHAR | `'civico'` \| `'via'` \| `'comune'` \| null |
| floor, sqm, num_rooms, num_bathrooms | | |
| furnishings | JSONB | array di stringhe |
| monthly_price, deposit | NUMERIC | |
| available_from | DATE | usato principalmente per i `long` |
| is_published | BOOLEAN | |
| created_at, updated_at | | |

Indici: `owner_id`, `(lat, lng)`, GIST su `geom`.

### `property_images`
`id, property_id(FK), url, sort_order` — indice su `property_id`.

### `owner_slots` (solo `long`)
Fasce di visita proposte dal proprietario.
`id, property_id(FK), date, start_time, end_time, is_open(bool, default true), created_at`.
`is_open` passa a `false` quando una richiesta di visita su quello slot viene
accettata (evita ulteriori richieste sullo stesso slot).

### `appointments` (richieste di visita, solo `long`)
`id, property_id(FK), tenant_id(FK), owner_id(FK), slot_id(FK owner_slots, nullable),
requested_date, start_time, end_time, status('pending'|'accepted'|'declined'),
note, created_at`.
Più richieste **pending** sullo stesso slot sono ammesse (la visita non
blocca nulla); quando una viene accettata le altre pending sullo stesso slot
vengono auto-rifiutate.

### `bookings` (richieste di prenotazione periodo, solo `short`)
`id, property_id(FK), tenant_id(FK), owner_id(FK), check_in, check_out,
status('pending'|'accepted'|'declined'), note, created_at`.
Indice parziale su `(property_id, check_in, check_out) WHERE status='accepted'`
per verificare velocemente le sovrapposizioni. Una nuova richiesta viene
rifiutata se si sovrappone a un booking **accepted o pending** esistente;
solo i booking **accepted** rendono un periodo realmente occupato.

### `blocked_periods` (solo `short`)
`id, property_id(FK), start_date, end_date, created_at` — periodi bloccati
manualmente dal proprietario, indipendenti dalle prenotazioni.

### `notifications`
`id, user_id(FK), type, related_id, message, is_read, created_at`.
`type` ∈ `appointment_request | appointment_accepted | appointment_declined |
booking_request | booking_accepted | booking_declined`. `related_id` punta a
`appointments.id` o `bookings.id` a seconda di `type` (nessuna FK diretta
possibile su due tabelle).

### `conversations`
`id, property_id(FK), tenant_id(FK), owner_id(FK), created_at` —
`UNIQUE(property_id, tenant_id, owner_id)`: una sola conversazione per coppia
tenant/owner su un dato immobile.

### `messages`
`id, conversation_id(FK), sender_id(FK), body, is_read, created_at`.

> La tabella `availability` (Fase 1) è stata **rimossa** (migrazione 005):
> non veniva mai popolata; la disponibilità è ora calcolata dinamicamente da
> `bookings` + `blocked_periods` (per gli `short`) e da `owner_slots` /
> `appointments` (per i `long`).

## 5. Backend — riferimento moduli

### 5.1 Middleware (`server/src/middleware/`)
- **`auth.js`** — `authRequired` verifica il JWT e popola `req.user`;
  `requireRole(role)` verifica `req.user.role`.
- **`validate.js`** — factory `validate({ body, query, params })`: valida con
  gli schemi Zod passati e normalizza gli errori in `{ error: { code: "VALIDATION_ERROR", message } }`.
  `req.query`/`req.params` vengono **mutati in place** (non riassegnati: in
  Express 5 sono proprietà con solo getter).
- **`upload.js`** — configurazione Multer (disco, filtro solo immagini,
  5MB/file, max 10 file), espone `UPLOADS_DIR`.
- **`errorHandler.js`** — `notFoundHandler` (404 generico) ed `errorHandler`
  centralizzato: gestisce `AppError`, `multer.MulterError` ed errori di JSON
  malformato, altrimenti risponde 500 generico e logga.

### 5.2 Utils
- **`AppError.js`** — `class AppError extends Error { constructor(status, code, message) }`,
  l'unico tipo di errore "atteso" che l'`errorHandler` traduce in risposta JSON.

### 5.3 Modelli (`server/src/models/`)
Un file per tabella/aggregato, solo query SQL parametrizzate (nessuna logica
di business): `userModel`, `propertyModel` (include `searchInBounds` per la
ricerca su mappa), `propertyImageModel`, `ownerSlotModel`, `appointmentModel`,
`bookingModel`, `blockedPeriodModel`, `notificationModel`, `conversationModel`,
`messageModel`.

### 5.4 Servizi (`server/src/services/`)
- **`authService`** — hashing/verifica password, generazione JWT, controllo
  email duplicata.
- **`geocodingService`** — vedi §8.1.
- **`propertyService`** — CRUD immobili, controllo ownership, orchestrazione
  geocoding su create/update, ricerca per bounds.
- **`ownerSlotService`** — CRUD fasce di visita (solo su immobili `long`).
- **`blockedPeriodService`** — CRUD periodi bloccati (solo su immobili `short`).
- **`appointmentService`** — richiesta/risposta visita, auto-rifiuto delle
  richieste pending concorrenti sullo stesso slot, notifiche.
- **`bookingService`** — richiesta/risposta prenotazione, controllo
  sovrapposizioni, calcolo disponibilità pubblica, notifiche.
- **`notificationService`** — crea la notifica su DB e la spinge in realtime
  con `emitToUser`.
- **`conversationService`** — crea/recupera conversazioni, invio/lettura
  messaggi, verifica che l'utente sia partecipante (usato sia da REST sia
  dagli handler Socket.io).

### 5.5 Controller (`server/src/controllers/`)
Uno per risorsa (`authController`, `propertyController`, `ownerSlotController`,
`blockedPeriodController`, `appointmentController`, `bookingController`,
`notificationController`, `conversationController`, `geocodeController`):
estraggono i campi da `req`, chiamano il service, mappano l'esito su
status/JSON, propagano gli errori a `next(err)`.

### 5.6 Validazione (`server/src/validation/`)
Schemi Zod per ogni risorsa (`authSchemas`, `propertySchemas`,
`appointmentSchemas`, `bookingSchemas`, `blockedPeriodSchemas`,
`notificationSchemas`, `conversationSchemas`, `geocodeSchemas`). Coprono
shape/formato/range (campi obbligatori, enum, coercizione numerica, range di
date); le regole di business (unicità, ownership, sovrapposizioni) restano nei
service.

### 5.7 Socket.io (`server/src/socket/index.js`)
Handshake autenticato col JWT (`socket.handshake.auth.token`). Alla
connessione ogni socket entra automaticamente nella stanza personale
`user:<id>`, usata da `emitToUser(userId, event, payload)` per notifiche
realtime lanciate da codice REST (non solo da eventi socket).

| Evento (client→server) | Payload | Effetto |
|---|---|---|
| `join:conversation` | `conversationId` | entra nella stanza `conversation:<id>` (verifica partecipazione) |
| `message:send` | `{ conversationId, body }` | salva il messaggio, emette `message:new` alla stanza |
| `message:read` | `{ conversationId }` | segna letti, emette `message:read` alla stanza |

| Evento (server→client) | Payload | Quando |
|---|---|---|
| `message:new` | messaggio | nuovo messaggio in una conversazione |
| `message:read` | `{ conversationId, messageIds, readBy }` | messaggi segnati come letti |
| `notification:new` | notifica | nuova notifica per l'utente (stanza `user:<id>`) |

## 6. API REST

Tutte le risposte di errore hanno il formato uniforme
`{ "error": { "code": "...", "message": "..." } }`. Base URL: `VITE_API_URL`
(client) / `PORT` (server), default `http://localhost:4000`.

### Health
| Metodo | Path | Auth |
|---|---|---|
| GET | `/api/health` | pubblica |

### Auth (`/api/auth`)
| Metodo | Path | Auth | Body |
|---|---|---|---|
| POST | `/register` | pubblica | `email, password, full_name, phone?, role` |
| POST | `/login` | pubblica | `email, password` |
| GET | `/me` | JWT | — |

### Properties (`/api/properties`)
| Metodo | Path | Auth | Note |
|---|---|---|---|
| GET | `/mine` | owner | immobili dell'owner corrente |
| GET | `/?north=&south=&east=&west=&minPrice=&maxPrice=&rooms=` | pubblica | ricerca per bounding box, solo `is_published`, max 200 risultati |
| GET | `/:id` | pubblica | dettaglio + `owner_name` |
| GET | `/:id/availability` | pubblica | `{ bookedRanges, blockedRanges }` (solo `short`, vuoto per `long`) |
| POST | `/` | owner | crea immobile (geocoding automatico) |
| PUT | `/:id` | owner (proprietario) | aggiorna, ri-geocodifica se cambia indirizzo |
| PATCH | `/:id/publish` | owner (proprietario) | `{ is_published }` |
| DELETE | `/:id` | owner (proprietario) | |
| POST | `/:id/images` | owner (proprietario) | multipart, Multer, campo `images` |
| DELETE | `/:id/images/:imageId` | owner (proprietario) | |
| PUT | `/:id/images/order` | owner (proprietario) | `{ order: [{id, sort_order}] }` |
| GET | `/:id/slots` | pubblica | fasce di visita (il client filtra `is_open`) |
| POST | `/:id/slots` | owner (proprietario, solo `long`) | `{ date, start_time, end_time }` |
| DELETE | `/:id/slots/:slotId` | owner (proprietario) | |
| GET | `/:id/blocked-periods` | owner (proprietario) | |
| POST | `/:id/blocked-periods` | owner (proprietario, solo `short`) | `{ start_date, end_date }` |
| DELETE | `/:id/blocked-periods/:blockedPeriodId` | owner (proprietario) | |

### Geocode (`/api/geocode`)
| Metodo | Path | Auth |
|---|---|---|
| GET | `/?q=` | pubblica — usata dalla barra di ricerca mappa |

### Appointments — richieste di visita (`/api/appointments`)
| Metodo | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | tenant | `{ property_id, slot_id, note? }` |
| GET | `/mine` | JWT | proprie richieste (come tenant o owner) |
| PATCH | `/:id` | owner (dell'immobile) | `{ status: 'accepted'|'declined' }` |

### Bookings — richieste di prenotazione (`/api/bookings`)
| Metodo | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | tenant | `{ property_id, check_in, check_out, note? }` |
| GET | `/mine` | JWT | |
| PATCH | `/:id` | owner (dell'immobile) | `{ status: 'accepted'|'declined' }` |

### Notifications (`/api/notifications`)
| Metodo | Path | Auth |
|---|---|---|
| GET | `/` | JWT |
| PATCH | `/:id/read` | JWT (solo proprie notifiche) |

### Conversations (`/api/conversations`)
| Metodo | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | tenant | `{ property_id }` — crea o recupera la conversazione |
| GET | `/` | JWT | lista con ultimo messaggio, controparte, non letti |
| GET | `/:id/messages` | JWT (partecipante) | storico messaggi |

## 7. Frontend — riferimento moduli

### 7.1 Context (`client/src/context/`)
- **`AuthContext`** — utente corrente, token (persistito in `localStorage`),
  `login`, `register`, `logout`; ricarica `/api/auth/me` all'avvio.
- **`SocketContext`** — istanza Socket.io condivisa, creata/distrutta in base
  al token; espone `socket`, `connected`.
- **`ConversationsContext`** — lista conversazioni sincronizzata via API +
  eventi socket, `totalUnread`, `markConversationReadLocally`.
- **`NotificationsContext`** — lista notifiche, `totalUnread`, `markRead`,
  aggiornata in realtime su `notification:new`.

### 7.2 API client (`client/src/api/`)
Un file per risorsa REST (`authApi`, `propertiesApi`, `appointmentsApi`,
`bookingsApi`, `blockedPeriodsApi`, `notificationsApi`, `conversationsApi`,
`geocodeApi`), più `client.js` (wrapper fetch generico con header
`Authorization`). Ogni funzione ritorna una Promise col JSON già parsato o
lancia un `Error` col messaggio del backend.

### 7.3 Componenti riutilizzabili (`client/src/components/`)
- **UI generica**: `Button`, `Input`, `Card`, `Modal`, `Skeleton`, `Footer`.
- **Navigazione**: `Navbar` (badge messaggi/notifiche non letti),
  `ProtectedRoute` (blocca l'accesso se non loggato o ruolo errato).
- **Immobili**: `PropertyCard` (card lista/mappa), `FurnishingsCheckboxes`,
  `ImageGallery` (griglia + lightbox), `ImageUploader`.
- **Mappa**: `PropertyMap` (ricerca dinamica con bounds), `PropertyMiniMap`
  (statica, dettaglio immobile), `SearchBar` (ricerca indirizzo + geolocalizzazione).
- **Gestione owner**: `SlotManager` (fasce di visita), `BlockedPeriodManager`
  (periodi bloccati).
- **Richieste tenant**: `VisitRequestForm` (sceglie uno slot aperto),
  `BookingRequestForm` (calendario a intervallo con date occupate disabilitate).
- **Chat**: `ConversationListItem`, `MessageBubble`.
- **`ErrorBoundary`** — cattura errori di rendering React, mostra un
  messaggio invece di una schermata bianca.

### 7.4 Pagine (`client/src/pages/`)
| Pagina | Rotta | Ruolo |
|---|---|---|
| `Home` | `/` | pubblica |
| `Login`, `Register` | `/login`, `/register` | pubblica |
| `TenantApp` | `/app` | tenant — mappa + ricerca dinamica |
| `TenantRequests` | `/app/requests` | tenant — proprie visite/prenotazioni |
| `PropertyDetail` | `/property/:id` | pubblica — pannello visita o prenotazione in base a `rental_type` |
| `Messages` | `/messages` | qualsiasi ruolo — chat |
| `owner/OwnerDashboard` | `/owner` | owner — lista immobili |
| `owner/PropertyForm` | `/owner/property/new`, `/owner/property/:id/edit` | owner — CRUD immobile, slot, periodi bloccati |
| `owner/OwnerRequests` | `/owner/requests` | owner — richieste ricevute, accetta/rifiuta |

### 7.5 Routing (`App.jsx`) e bootstrap (`main.jsx`)
`main.jsx` monta, dall'esterno verso l'interno: `ErrorBoundary` →
`BrowserRouter` → `AuthProvider` → `SocketProvider` → `ConversationsProvider`
→ `NotificationsProvider` → `App`. `App.jsx` definisce tutte le rotte e
applica `ProtectedRoute` (con eventuale `role`) a quelle non pubbliche.

## 8. Regole di business chiave

### 8.1 Geocoding (`geocodingService.js`)
Cascata di **5 tentativi**, tutti a ricerca strutturata Nominatim
(`street`/`city`/`postalcode` separati, mai `q=` testo libero per gli
immobili), dal più preciso al più generico:

1. civico + via + CAP
2. civico + via (senza CAP)
3. sola via + CAP (civico rimosso con una regex generica)
4. sola via
5. solo comune + CAP (centro del comune)

Ogni risultato viene accettato solo se il **comune restituito da Nominatim
combacia** (confronto normalizzato: minuscolo, senza accenti/punteggiatura)
con quello inserito dall'utente — altrimenti si scarta e si passa al
tentativo successivo. Se nessun tentativo è coerente, l'immobile si salva
comunque con `lat/lng/geocode_precision = null` (mai una posizione sbagliata).
Throttle globale ≥1.1s tra le richieste (policy Nominatim), header
`User-Agent` identificativo.

### 8.2 Auto-rifiuto delle richieste concorrenti
Quando l'owner **accetta** una richiesta di visita, tutte le altre richieste
**pending** sullo stesso `slot_id` vengono automaticamente impostate a
`declined` (e i rispettivi tenant notificati) — idem per i `bookings` con
periodo sovrapposto.

### 8.3 Disponibilità calcolata (non più tabellare)
`GET /api/properties/:id/availability` non legge più righe per-giorno: per
gli immobili `short` unisce i range di `bookings` con `status='accepted'` e
di `blocked_periods`; per i `long` ritorna range vuoti (la disponibilità
"vera" per i long è l'elenco degli `owner_slots` aperti).

## 9. Test

`server/tests/` (Vitest + Supertest, contro il DB reale configurato in
`DATABASE_URL`, con pulizia automatica dei dati creati):
- `auth.test.js` — registrazione (successo, email duplicata, dati non
  validi), login (successo, credenziali errate), nessuna esposizione di
  `password_hash`.
- `properties.test.js` — validazione bounds obbligatori, ricerca valida,
  filtro `maxPrice`.

`npm test` nella cartella `server/`.

## 10. Sicurezza

- `password_hash` non è mai incluso nelle risposte API (verificato anche da
  test automatico).
- Ogni rotta non pubblica ha `authRequired`; le rotte per ruolo aggiungono
  `requireRole('tenant'|'owner')`; le operazioni su una risorsa specifica
  (immobile, slot, appuntamento, prenotazione, periodo bloccato, notifica)
  verificano anche l'ownership nel service.
- Tutte le query usano parametri (`$1, $2, ...`), nessuna interpolazione di
  input utente in SQL.
- Validazione uniforme con Zod su tutte le rotte prima di raggiungere i
  service.
- Nessun `dangerouslySetInnerHTML` nel frontend.
