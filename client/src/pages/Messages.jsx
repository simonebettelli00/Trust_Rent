import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useConversations } from "../context/ConversationsContext";
import * as conversationsApi from "../api/conversationsApi";
import ConversationListItem from "../components/ConversationListItem";
import MessageBubble from "../components/MessageBubble";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";

function Messages() {
  const { user, token } = useAuth();
  const { socket, connected } = useSocket();
  const { conversations, loading: loadingConversations, refresh, markConversationReadLocally } =
    useConversations();
  const [searchParams] = useSearchParams();

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const autoSelectedRef = useRef(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoSelectedRef.current) return;
    const paramId = Number(searchParams.get("conversation"));
    if (paramId && conversations.some((c) => c.id === paramId)) {
      autoSelectedRef.current = true;
      selectConversation(paramId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message) {
      if (message.conversation_id !== activeId) return;
      setMessages((prev) => [...prev, message]);
      if (message.sender_id !== user?.id) {
        socket.emit("message:read", { conversationId: activeId });
      }
    }

    function handleRead({ conversationId, messageIds }) {
      if (conversationId !== activeId) return;
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m.id) ? { ...m, is_read: true } : m))
      );
    }

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleRead);
    };
  }, [socket, activeId, user?.id]);

  useEffect(() => {
    if (connected && activeId && socket) {
      socket.emit("join:conversation", activeId);
    }
  }, [connected, activeId, socket]);

  async function selectConversation(id) {
    setActiveId(id);
    setError("");
    setLoadingMessages(true);
    try {
      const { messages } = await conversationsApi.getMessages(token, id);
      setMessages(messages);
      socket?.emit("join:conversation", id);
      socket?.emit("message:read", { conversationId: id });
      markConversationReadLocally(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !socket || !activeId) return;
    socket.emit("message:send", { conversationId: activeId, body: draft.trim() });
    setDraft("");
  }

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        className={`${
          activeId ? "hidden md:flex" : "flex"
        } md:w-80 w-full border-r border-gray-200 flex-col overflow-y-auto`}
      >
        <h1 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">
          Messaggi
        </h1>
        {loadingConversations ? (
          <div className="flex flex-col gap-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2 px-2 py-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Nessuna conversazione ancora.</p>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeId}
              onClick={() => selectConversation(conversation.id)}
            />
          ))
        )}
      </div>

      <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Seleziona una conversazione
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <button
                type="button"
                className="md:hidden text-gray-500"
                onClick={() => setActiveId(null)}
              >
                ← Indietro
              </button>
              <div>
                <p className="font-medium text-gray-900">
                  {activeConversation?.counterpart_name}
                </p>
                <p className="text-xs text-gray-500">{activeConversation?.property_title}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {loadingMessages ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-2/3 rounded-2xl self-start" />
                  <Skeleton className="h-10 w-1/2 rounded-2xl self-end" />
                  <Skeleton className="h-10 w-3/5 rounded-2xl self-start" />
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user.id}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-4 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="submit" variant="primary" disabled={!draft.trim()}>
                Invia
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
