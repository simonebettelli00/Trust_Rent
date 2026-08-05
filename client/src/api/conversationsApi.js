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

export async function create(token, propertyId) {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ property_id: propertyId }),
  });
  return parse(res);
}

export async function list(token) {
  const res = await fetch(`${API_URL}/api/conversations`, { headers: authHeaders(token) });
  return parse(res);
}

export async function getMessages(token, conversationId) {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
    headers: authHeaders(token),
  });
  return parse(res);
}
