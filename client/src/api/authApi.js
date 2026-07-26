import { apiFetch } from "./client";

export function register({ email, password, fullName, phone, role }) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: { email, password, full_name: fullName, phone, role },
  });
}

export function login({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function me(token) {
  return apiFetch("/api/auth/me", { token });
}
