# Prompt di progetto — "Trust Rent"

> **Come usare questo prompt:** incollalo nella chat del tuo assistente AI in VS Code (Copilot Chat, Cursor, Claude, ecc.) come *brief iniziale del progetto*. Consiglio di NON chiedere tutto in un colpo solo: fai partire l'assistente dalla **Fase 1** e prosegui fase per fase. In fondo trovi le fasi suggerite.

---

## 1. Contesto e obiettivo

Voglio costruire un'applicazione web chiamata **Trust Rent**: una piattaforma che mette in contatto chi cerca un immobile in affitto (**affittuari**) con chi possiede immobili da affittare (**proprietari**).

Il cuore dell'app è una **mappa interattiva** che mostra gli immobili in affitto vicino alla posizione dell'utente (o a un indirizzo inserito manualmente), con una **lista di annunci sotto la mappa che si aggiorna dinamicamente** quando l'utente sposta la mappa o fa zoom in / zoom out.

Voglio codice pulito, commentato in italiano, organizzato in modo modulare e facile da estendere.

---

## 2. Stack tecnologico

Usa questo stack (è la scelta di default, ottima per un MVP):

- **Frontend:** React 18 + Vite, React Router per il routing, TailwindCSS per lo stile.
- **Mappe:** **Leaflet** con tile di OpenStreetMap (gratuito, nessuna API key). Usa `react-leaflet`.
- **Backend:** Node.js + Express, con struttura a controller/route/service.
- **Database:** PostgreSQL con estensione **PostGIS** per le query geospaziali (immobili dentro un'area della mappa). In alternativa, se PostGIS non è disponibile, usa colonne `lat`/`lng` normali con query a bounding-box.
- **Autenticazione:** JWT (access token) con password hashate tramite bcrypt.
- **Messaggistica in tempo reale:** Socket.io.
- **Upload immagini:** Multer lato server, con salvataggio su filesystem locale (predisponi però il codice per poter passare in futuro a un servizio cloud come S3/Cloudinary).

> 🔧 **Se preferisci uno stack diverso**, cambia solo questa sezione, ad esempio:
> - *Full-stack unico:* "Usa **Next.js** (App Router) con API routes al posto di React+Express separati."
> - *Senza backend da scrivere:* "Usa **Supabase** per database, autenticazione, storage immagini e realtime; frontend React+Vite."
> - *Google:* "Usa **Firebase** (Auth + Firestore + Storage) e Google Maps al posto di Leaflet."

Tutto il resto del prompt resta valido.

---

## 3. Ruoli utente

L'app ha **due tipi di utente**, con aree dedicate e distinte:

1. **Affittuario (tenant):** cerca immobili, esplora la mappa, apre gli annunci, contatta i proprietari e chiede appuntamenti.
2. **Proprietario (owner):** pubblica e gestisce i propri immobili, inserisce tutti i dettagli e le immagini, gestisce il calendario delle disponibilità e risponde ai messaggi.

Il ruolo viene scelto in **fase di registrazione** e determina l'area in cui l'utente atterra dopo il login. Le rotte devono essere protette in base al ruolo (un affittuario non può accedere alle pagine di gestione immobili e viceversa).

---

## 4. Modello dati

Crea queste entità (adatta i tipi al database scelto):

**users**
- `id`, `email` (unico), `password_hash`, `role` (`tenant` | `owner`), `full_name`, `phone`, `created_at`

**properties**
- `id`, `owner_id` (FK users), `title`, `description`
- `address`, `city`, `postal_code`, `lat`, `lng` (per la mappa; opzionale colonna geografica PostGIS `geom`)
- `floor` (piano), `sqm` (metri quadri), `num_rooms` (stanze), `num_bathrooms` (bagni)
- `furnishings` (JSON/array: es. lavatrice, aria condizionata, arredato, ascensore, box auto…)
- `monthly_price`, `deposit`, `available_from`
- `is_published`, `created_at`, `updated_at`

**property_images**
- `id`, `property_id` (FK), `url`, `sort_order`

**availability** (calendario disponibilità immobile)
- `id`, `property_id` (FK), `date` (o `start_date`/`end_date`), `status` (`available` | `booked` | `blocked`)

**conversations** e **messages** (messaggistica interna)
- `conversations`: `id`, `property_id`, `tenant_id`, `owner_id`, `created_at`
- `messages`: `id`, `conversation_id`, `sender_id`, `body`, `is_read`, `created_at`

**appointments** (richieste di appuntamento)
- `id`, `property_id`, `tenant_id`, `owner_id`, `requested_datetime`, `status` (`pending` | `accepted` | `declined`), `note`, `created_at`

---

## 5. Pagine, rotte e flussi

### Pagine pubbliche (utente non loggato)
- **Landing / Home:** presenta Trust Rent e spiega come funziona (hero, sezioni "Come funziona in 3 passi", vantaggi per affittuari e per proprietari, call-to-action verso registrazione/login). Deve essere una landing curata e responsive.
- **Login** (`/login`)
- **Registrazione** (`/register`): form con scelta del ruolo (affittuario / proprietario).

### Area affittuario (dopo login)
- **Ricerca su mappa** (`/app` — pagina principale): 
  - Mappa Leaflet a schermo, con marker per ogni immobile disponibile nell'area visibile.
  - Barra di ricerca per indirizzo (geocoding) + pulsante **"Usa la mia posizione"** (Geolocation API del browser).
  - **Sotto la mappa, una lista di annunci** che mostra gli immobili presenti nell'area attualmente visibile.
  - La lista e i marker si **aggiornano dinamicamente** quando l'utente sposta la mappa o fa zoom (vedi requisito tecnico §6.1).
- **Dettaglio immobile** (`/property/:id`): al click su un annuncio o su un marker mostra tutte le info:
  - Galleria immagini della casa
  - Via/indirizzo, piano, metri quadri, numero stanze, numero bagni, forniture/arredamento, prezzo mensile, deposito
  - **Calendario delle disponibilità** (sola lettura per l'affittuario)
  - Pulsante **"Contatta il proprietario"** che apre la messaggistica interna
  - Pulsante **"Richiedi appuntamento"** (sceglie una data disponibile → crea un `appointment`)
- **Messaggi** (`/messages`): elenco conversazioni + chat in tempo reale con il proprietario.

### Area proprietario (dopo login)
- **Dashboard** (`/owner`): elenco dei propri immobili con stato (pubblicato/bozza).
- **Nuovo / modifica immobile** (`/owner/property/new`, `/owner/property/:id/edit`): form completo con tutti i campi del modello dati + upload immagini + posizionamento su mappa (l'indirizzo viene geocodificato in lat/lng).
- **Gestione disponibilità** (`/owner/property/:id/availability`): calendario in cui il proprietario segna i giorni disponibili/occupati.
- **Messaggi** (`/messages`): stesse conversazioni, lato proprietario.
- **Richieste di appuntamento**: elenco appuntamenti ricevuti da accettare/rifiutare.

Dopo il login, reindirizza automaticamente: affittuario → `/app`, proprietario → `/owner`.

---

## 6. Requisiti tecnici chiave

### 6.1 Ricerca dinamica sulla mappa (fondamentale)
- Quando la mappa viene spostata o zoomata (evento `moveend`/`zoomend` di Leaflet), leggi i **bounds** correnti (angolo nord-est e sud-ovest).
- Invia questi bounds al backend con una chiamata tipo `GET /api/properties?north=..&south=..&east=..&west=..`.
- Il backend restituisce **solo gli immobili pubblicati che ricadono in quel rettangolo** (query a bounding-box su lat/lng, oppure `ST_MakeEnvelope` + `ST_Within` con PostGIS).
- Aggiorna contemporaneamente i **marker sulla mappa** e la **lista sotto la mappa**.
- Applica un **debounce** (es. 300–500 ms) alle chiamate per non sovraccaricare il server mentre l'utente muove la mappa.

### 6.2 Geolocalizzazione e geocoding
- "Usa la mia posizione" → `navigator.geolocation` per centrare la mappa.
- Ricerca per indirizzo → geocoding con **Nominatim** di OpenStreetMap (gratuito) per ottenere lat/lng da un indirizzo testuale.

### 6.3 Messaggistica interna
- Chat 1-a-1 tra affittuario e proprietario, legata a uno specifico immobile.
- Realtime con Socket.io; salva ogni messaggio nel DB.
- Mostra stato "letto/non letto" e ordina le conversazioni per ultimo messaggio.

### 6.4 Calendario disponibilità
- Il proprietario segna i giorni; l'affittuario li vede in sola lettura e può richiedere un appuntamento su un giorno disponibile.
- Puoi usare una libreria calendario (es. `react-day-picker` o `FullCalendar`).

### 6.5 Sicurezza e validazione
- Rotte protette da JWT; middleware che verifica il ruolo.
- Validazione input lato server (es. Zod o express-validator).
- Non esporre mai `password_hash` nelle risposte API.

---

## 7. Struttura del progetto suggerita

```
trust-rent/
├─ client/                 # React + Vite
│  ├─ src/
│  │  ├─ pages/            # Landing, Login, Register, MapSearch, PropertyDetail, OwnerDashboard...
│  │  ├─ components/       # MapView, ListingCard, MessageThread, AvailabilityCalendar...
│  │  ├─ context/          # AuthContext
│  │  ├─ api/              # client HTTP (axios/fetch)
│  │  └─ App.jsx
├─ server/                 # Node + Express
│  ├─ src/
│  │  ├─ routes/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  ├─ middleware/       # auth, role-check
│  │  ├─ models/           # o query SQL
│  │  ├─ socket/           # gestione Socket.io
│  │  └─ index.js
│  └─ migrations/          # schema DB
└─ README.md
```

---

## 8. Design e UX

- Interfaccia moderna, pulita, **mobile-first** e responsive.
- Palette che comunichi fiducia (il nome è "Trust" Rent): toni di blu/verde, buon contrasto, spazi generosi.
- Card degli annunci con immagine di copertina, prezzo in evidenza, città/zona, mq e numero stanze.
- Stati di caricamento (skeleton) e messaggi di errore chiari.

---

## 9. Fasi di sviluppo consigliate

Costruiamo il progetto **una fase alla volta**. Alla fine di ogni fase, fermati e mostrami il risultato prima di procedere.

1. **Setup:** scaffolding di `client` e `server`, dipendenze, configurazione Tailwind, connessione al database, schema/migrazioni.
2. **Autenticazione:** registrazione con scelta ruolo, login, JWT, rotte protette, redirect per ruolo.
3. **Landing page** pubblica + pagine login/registrazione con stile curato.
4. **CRUD immobili (lato proprietario):** form completo, upload immagini, geocoding indirizzo → lat/lng, dashboard.
5. **Mappa + ricerca dinamica (lato affittuario):** Leaflet, marker, lista sotto la mappa, aggiornamento su move/zoom con debounce, geolocalizzazione.
6. **Dettaglio immobile:** galleria, tutti i dati, calendario disponibilità in lettura.
7. **Messaggistica interna** in realtime con Socket.io.
8. **Appuntamenti:** richiesta dall'affittuario, accetta/rifiuta dal proprietario.
9. **Rifiniture:** validazioni, gestione errori, responsive, piccoli test.

**Iniziamo dalla Fase 1.** Prima di scrivere codice, elencami i comandi di setup e la struttura delle cartelle che creerai, poi procedi.
