import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  initializeSkills,
  areSkillsInitialized,
  ConversationToolManager,
} from "@/lib/skills";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

const ollama = createOpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama",
});

// Initialize skills on module load
if (!areSkillsInitialized()) {
  initializeSkills();
}

// In-memory conversation managers (for MVP; will use proper state management later)
const conversationManagers = new Map<string, ConversationToolManager>();

function getOrCreateManager(conversationId: string): ConversationToolManager {
  let manager = conversationManagers.get(conversationId);
  if (!manager) {
    manager = new ConversationToolManager(conversationId);
    conversationManagers.set(conversationId, manager);
  }
  return manager;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to various skills and tools.

To discover and use skills, call the discover_skills tool with a query describing what you need.
For example:
- Need to calculate something? Call discover_skills with "math" or "calculate"
- Need to save a note? Call discover_skills with "notes" or "save"
- Need to manage tasks? Call discover_skills with "tasks" or "todo"
- Need to format code? Call discover_skills with "format" or "code"

After discovering skills, they become available for you to use. Be concise and helpful.`;

export async function POST(req: Request): Promise<Response> {
  const { messages, conversationId = "default", loadedSkills = [] } = await req.json();

  // Get or create conversation manager
  const manager = getOrCreateManager(conversationId);

  // Load any skills that were previously discovered (from client state)
  if (loadedSkills.length > 0) {
    manager.loadSkills(loadedSkills);
  }

  // Get tools for this request
  const tools = manager.getToolsForRequest();

  const result = streamText({
    model: ollama("llama3.2"),
    messages,
    system: SYSTEM_PROMPT,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
