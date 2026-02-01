import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: "Ollama responded with an error" },
        { status: 503 }
      );
    }

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    return NextResponse.json({
      status: "connected",
      models,
    });
  } catch {
    return NextResponse.json(
      {
        status: "disconnected",
        message: "Cannot connect to Ollama. Make sure it is running.",
      },
      { status: 503 }
    );
  }
}
