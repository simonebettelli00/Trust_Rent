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

export async function list(token) {
  const res = await fetch(`${API_URL}/api/notifications`, { headers: authHeaders(token) });
  return parse(res);
}

export async function markRead(token, id) {
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  return parse(res);
}
