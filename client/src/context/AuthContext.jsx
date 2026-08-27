import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";
import { configureAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    setUser(null);
    setToken(null);
  }

  // Il client HTTP centralizzato deve poter aggiornare l'access token in
  // memoria dopo un refresh silenzioso, o segnalare che la sessione è finita.
  useEffect(() => {
    configureAuth({
      onTokenRefreshed: setToken,
      onAuthFailure: clearSession,
    });
  }, []);

  // All'avvio non si assume più un vecchio token: si tenta un refresh
  // silenzioso basato sul cookie httpOnly, così l'access token non deve mai
  // essere persistito lato client.
  useEffect(() => {
    authApi
      .refresh()
      .then(({ user, token }) => {
        setUser(user);
        setToken(token);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  function persistSession({ user, token }) {
    setUser(user);
    setToken(token);
  }

  async function login(credentials) {
    const data = await authApi.login(credentials);
    persistSession(data);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    persistSession(data);
    return data.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve essere usato dentro un AuthProvider");
  }
  return ctx;
}
