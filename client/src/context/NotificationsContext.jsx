import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import * as notificationsApi from "../api/notificationsApi";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const { notifications } = await notificationsApi.list(token);
      setNotifications(notifications);
    } catch {
      // ignora: la lista verrà ritentata al prossimo refresh
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;

    function handleNew(notification) {
      setNotifications((prev) => [notification, ...prev]);
    }

    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [socket]);

  async function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await notificationsApi.markRead(token, id);
    } catch {
      refresh();
    }
  }

  const totalUnread = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, totalUnread, loading, refresh, markRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications deve essere usato dentro un NotificationsProvider");
  }
  return ctx;
}
