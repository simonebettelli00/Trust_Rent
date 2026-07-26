# Trust Rent

Piattaforma web che mette in contatto affittuari (tenant) e proprietari (owner),
con ricerca degli immobili su mappa interattiva.

## Stack

- **Frontend**: React 18 + Vite, React Router, TailwindCSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + PostGIS
- **Auth**: JWT + bcrypt
- **Realtime**: Socket.io

## Struttura

```
trust-rent/
├─ client/   (React + Vite)
├─ server/   (Express)
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

Copia il file `.env.example` in `server/.env` e imposta i valori:

```bash
cp server/.env.example server/.env
```

Variabili richieste:

- `DATABASE_URL` — stringa di connessione PostgreSQL
- `JWT_SECRET` — secret per la firma dei JWT
- `PORT` — porta del server Express (default 4000)
- `CLIENT_URL` — URL del client, usato per CORS (default http://localhost:5173)

## Migrazioni database

Assicurati che il database indicato in `DATABASE_URL` esista, poi esegui:

```bash
npm run migrate
```

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

## Verifica

Con il server avviato, verifica l'endpoint di health check:

```bash
curl http://localhost:4000/api/health
```

Risposta attesa:

```json
{ "status": "ok" }
```
