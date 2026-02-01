import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

const ollama = createOpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama",
});

export async function POST(req: Request): Promise<Response> {
  const { messages } = await req.json();

  const result = streamText({
    model: ollama("llama3.2"),
    messages,
    system: "You are a helpful AI assistant. Be concise and helpful.",
  });

  return result.toUIMessageStreamResponse();
}
