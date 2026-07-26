import AppError from "../utils/AppError.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TrustRent/1.0 (contatto: dev@trustrent.local)";
const MIN_INTERVAL_MS = 1100;

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

async function search(query) {
  await throttle();

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new AppError(502, "GEOCODING_FAILED", "Servizio di geocoding non disponibile");
  }

  const results = await res.json();
  if (!results.length) {
    throw new AppError(422, "ADDRESS_NOT_FOUND", "Indirizzo non trovato");
  }

  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

export function geocodeAddress(address, city) {
  return search(`${address}, ${city}`);
}

export function geocodeFreeText(query) {
  return search(query);
}
