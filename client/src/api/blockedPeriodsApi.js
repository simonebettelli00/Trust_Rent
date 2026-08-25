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

export async function list(token, propertyId) {
  const res = await fetch(`${API_URL}/api/properties/${propertyId}/blocked-periods`, {
    headers: authHeaders(token),
  });
  return parse(res);
}

export async function create(token, propertyId, { startDate, endDate }) {
  const res = await fetch(`${API_URL}/api/properties/${propertyId}/blocked-periods`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ start_date: startDate, end_date: endDate }),
  });
  return parse(res);
}

export async function remove(token, propertyId, blockedPeriodId) {
  const res = await fetch(
    `${API_URL}/api/properties/${propertyId}/blocked-periods/${blockedPeriodId}`,
    { method: "DELETE", headers: authHeaders(token) }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Errore di rete");
  }
}
