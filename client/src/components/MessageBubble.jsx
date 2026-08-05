function MessageBubble({ message, isOwn }) {
  const time = new Date(message.created_at).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isOwn ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="whitespace-pre-line break-words">{message.body}</p>
        <div
          className={`text-[10px] mt-1 flex items-center gap-1 ${
            isOwn ? "text-primary-100" : "text-gray-400"
          }`}
        >
          {time}
          {isOwn && <span>{message.is_read ? "· Letto" : "· Inviato"}</span>}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
