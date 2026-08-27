const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let onTokenRefreshed = null;
let onAuthFailure = null;
let refreshPromise = null;

// Registrato da AuthContext per essere avvisato quando il client HTTP ottiene
// in autonomia un nuovo access token (refresh silenzioso) o quando il refresh
// fallisce (sessione da terminare).
export function configureAuth({ onTokenRefreshed: onRefreshed, onAuthFailure: onFailure }) {
  onTokenRefreshed = onRefreshed;
  onAuthFailure = onFailure;
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Sessione scaduta");
  }
  onTokenRefreshed?.(data.token);
  return data.token;
}

export async function apiFetch(
  path,
  { method = "GET", body, token, skipAuthRetry = false, _isRetry = false } = {}
) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && data?.error?.code === "TOKEN_EXPIRED" && !skipAuthRetry && !_isRetry) {
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        return apiFetch(path, { method, body, token: newToken, _isRetry: true });
      } catch {
        onAuthFailure?.();
      }
    }

    const message = data?.error?.message || "Errore di rete";
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
}
