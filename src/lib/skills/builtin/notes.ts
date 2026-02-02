import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

/**
 * In-memory note storage (will be replaced with IndexedDB in browser)
 * This is a server-side placeholder for the notes skill
 */
const notesStore = new Map<string, { content: string; createdAt: Date; updatedAt: Date }>();

/**
 * Note-taking skill for creating, reading, updating, and listing notes.
 * Notes are stored in memory on the server (browser version will use IndexedDB).
 */
export const createNoteTool = tool({
  description: "Create a new note with a title and content. Use this to save information for later reference.",
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe("The title/name of the note (used as identifier)"),
    content: z.string().min(1).describe("The content of the note"),
  }),
  execute: async ({ title, content }) => {
    const now = new Date();
    const existing = notesStore.has(title);

    notesStore.set(title, {
      content,
      createdAt: existing ? notesStore.get(title)!.createdAt : now,
      updatedAt: now,
    });

    return {
      success: true,
      action: existing ? "updated" : "created",
      title,
      message: existing
        ? `Note "${title}" has been updated.`
        : `Note "${title}" has been created.`,
    };
  },
});

export const readNoteTool = tool({
  description: "Read a note by its title. Returns the note content if found.",
  inputSchema: z.object({
    title: z.string().min(1).describe("The title of the note to read"),
  }),
  execute: async ({ title }) => {
    const note = notesStore.get(title);

    if (!note) {
      // Try case-insensitive search
      const lowerTitle = title.toLowerCase();
      for (const [key, value] of notesStore.entries()) {
        if (key.toLowerCase() === lowerTitle) {
          return {
            success: true,
            title: key,
            content: value.content,
            createdAt: value.createdAt.toISOString(),
            updatedAt: value.updatedAt.toISOString(),
          };
        }
      }

      return {
        success: false,
        error: `Note "${title}" not found.`,
        availableNotes: Array.from(notesStore.keys()).slice(0, 10),
      };
    }

    return {
      success: true,
      title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  },
});

export const listNotesTool = tool({
  description: "List all saved notes. Returns titles and preview of each note.",
  inputSchema: z.object({
    search: z
      .string()
      .optional()
      .describe("Optional search term to filter notes by title or content"),
  }),
  execute: async ({ search }) => {
    let notes = Array.from(notesStore.entries());

    if (search) {
      const searchLower = search.toLowerCase();
      notes = notes.filter(
        ([title, note]) =>
          title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower)
      );
    }

    const results = notes.map(([title, note]) => ({
      title,
      preview: note.content.slice(0, 100) + (note.content.length > 100 ? "..." : ""),
      updatedAt: note.updatedAt.toISOString(),
    }));

    return {
      success: true,
      count: results.length,
      notes: results,
      message:
        results.length === 0
          ? search
            ? `No notes found matching "${search}".`
            : "No notes saved yet."
          : `Found ${results.length} note(s).`,
    };
  },
});

export const deleteNoteTool = tool({
  description: "Delete a note by its title.",
  inputSchema: z.object({
    title: z.string().min(1).describe("The title of the note to delete"),
  }),
  execute: async ({ title }) => {
    if (!notesStore.has(title)) {
      return {
        success: false,
        error: `Note "${title}" not found.`,
      };
    }

    notesStore.delete(title);

    return {
      success: true,
      message: `Note "${title}" has been deleted.`,
    };
  },
});

/**
 * Skill configurations for registration
 */
export const createNoteSkillConfig: SkillConfig = {
  id: "create_note",
  name: "Create Note",
  description: "Create or update a note with a title and content",
  keywords: ["note", "notes", "save", "write", "remember", "store", "create", "jot"],
  tier: "core",
  category: "productivity",
  tool: createNoteTool,
};

export const readNoteSkillConfig: SkillConfig = {
  id: "read_note",
  name: "Read Note",
  description: "Read a saved note by its title",
  keywords: ["note", "notes", "read", "get", "retrieve", "recall", "find"],
  tier: "core",
  category: "productivity",
  tool: readNoteTool,
};

export const listNotesSkillConfig: SkillConfig = {
  id: "list_notes",
  name: "List Notes",
  description: "List all saved notes with optional search",
  keywords: ["note", "notes", "list", "all", "show", "browse", "search"],
  tier: "core",
  category: "productivity",
  tool: listNotesTool,
};

export const deleteNoteSkillConfig: SkillConfig = {
  id: "delete_note",
  name: "Delete Note",
  description: "Delete a saved note",
  keywords: ["note", "notes", "delete", "remove", "erase"],
  tier: "core",
  category: "productivity",
  tool: deleteNoteTool,
};
