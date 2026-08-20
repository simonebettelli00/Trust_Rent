import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import * as conversationsApi from "../api/conversationsApi";

const ConversationsContext = createContext(null);

export function ConversationsProvider({ children }) {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setConversations([]);
      setLoading(false);
      return;
    }
    try {
      const { conversations } = await conversationsApi.list(token);
      setConversations(conversations);
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

    function handleNewMessage(message) {
      setConversations((prev) =>
        prev
          .map((conv) =>
            conv.id === message.conversation_id
              ? {
                  ...conv,
                  last_message_body: message.body,
                  last_message_at: message.created_at,
                  last_message_sender_id: message.sender_id,
                  unread_count:
                    message.sender_id === user?.id ? conv.unread_count : conv.unread_count + 1,
                }
              : conv
          )
          .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
      );
    }

    function handleRead({ conversationId, readBy }) {
      if (readBy !== user?.id) return;
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
      );
    }

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleRead);
    };
  }, [socket, user?.id]);

  function markConversationReadLocally(conversationId) {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
    );
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  return (
    <ConversationsContext.Provider
      value={{ conversations, totalUnread, loading, refresh, markConversationReadLocally }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error("useConversations deve essere usato dentro un ConversationsProvider");
  }
  return ctx;
}
