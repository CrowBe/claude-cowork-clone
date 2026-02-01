"use client";

import { useState, useEffect } from "react";

interface OllamaStatus {
  status: "checking" | "connected" | "disconnected";
  models: string[];
  message?: string;
}

export function useOllamaStatus() {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    status: "checking",
    models: [],
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/ollama/status");
        const data = await response.json();

        if (response.ok) {
          setOllamaStatus({
            status: "connected",
            models: data.models || [],
          });
        } else {
          setOllamaStatus({
            status: "disconnected",
            models: [],
            message: data.message,
          });
        }
      } catch {
        setOllamaStatus({
          status: "disconnected",
          models: [],
          message: "Failed to check Ollama status",
        });
      }
    }

    checkStatus();
  }, []);

  return ollamaStatus;
}
