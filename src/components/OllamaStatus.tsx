"use client";

import { useOllamaStatus } from "@/hooks/use-ollama-status";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface RecommendedModel {
  name: string;
  size: string;
  ram: string;
  description: string;
}

const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: "llama3.2",
    size: "3B",
    ram: "~4GB",
    description: "Fast, good for most tasks. Great for 8GB+ RAM systems.",
  },
  {
    name: "llama3.2:1b",
    size: "1B",
    ram: "~2GB",
    description: "Lightweight option for older or resource-limited systems.",
  },
  {
    name: "mistral",
    size: "7B",
    ram: "~6GB",
    description: "Strong reasoning. Needs 16GB+ RAM for best performance.",
  },
  {
    name: "codellama",
    size: "7B",
    ram: "~6GB",
    description: "Optimized for code generation and explanation.",
  },
  {
    name: "phi3",
    size: "3.8B",
    ram: "~4GB",
    description: "Microsoft's efficient model. Good balance of speed/quality.",
  },
];

export function OllamaStatus(): React.ReactElement {
  const { status, models, message } = useOllamaStatus();

  if (status === "checking") {
    return <CheckingStatus />;
  }

  if (status === "disconnected") {
    return <DisconnectedStatus message={message} />;
  }

  return <ConnectedStatus modelCount={models.length} />;
}

function CheckingStatus(): React.ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Checking Ollama connection...
      </span>
    </div>
  );
}

interface DisconnectedStatusProps {
  message?: string;
}

function DisconnectedStatus({ message }: DisconnectedStatusProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Ollama Not Detected
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {message || "Make sure Ollama is installed and running."}
            </p>
          </div>

          <SetupInstructions />
          <RecommendedModelsList />
        </div>
      </div>
    </div>
  );
}

function SetupInstructions(): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Quick Setup:
      </p>
      <ol className="list-inside list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-300">
        <li>
          Install Ollama from{" "}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            ollama.com
          </a>
        </li>
        <li>
          Run:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900">
            ollama pull llama3.2
          </code>
        </li>
        <li>
          Start Ollama:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900">
            ollama serve
          </code>
        </li>
        <li>Refresh this page</li>
      </ol>
    </div>
  );
}

function RecommendedModelsList(): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Recommended Models:
      </p>
      <div className="space-y-1.5">
        {RECOMMENDED_MODELS.map((model) => (
          <ModelCard key={model.name} model={model} />
        ))}
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: RecommendedModel;
}

function ModelCard({ model }: ModelCardProps): React.ReactElement {
  return (
    <div className="rounded bg-amber-100/50 px-2 py-1.5 text-xs dark:bg-amber-900/50">
      <span className="font-mono font-medium text-amber-900 dark:text-amber-100">
        {model.name}
      </span>
      <span className="mx-1.5 text-amber-600 dark:text-amber-400">
        ({model.size}, {model.ram} RAM)
      </span>
      <span className="text-amber-700 dark:text-amber-300">
        {model.description}
      </span>
    </div>
  );
}

interface ConnectedStatusProps {
  modelCount: number;
}

function ConnectedStatus({ modelCount }: ConnectedStatusProps): React.ReactElement {
  const modelText = modelCount > 0 ? formatModelCount(modelCount) : null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
      <span className="text-sm text-green-700 dark:text-green-300">
        Ollama connected
        {modelText && (
          <span className="ml-1 text-green-600 dark:text-green-400">
            ({modelText})
          </span>
        )}
      </span>
    </div>
  );
}

function formatModelCount(count: number): string {
  if (count === 1) return "1 model available";
  return `${count} models available`;
}
