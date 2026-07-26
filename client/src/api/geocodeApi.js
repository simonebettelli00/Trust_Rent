const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function geocode(query) {
  const res = await fetch(`${API_URL}/api/geocode?q=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Errore di rete");
  }
  return data.location;
}
