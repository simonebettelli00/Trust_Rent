import AppError from "../utils/AppError.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TrustRent/1.0 (contatto: dev@trustrent.local)";
const MIN_INTERVAL_MS = 1100;
const DIACRITICS_REGEX = new RegExp(String.fromCharCode(0x5b) + "\\u0300-\\u036f" + String.fromCharCode(0x5d), "g");

// Rimuove il numero civico finale (con eventuali suffissi "/A", "bis", ecc.)
// da un indirizzo italiano generico, per poter cercare la sola via.
const HOUSE_NUMBER_REGEX = /\s+\d+\s*(\/\s*[a-zA-Z])?\s*(bis|ter)?\s*$/i;

let lastRequestAt = 0;
let queue = Promise.resolve();

function throttle() {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
  });
  queue = run.catch(() => {});
  return run;
}

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function stripHouseNumber(address) {
  return address.replace(HOUSE_NUMBER_REGEX, "").trim();
}

function extractComune(addressDetails = {}) {
  return addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.municipality || null;
}

function isSameComune(inputCity, resultComune) {
  return Boolean(resultComune) && normalize(inputCity) === normalize(resultComune);
}

function baseParams() {
  const params = new URLSearchParams();
  params.set("format", "json");
  params.set("limit", "1");
  params.set("addressdetails", "1");
  params.set("countrycodes", "it");
  return params;
}

async function callNominatim(params, label) {
  await throttle();

  const url = `${NOMINATIM_URL}?${params.toString()}`;
  console.log(`[geocoding] ${label} → ${url}`);

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new AppError(502, "GEOCODING_FAILED", "Servizio di geocoding non disponibile");
  }

  const results = await res.json();
  if (!results.length) {
    console.log(`[geocoding] ✗ Nessun risultato — ${label}`);
    return null;
  }

  const result = results[0];
  const comune = extractComune(result.address);
  const location = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
  console.log(
    `[geocoding] risultato ${label} → comune="${comune || "?"}" cap="${result.address?.postcode || "?"}" coordinate=`,
    location
  );
  return { location, comune };
}

/**
 * Ricerca strutturata: vincola la ricerca al comune/CAP passandoli come campi
 * separati (non testo libero), così Nominatim non può scegliere un comune
 * omonimo sbagliato per vie con nomi comuni a più città. `street` è opzionale:
 * se omesso, la ricerca si limita al comune (centro del comune).
 */
async function tryStructured({ street, city, postalCode }, label) {
  const params = baseParams();
  if (street) params.set("street", street);
  params.set("city", city);
  if (postalCode) params.set("postalcode", postalCode);
  params.set("country", "Italia");

  const outcome = await callNominatim(params, label);
  if (!outcome) return null;

  if (!isSameComune(city, outcome.comune)) {
    console.log(
      `[geocoding] ✗ Scartato (${label}): comune atteso "${city}", ottenuto "${outcome.comune}"`
    );
    return null;
  }

  return outcome.location;
}

/**
 * Cascata a 5 livelli, dal più preciso al più generico, con verifica di
 * coerenza del comune ad ogni passo (nessun risultato in un comune diverso
 * da quello inserito viene mai accettato):
 *   1-2. civico + via (con e senza CAP)
 *   3-4. solo via, senza civico (utile quando il civico non è mappato in OSM)
 *   5.   solo comune + CAP (centro del comune, ultima risorsa)
 * Ritorna { lat, lng, precision } dove precision è "civico" | "via" | "comune",
 * oppure null (senza lanciare errore) se nemmeno il centro del comune si trova,
 * così la creazione dell'immobile può proseguire senza coordinate.
 */
export async function geocodeAddress({ address, city, postalCode }) {
  const streetOnly = stripHouseNumber(address);

  const attempts = [
    { street: address, postalCode, label: "1/5 civico+via+CAP", precision: "civico" },
    { street: address, postalCode: null, label: "2/5 civico+via", precision: "civico" },
    { street: streetOnly, postalCode, label: "3/5 solo via+CAP", precision: "via" },
    { street: streetOnly, postalCode: null, label: "4/5 solo via", precision: "via" },
    { street: null, postalCode, label: "5/5 solo comune+CAP", precision: "comune" },
  ].filter((attempt, index) => index < 2 || attempt.street !== address); // evita di ripetere via+civico se streetOnly === address (nessun civico da rimuovere)

  for (const attempt of attempts) {
    const location = await tryStructured(
      { street: attempt.street, city, postalCode: attempt.postalCode },
      attempt.label
    );
    if (location) {
      console.log(`[geocoding] ✓ Precisione ottenuta: "${attempt.precision}" (${attempt.label})`);
      return { ...location, precision: attempt.precision };
    }
  }

  console.warn(
    `[geocoding] Nessun risultato coerente (nemmeno il centro del comune) per address="${address}", city="${city}", postalCode="${postalCode || "-"}"`
  );
  return null;
}

export async function geocodeFreeText(query) {
  const params = baseParams();
  params.set("q", query);

  const outcome = await callNominatim(params, "ricerca libera");
  if (!outcome) {
    throw new AppError(422, "ADDRESS_NOT_FOUND", "Indirizzo non trovato");
  }
  return outcome.location;
}
