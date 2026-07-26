# Trust Rent — Playbook dei prompt & memoria di progetto

Questo documento è la **fonte di verità** del progetto. Contiene:
- Un **blocco di contesto** con le decisioni fisse (da incollare o tenere sempre in vista dell'assistente).
- Un **prompt dettagliato e pronto da copiare per ogni fase**.
- Un **registro di avanzamento** da aggiornare man mano.

**Come lavorare:**
1. All'inizio di ogni nuova sessione con l'assistente in VS Code, incolla il **CONTESTO DI PROGETTO** (sezione A).
2. Poi incolla il prompt della fase su cui stai lavorando.
3. Alla fine della fase, aggiorna il **registro di avanzamento** (sezione C) con cosa è stato creato e le decisioni prese: sarà la "memoria" per le fasi successive.

---

## A. CONTESTO DI PROGETTO (memoria fissa — incollare sempre)

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

## B. PROMPT DELLE FASI

> Ogni prompt qui sotto è pensato per essere incollato **dopo** il blocco di contesto (sezione A). Copia solo il blocco della fase a cui sei arrivato.

---

### FASE 1 — Setup del progetto

```
FASE 1 — Setup.

Obiettivo: creare lo scheletro completo del progetto, funzionante ma vuoto di logica.

Fai questo:
1. Inizializza il monorepo con due sottoprogetti: client/ (React+Vite) e server/ (Express).
2. client/: configura Vite, React Router, TailwindCSS (con tailwind.config e direttive base
   in index.css). Crea un layout base con una navbar placeholder e le rotte vuote:
   "/", "/login", "/register", "/app", "/owner".
3. server/: configura Express con CORS, dotenv, express.json(). Crea src/index.js con un
   endpoint GET /api/health che ritorna { status: "ok" }.
4. Database: crea la connessione a PostgreSQL (usa pg o Knex) leggendo DATABASE_URL da .env.
   Predisponi l'estensione PostGIS.
5. Migrazioni: crea le migrazioni (o uno script SQL in server/migrations/) per TUTTE le
   tabelle del modello dati (users, properties, property_images, availability,
   conversations, messages, appointments) con chiavi esterne e indici sensati
   (indice su properties.lat/lng, su owner_id, su conversation_id dei messaggi).
6. Aggiungi un file .env.example con tutte le variabili necessarie
   (DATABASE_URL, JWT_SECRET, PORT, CLIENT_URL).
7. Script npm per avviare client e server (anche insieme, es. con concurrently) e uno
   script per lanciare le migrazioni.
8. Un README.md con istruzioni di installazione e avvio.

Prima di scrivere, elenca i comandi di setup e la lista dei file che creerai.
Alla fine mostrami come avviare tutto e come verificare /api/health.
```

---

### FASE 2 — Autenticazione e ruoli

```
FASE 2 — Autenticazione.

Obiettivo: registrazione con scelta ruolo, login, JWT, rotte protette, redirect per ruolo.

Backend:
1. POST /api/auth/register — body: { email, password, full_name, phone, role }.
   Valida i dati, verifica email non già usata, hasha la password con bcrypt,
   crea l'utente, ritorna l'utente (senza password_hash) e un JWT.
2. POST /api/auth/login — verifica credenziali, ritorna JWT + utente.
3. GET /api/auth/me — rotta protetta, ritorna l'utente corrente dal token.
4. Middleware authRequired (verifica JWT e popola req.user) e requireRole(role)
   (verifica req.user.role). Formato errore uniforme come da contesto.

Frontend:
5. AuthContext (React Context) che gestisce: utente corrente, token, login(),
   register(), logout(). Salva il token e ricarica /api/auth/me all'avvio.
6. Pagine funzionali Login e Register (form base, la grafica curata arriva in Fase 3).
   Register deve avere la scelta del ruolo (affittuario/proprietario).
7. Componente ProtectedRoute che blocca l'accesso se non loggato e, opzionalmente,
   se il ruolo non corrisponde.
8. Dopo login/registrazione: reindirizza tenant -> /app, owner -> /owner.

Prima di scrivere, elenca gli endpoint e i file che creerai/modificherai.
Alla fine spiegami come testare registrazione e login (anche via curl).
```

---

### FASE 3 — Landing page e grafica delle pagine di accesso

```
FASE 3 — Landing page + stile pagine di accesso.

Obiettivo: rendere pubblica e curata la home, e dare stile a login/registrazione.

1. Landing page ("/"), responsive e mobile-first, con:
   - Navbar con logo "Trust Rent" e pulsanti Login / Registrati.
   - Sezione hero con titolo, sottotitolo e call-to-action.
   - Sezione "Come funziona in 3 passi".
   - Due blocchi affiancati: vantaggi per gli AFFITTUARI e vantaggi per i PROPRIETARI,
     ciascuno con la propria CTA di registrazione.
   - Footer.
2. Applica una palette che comunichi fiducia (blu/verde, buon contrasto, spazi generosi).
   Definisci i colori nel tema Tailwind così sono riutilizzabili.
3. Rifinisci graficamente le pagine Login e Register create in Fase 2 (card centrata,
   stati di errore chiari, link tra le due pagine, loading sul submit).
4. Se un utente è già loggato e apre "/", mostragli un pulsante per entrare nella sua area.

Mantieni i componenti riutilizzabili (Button, Input, Card) in src/components.
Alla fine mostrami uno screenshot testuale della struttura della landing.
```

---

### FASE 4 — Gestione immobili (lato proprietario)

```
FASE 4 — CRUD immobili (owner).

Obiettivo: il proprietario pubblica e gestisce i propri immobili, con immagini e geocoding.

Backend (tutte le rotte protette + requireRole('owner'), tranne le GET pubbliche indicate):
1. POST   /api/properties            — crea immobile (owner corrente).
2. PUT    /api/properties/:id        — modifica (solo se owner_id == utente).
3. DELETE /api/properties/:id        — elimina (solo proprietario).
4. GET    /api/properties/mine       — lista immobili dell'owner corrente.
5. GET    /api/properties/:id        — dettaglio (pubblica).
6. POST   /api/properties/:id/images — upload immagini con Multer, salva in property_images,
   servi la cartella upload come statica.
7. Geocoding: quando si salva/aggiorna un immobile, converti address+city in lat/lng
   tramite Nominatim e salva le coordinate (gestisci il caso indirizzo non trovato).
   Rispetta la policy di Nominatim (User-Agent + max 1 richiesta/sec).

Frontend (area owner):
8. Dashboard "/owner": tabella/griglia degli immobili dell'utente con stato
   pubblicato/bozza e azioni (modifica, elimina, pubblica/nascondi).
9. Form "/owner/property/new" e "/owner/property/:id/edit" con TUTTI i campi del modello:
   title, description, address, city, postal_code, floor, sqm, num_rooms,
   num_bathrooms, furnishings (checkbox multipli: arredato, lavatrice, aria condizionata,
   ascensore, box auto, ecc.), monthly_price, deposit, available_from.
10. Upload multiplo di immagini con anteprima e riordino (sort_order).
11. Toggle is_published.

Valida i dati sia lato client sia lato server.
Alla fine elenca endpoint e file, e come pubblicare un immobile di prova.
```

---

### FASE 5 — Mappa e ricerca dinamica (lato affittuario)

```
FASE 5 — Mappa + ricerca dinamica (tenant). È la funzionalità centrale, curala molto.

Obiettivo: pagina "/app" con mappa Leaflet, marker degli immobili e lista sotto la mappa
che si aggiorna dinamicamente su spostamento/zoom.

Backend:
1. GET /api/properties?north=&south=&east=&west=&minPrice=&maxPrice=&rooms=
   Ritorna SOLO gli immobili is_published che ricadono nel rettangolo (bounding box)
   definito dai 4 confini. Usa PostGIS (ST_MakeEnvelope + ST_Within/ST_Contains) oppure,
   in fallback, un WHERE su lat/lng. Applica i filtri opzionali (prezzo, stanze).
   Limita i risultati (es. max 200) e ritorna i campi utili per card+marker.

Frontend (pagina "/app", area tenant):
2. Mappa Leaflet a schermo intero (o quasi) con react-leaflet e tile OpenStreetMap.
3. Un marker per ogni immobile nell'area; al click sul marker apri un popup con
   anteprima (immagine, prezzo, mq) e link al dettaglio.
4. SOTTO la mappa, una lista di card degli immobili attualmente nell'area visibile.
   Card e marker devono mostrare lo stesso set di risultati.
5. Aggiornamento dinamico: sugli eventi moveend/zoomend di Leaflet, leggi map.getBounds(),
   ricava north/south/east/west e richiama l'endpoint. Aggiorna marker e lista insieme.
   IMPORTANTISSIMO: applica un debounce di ~400ms alle chiamate per non spammare il server;
   mostra uno stato di caricamento non bloccante mentre aggiorna.
6. Barra di ricerca per indirizzo: geocoding con Nominatim -> centra la mappa sulle coordinate.
7. Pulsante "Usa la mia posizione": navigator.geolocation -> centra la mappa; gestisci il
   permesso negato con un messaggio.
8. Hover/click su una card evidenzia il marker corrispondente sulla mappa (e viceversa).
9. Filtri base opzionali (prezzo max, numero stanze) che rientrano nella stessa query.

Gestisci: nessun risultato, errore rete, movimenti rapidi della mappa.
Alla fine spiegami come provare la ricerca dinamica.
```

---

### FASE 6 — Dettaglio immobile

```
FASE 6 — Pagina dettaglio immobile ("/property/:id").

Obiettivo: mostrare tutte le informazioni di un immobile all'affittuario.

1. Recupera l'immobile via GET /api/properties/:id (con immagini e dati del proprietario
   limitati alle info di contatto pubbliche, mai email/telefono privati salvo scelta futura).
2. Galleria immagini (carosello o griglia con lightbox).
3. Blocco informazioni completo: indirizzo/via, città, piano, metri quadri, numero stanze,
   numero bagni, forniture/arredamento (badge), prezzo mensile, deposito, disponibile dal.
4. Mini-mappa Leaflet centrata sull'immobile con il suo marker.
5. Calendario delle disponibilità in SOLA LETTURA per l'affittuario:
   GET /api/properties/:id/availability -> mostra i giorni available/booked/blocked.
   Usa react-day-picker (o FullCalendar) con legenda colori.
6. Due call-to-action:
   - "Contatta il proprietario" -> apre/crea la conversazione (funzionerà in Fase 7).
   - "Richiedi appuntamento" -> seleziona una data disponibile (collegato alla Fase 8).
   Per ora rendi i pulsanti presenti e naviganti, la logica completa arriva nelle fasi dopo.
7. Layout responsive: su mobile le sezioni si impilano in modo leggibile.

Alla fine elenca i file creati e come raggiungere la pagina da un annuncio in "/app".
```

---

### FASE 7 — Messaggistica interna in tempo reale

```
FASE 7 — Messaggistica interna (Socket.io).

Obiettivo: chat 1-a-1 tra affittuario e proprietario, legata a un immobile, in realtime.

Backend:
1. POST /api/conversations — body: { property_id }. Se non esiste già una conversazione
   tra questo tenant e l'owner di quell'immobile, creala; altrimenti restituiscila.
2. GET  /api/conversations — lista conversazioni dell'utente (con ultimo messaggio,
   controparte e conteggio non letti), ordinate per ultimo messaggio.
3. GET  /api/conversations/:id/messages — storico messaggi (verifica che l'utente
   faccia parte della conversazione).
4. Socket.io: autentica la connessione col JWT. Eventi:
   - join:conversation (entra nella "stanza" della conversazione)
   - message:send { conversationId, body } -> salva su DB, emette message:new ai partecipanti
   - message:read { conversationId } -> segna come letti, notifica la controparte
5. Salva sempre i messaggi su DB (i socket servono solo per il realtime).

Frontend:
6. Pagina "/messages" (uguale per entrambi i ruoli): elenco conversazioni a sinistra,
   thread attivo a destra (su mobile: due viste con back).
7. Invio messaggio, ricezione in tempo reale, indicatore letto/non letto, autoscroll,
   badge dei non letti nella navbar.
8. Collega il pulsante "Contatta il proprietario" della Fase 6 a POST /api/conversations
   e apri la chat.

Gestisci riconnessione socket e utente offline (i messaggi restano su DB).
Alla fine spiegami come testare una chat tra due utenti (due browser/finestre).
```

---

### FASE 8 — Appuntamenti

```
FASE 8 — Richieste di appuntamento.

Obiettivo: l'affittuario richiede un appuntamento su una data disponibile; il proprietario
accetta o rifiuta.

Backend:
1. POST  /api/appointments — body: { property_id, requested_datetime, note }.
   Crea con status 'pending' (tenant corrente + owner dell'immobile).
   Verifica che la data sia tra le disponibilità 'available'.
2. GET   /api/appointments/mine — appuntamenti dell'utente (come tenant o come owner).
3. PATCH /api/appointments/:id — l'owner imposta status 'accepted' o 'declined'
   (solo l'owner dell'immobile). Se accettato, marca la disponibilità come 'booked'.

Frontend:
4. Dal dettaglio immobile (Fase 6): "Richiedi appuntamento" apre un selettore di data/ora
   limitato ai giorni 'available', con nota facoltativa, e invia la richiesta.
5. Area owner: sezione "Richieste di appuntamento" con lista e pulsanti Accetta/Rifiuta.
6. Area tenant: elenco delle proprie richieste con stato aggiornato.
7. (Opzionale) notifica il proprietario via messaggio interno quando arriva una richiesta.

Alla fine elenca endpoint e come simulare il flusso completo richiesta -> accettazione.
```

---

### FASE 9 — Rifiniture, validazione e robustezza

```
FASE 9 — Rifiniture finali.

Obiettivo: rendere l'app solida, coerente e pronta.

1. Validazione input uniforme lato server (es. Zod o express-validator) su tutte le rotte,
   con messaggi d'errore chiari e coerenti col formato { error: { code, message } }.
2. Gestione errori centralizzata (error-handling middleware Express) e boundary/errori lato
   React con messaggi utili all'utente.
3. Stati di caricamento (skeleton) e stati vuoti curati in tutte le pagine principali.
4. Passata di responsive su tutte le pagine (mappa, dettaglio, chat, form).
5. Sicurezza: verifica che nessuna risposta esponga password_hash; controlla che ogni
   rotta sensibile abbia authRequired e, dove serve, requireRole; sanifica gli input.
6. Coerenza UI: componenti condivisi (Button, Input, Card, Modal) usati ovunque.
7. Piccoli test essenziali: almeno auth (register/login) e la query immobili per bounds.
8. Aggiorna il README con: setup, variabili .env, comandi, panoramica delle funzionalità.

Alla fine dammi un elenco di eventuali cose ancora fragili o da migliorare in futuro.
```

---

## C. REGISTRO DI AVANZAMENTO (aggiornare a fine di ogni fase)

> Compila queste note man mano. Alla sessione successiva, incolla anche la riga della fase
> completata insieme al contesto: così l'assistente sa da dove ripartire.

- **Fase 1 — Setup:** ⬜ da fare · file creati: … · note: …
- **Fase 2 — Auth:** ⬜ da fare · endpoint: … · note: …
- **Fase 3 — Landing:** ⬜ da fare · note: …
- **Fase 4 — CRUD immobili:** ⬜ da fare · endpoint: … · note: …
- **Fase 5 — Mappa/ricerca:** ⬜ da fare · endpoint: … · note: …
- **Fase 6 — Dettaglio:** ⬜ da fare · note: …
- **Fase 7 — Messaggistica:** ⬜ da fare · eventi socket: … · note: …
- **Fase 8 — Appuntamenti:** ⬜ da fare · endpoint: … · note: …
- **Fase 9 — Rifiniture:** ⬜ da fare · note: …

**Decisioni prese durante lo sviluppo** (da ricordare):
- …

**Cose da rivedere / debiti tecnici:**
- …
```
```
