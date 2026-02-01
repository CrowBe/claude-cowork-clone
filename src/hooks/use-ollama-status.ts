"use client";

import { useState, useEffect } from "react";

type ConnectionStatus = "checking" | "connected" | "disconnected";

interface OllamaStatusState {
  status: ConnectionStatus;
  models: string[];
  message?: string;
}

interface OllamaStatusResponse {
  status: string;
  models?: string[];
  message?: string;
}

const INITIAL_STATE: OllamaStatusState = {
  status: "checking",
  models: [],
};

export function useOllamaStatus(): OllamaStatusState {
  const [state, setState] = useState<OllamaStatusState>(INITIAL_STATE);

  useEffect(function checkOllamaConnection() {
    async function fetchStatus(): Promise<void> {
      try {
        const response = await fetch("/api/ollama/status");
        const data: OllamaStatusResponse = await response.json();

        if (response.ok) {
          setState({
            status: "connected",
            models: data.models ?? [],
          });
        } else {
          setState({
            status: "disconnected",
            models: [],
            message: data.message,
          });
        }
      } catch {
        setState({
          status: "disconnected",
          models: [],
          message: "Failed to check Ollama status",
        });
      }
    }

    fetchStatus();
  }, []);

  return state;
}
