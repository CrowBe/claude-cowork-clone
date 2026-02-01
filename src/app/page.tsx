"use client";

import { Chat } from "@/components/Chat";
import { OllamaStatus } from "@/components/OllamaStatus";
import { useOllamaStatus } from "@/hooks/use-ollama-status";

type ConnectionStatus = "checking" | "connected" | "disconnected";

function getStatusIndicatorClass(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "bg-green-500";
    case "checking":
      return "bg-yellow-500 animate-pulse";
    case "disconnected":
      return "bg-red-500";
  }
}

export default function Home(): React.ReactElement {
  const { status } = useOllamaStatus();

  return (
    <div className="flex min-h-screen flex-col">
      <Header status={status} />
      <Main status={status} />
    </div>
  );
}

interface HeaderProps {
  status: ConnectionStatus;
}

function Header({ status }: HeaderProps): React.ReactElement {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Claude Cowork
        </h1>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getStatusIndicatorClass(status)}`} />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Ollama</span>
        </div>
      </div>
    </header>
  );
}

interface MainProps {
  status: ConnectionStatus;
}

function Main({ status }: MainProps): React.ReactElement {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 p-4">
        {status === "disconnected" ? <OllamaStatus /> : <Chat />}
      </div>
    </main>
  );
}
