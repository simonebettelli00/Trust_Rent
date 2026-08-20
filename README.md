# Trust Rent

Piattaforma web che mette in contatto affittuari (tenant) e proprietari (owner).
Il cuore dell'app è una mappa interattiva con ricerca dinamica degli immobili;
supporta sia affitti a lungo termine (con richiesta di visite) sia affitti
brevi (con richiesta di prenotazione per periodo).

## Stack

- **Frontend**: React 18 + Vite, React Router, TailwindCSS
- **Mappe**: Leaflet + react-leaflet, tile OpenStreetMap (nessuna API key)
- **Geocoding**: Nominatim (OpenStreetMap), ricerca strutturata con fallback a
  cascata e verifica di coerenza sul comune
- **Backend**: Node.js + Express (routes/controllers/services/models/middleware)
- **Database**: PostgreSQL + PostGIS
- **Validazione**: Zod, middleware uniforme su tutte le rotte
- **Auth**: JWT + bcrypt
- **Realtime**: Socket.io (messaggistica)
- **Upload immagini**: Multer su filesystem locale
- **Test**: Vitest + Supertest

## Funzionalità

**Autenticazione**
- Registrazione con scelta ruolo (`tenant` affittuario / `owner` proprietario), login, JWT
- Rotte protette lato client (`ProtectedRoute`) e lato server (`authRequired`, `requireRole`)

**Area proprietario (`/owner`)**
- CRUD completo degli immobili, con upload multiplo di immagini (riordinabili) e geocoding automatico dell'indirizzo
- Scelta del **tipo di affitto** alla creazione dell'annuncio:
  - **Lungo termine**: data di disponibilità + gestione delle fasce orarie per le visite
  - **Breve termine**: sempre prenotabile tranne i periodi già accettati (nessuna fascia visita)
- Dashboard con stato pubblicato/bozza e indicatore quando la posizione geografica non è esatta (approssimata alla via o al comune)

**Area affittuario (`/app`)**
- Mappa interattiva con ricerca dinamica (bounding box), debounce sugli spostamenti, filtri per prezzo e numero stanze
- Ricerca per indirizzo e geolocalizzazione ("Usa la mia posizione")
- Pagina dettaglio immobile: galleria immagini con lightbox, mini-mappa, calendario disponibilità, contatto diretto col proprietario

**Messaggistica**
- Chat 1-a-1 in tempo reale (Socket.io) tra tenant e owner, legata a un immobile
- Badge messaggi non letti, indicatore "letto", riconnessione automatica

**Geocoding robusto**
- Ricerca strutturata (via/città/CAP separati) invece di query a testo libero
- Cascata a 5 livelli (civico → via → centro comune) con verifica di coerenza sul comune restituito, per evitare di posizionare un immobile nel comune sbagliato
- Se nessun livello trova un risultato coerente, l'immobile si salva comunque senza coordinate (mai una posizione sbagliata)

**Robustezza (rifiniture finali)**
- Validazione uniforme lato server con Zod su tutte le rotte, errori nel formato `{ "error": { "code", "message" } }`
- Gestione errori centralizzata (middleware Express) e `ErrorBoundary` lato React
- Stati di caricamento (skeleton) e stati vuoti curati nelle pagine principali
- Componenti condivisi (`Button`, `Input`, `Card`, `Modal`) usati ovunque al posto di `confirm()`/`alert()` nativi
- Audit di sicurezza: nessuna risposta espone mai `password_hash`, ogni rotta sensibile verifica JWT (e ruolo dove serve), query sempre parametrizzate
- Test automatici (auth, ricerca immobili per bounds)

## Struttura

```
trust-rent/
├─ client/
│  └─ src/
│     ├─ api/           chiamate REST al backend
│     ├─ components/    Button, Input, Card, Modal, Skeleton, mappa, chat, ecc.
│     ├─ context/        AuthContext, SocketContext, ConversationsContext
│     ├─ pages/          Home, Login, Register, TenantApp, PropertyDetail,
│     │                  Messages, owner/OwnerDashboard, owner/PropertyForm
│     └─ App.jsx
├─ server/
│  ├─ src/
│  │  ├─ routes/        definizione endpoint + middleware di validazione
│  │  ├─ controllers/   gestione richieste HTTP
│  │  ├─ services/      logica di business
│  │  ├─ models/        query SQL parametrizzate
│  │  ├─ middleware/    auth, validate, upload, errorHandler
│  │  ├─ validation/    schemi Zod
│  │  ├─ socket/        gestione Socket.io
│  │  ├─ app.js         app Express (per i test)
│  │  └─ index.js       avvio del server (http + socket)
│  ├─ migrations/       migrazioni SQL, eseguite in ordine da scripts/migrate.js
│  └─ tests/            test Vitest + Supertest
└─ README.md
```

## Requisiti

- Node.js >= 18
- PostgreSQL con estensione PostGIS disponibile

## Installazione

```bash
npm run install:all
```

Questo installa le dipendenze sia in `client/` che in `server/`.

## Configurazione

Copia i file `.env.example` e imposta i valori:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Variabili server (`server/.env`):

- `DATABASE_URL` — stringa di connessione PostgreSQL
- `JWT_SECRET` — secret per la firma dei JWT
- `PORT` — porta del server Express (default 4000)
- `CLIENT_URL` — URL del client, usato per CORS e per Socket.io (default http://localhost:5173)

Variabili client (`client/.env`):

- `VITE_API_URL` — URL del backend (default http://localhost:4000)

## Migrazioni database

Assicurati che il database indicato in `DATABASE_URL` esista, poi esegui:

```bash
npm run migrate
```

Esegue in ordine tutti i file `.sql` in `server/migrations/` (creazione schema,
estensione PostGIS, evoluzioni successive come `rental_type`, `owner_slots`,
`bookings`, `notifications`).

## Avvio in sviluppo

Per avviare client e server insieme:

```bash
npm run dev
```

Oppure separatamente:

```bash
npm run dev:client
npm run dev:server
```

- Client disponibile su http://localhost:5173
- Server disponibile su http://localhost:4000

## Test

```bash
cd server
npm test
```

Esegue i test Vitest/Supertest (autenticazione, ricerca immobili per bounds)
contro il database configurato in `DATABASE_URL`; i dati creati dai test
vengono ripuliti automaticamente al termine.

## Verifica

Con il server avviato, verifica l'endpoint di health check:

```bash
curl http://localhost:4000/api/health
```

Risposta attesa:

```json
{ "status": "ok" }
```
