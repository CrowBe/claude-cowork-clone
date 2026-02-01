"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { Send, Loader2 } from "lucide-react";

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

export function Chat(): React.ReactElement {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(
    function scrollToBottom() {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [messages]
  );

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Welcome to Claude Cowork
          </h2>
          <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
            Start a conversation with your local AI assistant. Your messages
            are processed locally via Ollama.
          </p>
        </div>
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              text={getMessageText(message)}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && <ErrorDisplay message={error.message} />}

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

interface MessageBubbleProps {
  role: string;
  text: string;
}

function MessageBubble({ role, text }: MessageBubbleProps): React.ReactElement {
  const isUser = role === "user";
  const bubbleClass = isUser
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${bubbleClass}`}>
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function LoadingIndicator(): React.ReactElement {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Thinking...</span>
      </div>
    </div>
  );
}

interface ErrorDisplayProps {
  message?: string;
}

function ErrorDisplay({ message }: ErrorDisplayProps): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-2">
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {message || "An error occurred. Is Ollama running?"}
      </div>
    </div>
  );
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps): React.ReactElement {
  return (
    <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
      <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-zinc-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
