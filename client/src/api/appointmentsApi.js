const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Errore di rete");
  }
  return data;
}

export async function create(token, { propertyId, slotId, note }) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ property_id: propertyId, slot_id: slotId, note }),
  });
  return parse(res);
}

export async function listMine(token) {
  const res = await fetch(`${API_URL}/api/appointments/mine`, { headers: authHeaders(token) });
  return parse(res);
}

export async function respond(token, id, status) {
  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ status }),
  });
  return parse(res);
}
