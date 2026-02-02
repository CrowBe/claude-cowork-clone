import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

/**
 * Memory entry interface
 */
interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  source: "user" | "assistant" | "system";
  createdAt: Date;
}

/**
 * In-memory storage for memories (will be replaced with IndexedDB)
 */
const memoryStore: MemoryEntry[] = [];
let memoryIdCounter = 1;

function generateMemoryId(): string {
  return `mem_${memoryIdCounter++}`;
}

/**
 * Save memory tool - stores important information for later recall
 */
export const saveMemoryTool = tool({
  description: `Save important information to memory for later recall. Use this to remember:
- User preferences and settings
- Important facts mentioned in conversation
- Decisions made during the session
- Context that should persist across conversations`,
  inputSchema: z.object({
    content: z.string().min(1).describe("The information to remember"),
    tags: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Optional tags for categorization (e.g., ['preference', 'coding'])"),
  }),
  execute: async ({ content, tags }) => {
    const entry: MemoryEntry = {
      id: generateMemoryId(),
      content,
      tags: tags ?? [],
      source: "assistant",
      createdAt: new Date(),
    };

    memoryStore.push(entry);

    return {
      success: true,
      memoryId: entry.id,
      message: `Saved to memory: "${content.slice(0, 50)}${content.length > 50 ? "..." : ""}"`,
    };
  },
});

/**
 * Recall memory tool - searches stored memories
 */
export const recallMemoryTool = tool({
  description: `Search and recall information from memory. Use this to find:
- Previously stored facts or preferences
- Information from earlier in the conversation
- Relevant context for the current task`,
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query to find relevant memories"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags to filter results"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({ query, tags, limit }) => {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(Boolean);

    // Score and filter memories
    const scored = memoryStore
      .map((entry) => {
        let score = 0;
        const contentLower = entry.content.toLowerCase();

        // Check query terms
        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 10;
          }
        }

        // Check tags
        if (tags && tags.length > 0) {
          const matchingTags = entry.tags.filter((t) =>
            tags.some((qt) => t.toLowerCase().includes(qt.toLowerCase()))
          );
          if (matchingTags.length === 0) {
            return { entry, score: 0 }; // Filter out if no tag match
          }
          score += matchingTags.length * 5;
        }

        // Recency boost (newer memories score slightly higher)
        const ageMs = Date.now() - entry.createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        if (ageHours < 1) score += 3;
        else if (ageHours < 24) score += 1;

        return { entry, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit ?? 5);

    const results = scored.map((r) => ({
      id: r.entry.id,
      content: r.entry.content,
      tags: r.entry.tags,
      createdAt: r.entry.createdAt.toISOString(),
    }));

    return {
      success: true,
      count: results.length,
      memories: results,
      message:
        results.length === 0
          ? `No memories found matching "${query}".`
          : `Found ${results.length} relevant memory(ies).`,
    };
  },
});

/**
 * List all memories tool
 */
export const listMemoriesTool = tool({
  description: "List all stored memories, optionally filtered by tags.",
  inputSchema: z.object({
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags to filter memories"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Maximum number of memories to return"),
  }),
  execute: async ({ tags, limit }) => {
    let memories = [...memoryStore];

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      memories = memories.filter((m) =>
        m.tags.some((t) => tags.some((ft) => t.toLowerCase().includes(ft.toLowerCase())))
      );
    }

    // Sort by newest first
    memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const results = memories.slice(0, limit ?? 10).map((m) => ({
      id: m.id,
      content: m.content.slice(0, 100) + (m.content.length > 100 ? "..." : ""),
      tags: m.tags,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      success: true,
      count: results.length,
      total: memoryStore.length,
      memories: results,
    };
  },
});

/**
 * Delete memory tool
 */
export const deleteMemoryTool = tool({
  description: "Delete a specific memory by ID.",
  inputSchema: z.object({
    id: z.string().describe("The memory ID to delete"),
  }),
  execute: async ({ id }) => {
    const index = memoryStore.findIndex((m) => m.id === id);

    if (index === -1) {
      return {
        success: false,
        error: `Memory "${id}" not found.`,
      };
    }

    memoryStore.splice(index, 1);

    return {
      success: true,
      message: `Memory "${id}" deleted.`,
    };
  },
});

/**
 * Skill configurations
 */
export const saveMemorySkillConfig: SkillConfig = {
  id: "save_memory",
  name: "Save Memory",
  description: "Save important information for later recall",
  keywords: ["memory", "remember", "save", "store", "persist", "recall"],
  tier: "core",
  category: "productivity",
  tool: saveMemoryTool,
};

export const recallMemorySkillConfig: SkillConfig = {
  id: "recall_memory",
  name: "Recall Memory",
  description: "Search and recall stored memories",
  keywords: ["memory", "recall", "remember", "search", "find", "retrieve"],
  tier: "core",
  category: "productivity",
  tool: recallMemoryTool,
};

export const listMemoriesSkillConfig: SkillConfig = {
  id: "list_memories",
  name: "List Memories",
  description: "List all stored memories",
  keywords: ["memory", "memories", "list", "all", "show"],
  tier: "core",
  category: "productivity",
  tool: listMemoriesTool,
};

export const deleteMemorySkillConfig: SkillConfig = {
  id: "delete_memory",
  name: "Delete Memory",
  description: "Delete a stored memory",
  keywords: ["memory", "delete", "remove", "forget"],
  tier: "core",
  category: "productivity",
  tool: deleteMemoryTool,
};
