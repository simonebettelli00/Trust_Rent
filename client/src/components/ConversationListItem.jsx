function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}

function ConversationListItem({ conversation, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
        active ? "bg-primary-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 truncate">{conversation.counterpart_name}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {formatTime(conversation.last_message_at)}
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate">{conversation.property_title}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-sm text-gray-600 truncate">
          {conversation.last_message_body || "Nessun messaggio"}
        </p>
        {conversation.unread_count > 0 && (
          <span className="bg-primary-700 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

export default ConversationListItem;
