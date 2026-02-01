import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't require a real key
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: ollama("llama3.2"),
    messages,
    system: "You are a helpful AI assistant. Be concise and helpful.",
  });

  return result.toUIMessageStreamResponse();
}
