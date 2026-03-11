import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import socketService from "../services/socketService.js";

const formatTime = (iso) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const MessageBubble = ({ msg, isOwn }) => (
  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-2`}>
    <div className="flex items-baseline gap-1.5 mb-0.5">
      <span className={`text-xs font-semibold ${isOwn ? "text-indigo-600" : "text-gray-700"}`}>
        {msg.username}
      </span>
      <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
    </div>
    <div
      className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm leading-snug ${
        isOwn
          ? "bg-indigo-600 text-white rounded-tr-sm"
          : "bg-gray-100 text-gray-900 rounded-tl-sm"
      }`}
    >
      {msg.message}
    </div>
  </div>
);

const LiveChat = ({ streamKey, initialMessages = [] }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted]   = useState(false);
  const [chatError, setChatError] = useState("");   // inline error shown above input
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const errorTimer = useRef(null);

  // Show a temporary error banner above the input, auto-dismiss after 4 s
  const showError = (msg) => {
    setChatError(msg);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setChatError(""), 4000);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for incoming chat messages via socket
  useEffect(() => {
    if (!streamKey) return;
    const socket = socketService.socket;
    if (!socket) return;

    // Populate history when joining (sent by server as one batch)
    const onHistory = (history) => {
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history.slice(-200));
      }
    };

    const onMessage = (msg) => {
      setMessages((prev) => [...prev.slice(-200), msg]);
    };

    // Server-side guards (rate limit / mute / banned word)
    const onError = ({ code, message }) => {
      if (code === "MUTED") setIsMuted(true);
      showError(message);
    };

    // Streamer muted this user
    const onMuted = ({ userId }) => {
      if (user?._id && String(userId) === String(user._id)) {
        setIsMuted(true);
        showError("The streamer has muted you.");
      }
    };

    // Streamer un-muted this user
    const onUnmuted = ({ userId }) => {
      if (user?._id && String(userId) === String(user._id)) {
        setIsMuted(false);
        setChatError("");
      }
    };

    socket.on("chat-history", onHistory);
    socket.on("chat-message", onMessage);
    socket.on("chat-error",   onError);
    socket.on("user-muted",   onMuted);
    socket.on("user-unmuted", onUnmuted);

    return () => {
      socket.off("chat-history", onHistory);
      socket.off("chat-message", onMessage);
      socket.off("chat-error",   onError);
      socket.off("user-muted",   onMuted);
      socket.off("user-unmuted", onUnmuted);
      clearTimeout(errorTimer.current);
    };
  }, [streamKey, user?._id]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !streamKey || isMuted) return;

    const socket = socketService.socket;
    if (!socket?.connected) return;

    socket.emit("chat-message", {
      streamKey,
      message: trimmed,
      userId: user?._id || null,
      username: user?.fullName || user?.userName || "Viewer",
    });
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        <span className="font-semibold text-sm text-gray-900">Live Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg._id || i}
              msg={msg}
              isOwn={msg.userId && String(msg.userId) === String(user?._id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        {/* Error banner (rate limit / banned word / mute notice) */}
        {chatError && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {chatError}
          </div>
        )}

        {!user ? (
          <p className="text-xs text-center text-gray-400 py-2">
            Sign in to participate in chat
          </p>
        ) : isMuted ? (
          <p className="text-xs text-center text-gray-400 py-2">
            You have been muted by the streamer.
          </p>
        ) : (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
