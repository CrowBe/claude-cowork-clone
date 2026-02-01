import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const CONNECTION_TIMEOUT_MS = 3000;

interface OllamaModel {
  name: string;
}

interface OllamaTagsResponse {
  models?: OllamaModel[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(CONNECTION_TIMEOUT_MS),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: "Ollama responded with an error" },
        { status: 503 }
      );
    }

    const data: OllamaTagsResponse = await response.json();
    const models = data.models?.map((m) => m.name) ?? [];

    return NextResponse.json({ status: "connected", models });
  } catch {
    return NextResponse.json(
      { status: "disconnected", message: "Cannot connect to Ollama. Make sure it is running." },
      { status: 503 }
    );
  }
}
