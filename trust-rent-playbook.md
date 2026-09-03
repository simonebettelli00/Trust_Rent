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

```
# Trust Rent — FASI 10→14: Robustezza, sicurezza e debiti tecnici

Questo blocco è la **continuazione del playbook**. Coprono i punti rimasti fragili dopo la Fase 9:

1. **FASE C mai completata** — richieste di visita (affitto lungo) e prenotazione periodo (affitto breve): mancano endpoint, UI e notifiche.
2. **Tabella `availability` ridondante** rispetto al nuovo modello a due tipi di affitto.
3. **Bundle JS > 500KB** — nessun code-splitting.
4. **Test automatici minimi** — solo auth e ricerca bounds.
5. **Nessun rate limiting generale** (solo Nominatim) — login esposto a brute-force.
6. **JWT senza refresh/revoca** — token valido 7 giorni, nessun logout lato server.

## Come usarlo

- All'inizio di ogni sessione incolla **CONTESTO DI PROGETTO (sezione A)** del playbook, POI la FASE 0 di ricognizione, POI il prompt della fase su cui lavori.
- **Procedi UNA FASE ALLA VOLTA.** Le fasi sono già ordinate per dipendenza: fai la 10 prima della C, la sicurezza prima delle rifiniture.
- Aggiorna il registro di avanzamento (in fondo) a fine fase.

> ⚠️ **Nota critica sulla memoria di progetto.** Il playbook originale (FASI 1–9) **non descrive** il modello a due tipi di affitto (long/short) né la "FASE C": sono stati aggiunti dopo. Perciò l'assistente **non deve fidarsi ciecamente dello schema del playbook** su tutto ciò che riguarda disponibilità/affitti: deve prima **leggere il codice reale** (FASE 0) e riconciliare.

---

## FASE 0 — Ricognizione (obbligatoria, nessuna scrittura di codice)

```
FASE 0 — Ricognizione. NON scrivere ancora codice: solo lettura e report.

Il progetto si è evoluto oltre il playbook: ora gli immobili hanno DUE tipi di affitto
(es. "lungo" e "breve/periodo"). Prima di modificare qualsiasi cosa, devo capire lo stato reale.

Analizza il repository e produci un report sintetico su:

1. MODELLO DATI ATTUALE
   - Guarda server/migrations/ e src/models/: elenca le tabelle realmente esistenti e le
     colonne rilevanti. In particolare: come viene distinto il tipo di affitto su `properties`
     (nome del campo, valori possibili)?
   - Com'è usata oggi la tabella `availability`? Da quali query/endpoint è letta o scritta?
   - Esistono già tabelle per prenotazioni/visite (es. `bookings`, `appointments`,
     `visit_requests`, slot lato owner)? Che struttura hanno?

2. GESTIONE SLOT LATO OWNER (che dici essere già presente)
   - Dove e come l'owner definisce la disponibilità oggi? File frontend e endpoint coinvolti.

3. AUTH ATTUALE
   - Come sono firmati/verificati i JWT oggi (scadenza, payload, dove sono salvati lato client)?
   - Com'è strutturato AuthContext e come vengono allegati i token alle chiamate API?

4. TEST E TOOLING
   - Quale runner di test è configurato (Jest/Vitest)? Dove sono i test esistenti?
   - C'è già un client HTTP centralizzato (axios/fetch wrapper) lato client? Dove?
   - Config Vite attuale: c'è già qualche impostazione su chunk/build?

Al termine, elenca in modo chiaro cosa hai trovato e segnala ogni incoerenza col playbook.
NON proporre ancora modifiche: questo è solo il rilievo su cui costruiremo le fasi successive.
```

---

## FASE 10 — Consolidamento modello disponibilità + FASE C (visite e prenotazioni)

```
FASE 10 — Modello disponibilità unificato + FASE C (richieste di visita e prenotazione periodo).

Obiettivo: eliminare la ridondanza della tabella `availability` e completare i due flussi
mancanti, con endpoint, UI e notifiche.

Contesto dei due flussi (adattali a come sono chiamati DAVVERO i tipi di affitto nel codice,
verificato in FASE 0):
- Affitto LUNGO  -> flusso "richiesta di VISITA": il tenant chiede di visitare l'immobile
  in uno slot proposto dall'owner. L'owner accetta/rifiuta.
- Affitto BREVE  -> flusso "prenotazione PERIODO": il tenant richiede un intervallo di date
  (check-in -> check-out). L'owner accetta/rifiuta; se accettato il periodo diventa occupato.

STEP 1 — Piano di migrazione (prima del codice).
Basandoti sul report della FASE 0, proponi un modello dati pulito che sostituisca l'uso
generico di `availability`. Proposta di riferimento (da riconciliare con l'esistente,
NON da imporre se confligge):
   - `visit_slots`     : id, property_id(FK), start_datetime, end_datetime, is_open(bool)
                         -> slot di visita che l'owner rende disponibili (affitto lungo).
   - `visit_requests`  : id, property_id(FK), tenant_id(FK), owner_id(FK), slot_id(FK opz.),
                         requested_datetime, status('pending'|'accepted'|'declined'),
                         note, created_at, updated_at.
   - `blocked_periods` : id, property_id(FK), start_date, end_date  -> periodi che l'owner
                         blocca manualmente (affitto breve).
   - `bookings`        : id, property_id(FK), tenant_id(FK), owner_id(FK),
                         start_date, end_date, status('pending'|'accepted'|'declined'|'cancelled'),
                         note, created_at, updated_at.
Regole:
   - Se la tabella `appointments` già esistente copre bene le visite, RIUSALA invece di creare
     `visit_requests`, ma segnala esplicitamente la scelta.
   - La disponibilità NON va più duplicata riga-per-giorno: per l'affitto breve una data è
     libera se NON cade dentro un `bookings` accettato/pending o un `blocked_periods`.
   - Prevedi una migrazione che: crea le nuove tabelle, migra eventuali dati utili da
     `availability`, e depreca/rimuove `availability` (o la lascia inutilizzata spiegando perché).
   - Aggiungi indici su (property_id), (property_id, start_date/end_date) e sugli status.
Mostrami il piano e la lista di file/migrazioni PRIMA di scrivere.

STEP 2 — Backend (rotte protette + role corretto; formato errore uniforme come da contesto).
Affitto lungo (visite):
   - GET   /api/properties/:id/visit-slots        -> slot disponibili (pubblica/lettura).
   - POST  /api/properties/:id/visit-slots        -> owner crea slot (requireRole owner + proprietà).
   - DELETE/api/visit-slots/:id                   -> owner rimuove slot.
   - POST  /api/visit-requests                    -> tenant crea richiesta { property_id, slot_id|requested_datetime, note }, status 'pending'. Verifica che lo slot sia aperto.
   - GET   /api/visit-requests/mine               -> richieste dell'utente (come tenant o owner).
   - PATCH /api/visit-requests/:id                -> owner imposta 'accepted'|'declined' (solo owner dell'immobile). Se accettata, chiudi lo slot.
Affitto breve (prenotazioni):
   - GET   /api/properties/:id/availability       -> ricalcolata dal nuovo modello (bookings+blocked), niente più tabella per-giorno.
   - POST  /api/bookings                          -> tenant richiede { property_id, start_date, end_date, note }. Rifiuta se il periodo si sovrappone a booking accettato/pending o blocco. status 'pending'.
   - GET   /api/bookings/mine                     -> prenotazioni dell'utente (tenant/owner).
   - PATCH /api/bookings/:id                      -> owner 'accepted'|'declined'; su accept marca il periodo come occupato (di fatto via query di overlap, non tabella per-giorno).
   - POST  /api/properties/:id/blocked-periods    -> owner blocca un intervallo.
Validazione date coerente (start < end, no date passate) lato server e client.

STEP 3 — Notifiche (il punto mancante della FASE C).
   - Quando arriva una nuova richiesta (visita o prenotazione): notifica l'OWNER.
   - Quando l'owner accetta/rifiuta: notifica il TENANT.
   - Implementazione: riusa l'infrastruttura Socket.io della Fase 7 per il realtime E
     persisti la notifica. Proponi tu la forma minima: o un messaggio di sistema nella
     conversazione esistente, o una tabella `notifications`
     (id, user_id, type, payload JSON, is_read, created_at) con:
       - GET   /api/notifications           -> lista dell'utente
       - PATCH /api/notifications/:id/read   -> segna letta
     e un badge nella navbar. Scegli una sola strada e sii coerente.

STEP 4 — Frontend.
   - Dettaglio immobile (Fase 6): il pulsante corretto in base al tipo di affitto.
     * Lungo: "Richiedi visita" -> selettore degli slot aperti + nota -> POST visit-requests.
     * Breve: "Prenota periodo" -> selezione intervallo su react-day-picker con i giorni
       occupati/bloccati disabilitati -> POST bookings.
   - Area OWNER: sezione "Richieste" con due liste (visite e prenotazioni), stato e pulsanti
     Accetta/Rifiuta; gestione degli slot di visita e dei periodi bloccati.
   - Area TENANT: elenco delle proprie richieste (visite + prenotazioni) con stato aggiornato in realtime.
   - Badge notifiche non lette nella navbar.

Gestisci: sovrapposizioni, slot già preso, permessi, stati vuoti, errori rete.
Alla fine elenca migrazioni/endpoint/file creati e come simulare i due flussi completi
(richiesta -> notifica owner -> accettazione -> notifica tenant), sia per il lungo sia per il breve.
```

---

## FASE 11 — Rate limiting delle API

```
FASE 11 — Rate limiting.

Obiettivo: proteggere le API (soprattutto login/registrazione) da brute-force e abuso,
senza rompere l'uso normale.

Backend:
1. Aggiungi `express-rate-limit` (e valuta `rate-limit-redis` solo se già usate Redis;
   altrimenti store in memoria va bene per ora, segnalando il limite in multi-istanza).
2. Limiter GLOBALE moderato su /api (es. 300 richieste / 15 min per IP) montato presto
   nella catena middleware.
3. Limiter STRETTO sulle rotte sensibili:
   - POST /api/auth/login    : es. 5-10 tentativi / 15 min per IP (e valuta anche per email).
   - POST /api/auth/register : es. 5 / ora per IP.
   - POST /api/auth/refresh  : limite dedicato (se la FASE 12 è già fatta).
4. Escludi o allarga il limite su rotte legittimamente frequenti (es. la ricerca immobili
   per bounds della Fase 5, che parte a ogni moveend): usa una chiave/limite più permissivo
   o esentala, così il debounce lato client + limite server restano coerenti.
5. Risposta 429 nel formato errore uniforme { error: { code: "RATE_LIMITED", message } }
   con header standard (RateLimit-*). Messaggio utente in italiano.
6. Assicurati che `app.set('trust proxy', ...)` sia configurato correttamente se sei dietro
   proxy/reverse proxy, altrimenti il rate limit per IP non funziona.

Frontend:
7. Gestisci il 429 con un messaggio chiaro ("Troppi tentativi, riprova tra qualche minuto")
   nelle pagine Login/Register.

Alla fine elenca i file/limiter aggiunti e come verificare il blocco (es. curl in loop su /login).
```

---

## FASE 12 — Auth robusta: refresh token + logout lato server

```
FASE 12 — Refresh token e revoca.

Obiettivo: ridurre la finestra di rischio di un token rubato e rendere possibile un vero
logout lato server, mantenendo la UX fluida.

Backend:
1. Passa a due token:
   - ACCESS token JWT a vita breve (es. 15 min), usato nell'header Authorization.
   - REFRESH token a vita più lunga (es. 7-30 gg), TRACCIATO su DB per poterlo revocare.
2. Tabella `refresh_tokens`: id, user_id(FK), token_hash (mai in chiaro), jti/family,
   expires_at, revoked_at, user_agent, created_at. Salva solo l'HASH del refresh token.
3. Endpoint:
   - POST /api/auth/login    -> ritorna access token + imposta il refresh token
     (preferibile cookie httpOnly + SameSite; in alternativa in body, spiegando il trade-off).
   - POST /api/auth/refresh  -> valida il refresh token contro il DB, applica ROTATION
     (revoca il vecchio, emette uno nuovo), ritorna un nuovo access token. Se il token è
     già revocato/riusato -> revoca l'intera "family" (difesa da replay) e rispondi 401.
   - POST /api/auth/logout   -> revoca il refresh token corrente (logout singolo).
   - POST /api/auth/logout-all (opz.) -> revoca tutti i refresh token dell'utente.
4. Aggiorna il middleware authRequired: su access token scaduto rispondi 401 con un codice
   distinto (es. TOKEN_EXPIRED) così il client sa che deve tentare il refresh.
5. Formato errore uniforme; nessuna risposta espone hash o segreti.

Frontend:
6. Aggiorna AuthContext + il client HTTP centralizzato:
   - Interceptor sulle risposte 401/TOKEN_EXPIRED che tenta UNA volta /api/auth/refresh e
     ripete la richiesta originale; se il refresh fallisce -> logout e redirect a /login.
   - Gestione della race di refresh concorrenti (una sola chiamata di refresh in volo,
     le altre in coda).
   - `logout()` chiama /api/auth/logout e pulisce lo stato locale.
   - All'avvio, prova a ottenere un access token via refresh invece di assumere il vecchio token.
7. Aggiorna anche l'autenticazione della connessione Socket.io (Fase 7) per usare l'access
   token e riautenticarsi dopo un refresh.

Compatibilità: prevedi una migrazione morbida (gli utenti già loggati potranno ri-loggarsi).
Alla fine elenca endpoint/tabelle/file e come testare: login -> uso -> scadenza access ->
refresh automatico -> logout -> il refresh revocato non funziona più.
```

---

## FASE 13 — Performance: code-splitting del bundle

```
FASE 13 — Code-splitting (bundle < 500KB per chunk).

Obiettivo: ridurre il bundle iniziale spezzando le dipendenze pesanti, senza cambiare le funzionalità.

1. Route-level splitting: converti le pagine pesanti in import dinamici con React.lazy +
   <Suspense> con un fallback (skeleton/spinner). Priorità: la pagina mappa "/app"
   (Leaflet/react-leaflet), il dettaglio immobile (react-day-picker), "/messages" (socket.io).
2. Libreria mappe: assicurati che Leaflet/react-leaflet finiscano in un chunk separato,
   caricato solo quando si entra in "/app". Se serve, usa import() dinamico anche a livello
   di componente.
3. Config Vite: imposta build.rollupOptions.output.manualChunks per separare i vendor grossi
   (es. leaflet, react-day-picker, socket.io-client) dal core dell'app.
4. Alza/regola build.chunkSizeWarningLimit solo DOPO aver realmente ridotto i chunk, non per
   nascondere il warning.
5. Verifica: esegui la build e riporta la dimensione dei chunk PRIMA e DOPO. Aggiungi
   (se non c'è) uno strumento di analisi tipo rollup-plugin-visualizer per documentare il risultato.
6. Controlla che lo splitting non peggiori la UX: prefetch dove sensato, fallback non "salterini".

Alla fine mostrami il confronto dimensioni chunk prima/dopo e quali route sono ora lazy.
```

---

## FASE 14 — Copertura di test automatici

```
FASE 14 — Test automatici (oltre auth e bounds).

Obiettivo: coprire i flussi critici finora senza test, mantenendo i test veloci e isolati.

Usa il runner già configurato (verificato in FASE 0) + supertest per gli endpoint.
Isola il DB di test (database dedicato o transazioni con rollback per test); NON toccare dati reali.

Backend — aggiungi test per:
1. Properties CRUD: creazione (solo owner), modifica/eliminazione solo del proprietario
   (403 per altri), GET dettaglio pubblico, GET /mine filtrato per owner.
2. Ricerca per bounds (già presente): estendi con i filtri prezzo/stanze e il limite risultati.
3. Conversations & messages (Fase 7): creazione conversazione idempotente, accesso negato a
   chi non fa parte della conversazione, storico messaggi.
4. Upload immagini (Fase 4): mock del filesystem/Multer, verifica associazione a property_images
   e rifiuto di file non-immagine / oversize.
5. Geocoding (Nominatim): MOCK della chiamata di rete (nessuna richiesta reale nei test);
   verifica salvataggio lat/lng e gestione "indirizzo non trovato".
6. Visite/prenotazioni (FASE 10): richiesta -> accettazione/rifiuto, rifiuto su sovrapposizione periodi.
7. Sicurezza trasversale: nessuna risposta espone password_hash o token; rotte protette senza
   JWT rispondono 401; rotte per ruolo rispondono 403 al ruolo sbagliato.

Tooling:
8. Aggiungi uno script npm `test` (e `test:watch`), factory/helper per creare utenti e immobili
   di prova, e reset del DB tra i test.
9. (Opzionale) un workflow CI minimo (GitHub Actions) che gira lint + test su push.

Alla fine riporta cosa è coperto, come lanciare i test e la percentuale/aree ancora scoperte.
```

---

## C. REGISTRO DI AVANZAMENTO (aggiornare a fine di ogni fase)

> Compila queste note man mano. Alla sessione successiva, incolla anche la riga della fase
> completata insieme al contesto: così l'assistente sa da dove ripartire.

- **Fase 0 — Ricognizione:** ✅ · report modello/auth/test: `rental_type` ('long'|'short') su `properties`; `appointments` già esistente e riusata (non creata `visit_requests`); `availability` presente ma 0 righe, mai realmente usata; JWT singolo 7gg in `localStorage`, nessun refresh/logout server-side; Vitest+Supertest già configurato (`auth.test.js`, `properties.test.js`); client HTTP centralizzato in `client/src/api/client.js`; `vite.config.js` senza `manualChunks`. · incoerenze col playbook: la FASE 8 "Appuntamenti" originale non è mai stata completata nella forma prevista — superata dal modello a due tipi di affitto (vedi Fase 8 sotto).
- **Fase 1 — Setup:** ✅ · file creati: scaffold client (Vite+React+TailwindCSS) e server (Express+PostgreSQL/PostGIS) secondo la struttura di CONTESTO DI PROGETTO. · note: Tailwind v4 installato di default da Vite, sostituito con v3 per allinearsi al `tailwind.config.js` a file (non CSS-only).
- **Fase 2 — Auth:** ✅ · endpoint: `POST /api/auth/register`, `/login`, `GET /me` (estesi in Fase 12 con `/refresh`, `/logout`, `/logout-all`). · note: JWT+bcrypt, ruoli `tenant`/`owner`.
- **Fase 3 — Landing:** ✅ · note: styling landing page e pagine login/registrazione.
- **Fase 4 — CRUD immobili:** ✅ · endpoint: `POST/PUT/PATCH/DELETE /api/properties`, upload immagini (Multer) e riordino. · note: —
- **Fase 5 — Mappa/ricerca:** ✅ · endpoint: `GET /api/properties` (ricerca per bounds, PostGIS `ST_Contains`/`ST_MakeEnvelope`). · note: bug reale Express 5 — `req.query` è getter-only, risolto mutando con `Object.assign` in `validate.js` invece di riassegnare.
- **Fase 6 — Dettaglio:** ✅ · note: galleria immagini, mini-mappa, calendario disponibilità — quest'ultimo poi sostituito in Fase 10 dai form di richiesta visita/prenotazione.
- **Fase 7 — Messaggistica:** ✅ · eventi socket: stanze `conversation:<id>`, invio/ricezione messaggi realtime. · note: nei test live con Playwright, un browser context condiviso tra due utenti causava sovrascrittura del token in `localStorage` — servono context separati per utente.
- **Fase 8 — Appuntamenti:** ⚠️ **Superata, mai completata nella forma originale.** Il concetto generico di "appuntamento" è stato rimpiazzato dal modello a due tipi di affitto (Fase A/B) e portato a termine in Fase 10 con due flussi separati: richiesta di visita (`appointments`, affitto `long`) e prenotazione periodo (`bookings`, affitto `short`).
- **Fase A/B — Modello long/short (ad-hoc, non nel playbook originale):** ✅ · note: campo `rental_type` ('long'|'short') su `properties`; `owner_slots`/`appointments` per il lungo, `bookings`/`blocked_periods` per il breve.
- **Geocoding robustness (ad-hoc, non nel playbook originale):** ✅ · note: cascata Nominatim a 5 livelli (civico+via+CAP → solo via → solo comune) con verifica di coerenza del comune ad ogni passo, per non accettare mai un risultato nel comune sbagliato.
- **Fase 9 — Rifiniture:** ✅ · note: validazione Zod centralizzata (`validate.js`), `errorHandler` uniforme (incl. Multer e JSON malformato), skeleton, componente `Modal`, prima suite Vitest+Supertest, README riscritto, audit di sicurezza.
- **Fase 10 — Disponibilità + FASE C:** ✅ · migrazioni: `005_visits_and_bookings.sql` (`owner_slots.is_open`, tabella `blocked_periods`, `DROP TABLE availability`). · endpoint: `POST/PATCH /api/appointments`, `POST/PATCH /api/bookings`, `GET .../mine`, `GET /api/notifications`. · scelta notifiche: Socket.io con stanze per-utente (`user:<id>`) + tabella `notifications` persistita, non solo push effimero. · sorte di `availability`: **rimossa** (non deprecata) — 0 righe, mai realmente popolata, sostituita da calcolo dinamico su `bookings`+`blocked_periods` (breve) e `owner_slots`+`appointments` (lungo).
- **Fase 11 — Rate limiting:** ✅ · limiter/limiti: globale 300/15min su `/api`, login 8/15min (conta solo i falliti), registrazione 5/ora, refresh 20/15min, ricerca immobili 600/15min (soglia alta per non rompere il debounce mappa). · note trust proxy: `app.set('trust proxy', 1)` — da rivedere in base al reverse proxy reale in produzione.
- **Fase 12 — Refresh token:** ✅ · endpoint: `POST /api/auth/refresh`, `/logout`, `/logout-all`. · storage refresh: cookie **httpOnly** + `SameSite=Lax` (non in body) — access token solo in memoria React, mai in `localStorage`. · note rotation: rotation ad ogni refresh; il riuso di un token già ruotato revoca l'intera `family` (difesa da replay).
- **Fase 13 — Code-splitting:** ✅ · route lazy: `TenantApp`, `PropertyDetail`, `Messages`, `OwnerDashboard`, `PropertyForm`, `OwnerRequests`, `TenantRequests` (`React.lazy`+`Suspense`). · dimensioni chunk prima/dopo: chunk principale da 569.55KB a 19.45KB; vendor separati (`vendor-react` 221KB, `vendor-leaflet` 156KB, `vendor-daypicker` 74KB, `vendor-socket` 41KB).
- **Fase 14 — Test:** ✅ · aree coperte: auth (incl. refresh/rotation/riuso), properties CRUD, conversations, upload immagini, geocoding (Nominatim mockato), appointments/bookings (overlap, auto-decline), sicurezza trasversale — 53 test su 8 file, DB di test dedicato (`trust_rent_test`). · CI: `.github/workflows/ci.yml` (Postgres+PostGIS come servizio) — **non ancora verificato su un push reale**. · aree scoperte: eventi Socket.io realtime (invio messaggi, notifiche push) e retry automatico del client HTTP su token scaduto, verificati finora solo manualmente/Playwright.

**Decisioni chiave fissate durante la Fase 10:**
- Il campo del tipo di affitto su `properties` si chiama **`rental_type`**, valori `'long'` | `'short'` (enum Zod).
- `appointments` è la tabella **riusata** per le visite — non è stata creata una `visit_requests` separata.
- `availability` è stata **rimossa del tutto** (non solo deprecata): 0 righe, mai popolata, sostituita da calcolo dinamico.

**Decisioni prese durante lo sviluppo** (da ricordare):
- Rate limiting disattivato sotto `NODE_ENV=test` (Fase 14) per non interferire con la creazione rapida di utenti nei test — i limiter restano identici a produzione.
- Nessuna transazione con rollback per singolo test: i model usano `pool.query` direttamente (non un client condiviso iniettabile); isolamento garantito da un DB di test dedicato + `TRUNCATE` globale a fine suite.
- `npm audit`: mai applicare un fix forzato/downgrade senza verificarne l'impatto (incidente `react-router-dom`: un downgrade per risolvere 1 CVE ne ha introdotte 14, poi revertito).

**Cose da rivedere / debiti tecnici:**
- Eventi Socket.io realtime e retry client su token scaduto non coperti da test automatici.
- Workflow CI (`.github/workflows/ci.yml`) scritto ma non ancora verificato su un push reale.
- Nessun linter configurato lato server (solo `oxlint` sul client).
