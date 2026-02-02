import { tool } from "ai";
import { z } from "zod";
import { skillRegistry } from "./registry";
import type { SkillCategory, SkillDiscoveryResult } from "./types";

/**
 * The discover_skills meta-tool is the entry point for the LLM to find
 * and load capabilities on-demand. This enables lazy-loading of tools
 * to minimize context token usage.
 *
 * Flow:
 * 1. LLM calls discover_skills when it needs a capability
 * 2. Registry searches for matching skills
 * 3. Matching skill IDs are returned and added to the conversation's loaded skills
 * 4. On the next turn, those skills become available as tools
 */
export const discoverSkillsTool = tool({
  description: `Search for available skills to help with a task. Use this when you need
capabilities like: calculations, note-taking, task management, web search, file reading,
diagram generation, code execution, or other actions beyond conversation.

After discovering skills, they become available for use in subsequent messages.
Call this tool whenever you need a capability you don't currently have access to.`,
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'What capability you need (e.g., "math", "save notes", "search web", "format code")'
      ),
    category: z
      .enum(["all", "productivity", "developer", "network", "integrations"])
      .optional()
      .default("all")
      .describe("Filter by category: productivity, developer, network, or integrations"),
  }),
  execute: async ({ query, category }) => {
    const categoryFilter: SkillCategory | undefined =
      category === "all" ? undefined : (category as SkillCategory);

    const matches = skillRegistry.search(query, {
      category: categoryFilter,
      enabledOnly: true,
      limit: 5, // Limit to prevent context bloat
    });

    // Transform to discovery result format
    const skills: SkillDiscoveryResult[] = matches.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tier: s.tier,
    }));

    // Build response message
    let message: string;
    if (skills.length === 0) {
      const availableCategories = Object.entries(skillRegistry.getSkillCounts())
        .filter(([, count]) => count > 0)
        .map(([cat]) => cat)
        .join(", ");

      message = `No matching skills found for "${query}". Try different terms or browse categories: ${availableCategories || "none available"}.`;
    } else if (skills.length === 1) {
      message = `Found the "${skills[0].name}" skill. It's now available for use.`;
    } else {
      message = `Found ${skills.length} skills: ${skills.map((s) => s.name).join(", ")}. They are now available for use.`;
    }

    return {
      skills,
      skillIds: skills.map((s) => s.id),
      message,
      query,
      category: category || "all",
    };
  },
});

/**
 * Create a discover_skills tool with custom registry (for testing)
 */
export function createDiscoverSkillsTool(registry: typeof skillRegistry) {
  return tool({
    description: discoverSkillsTool.description,
    inputSchema: discoverSkillsTool.inputSchema,
    execute: async ({ query, category }) => {
      const categoryFilter: SkillCategory | undefined =
        category === "all" ? undefined : (category as SkillCategory);

      const matches = registry.search(query, {
        category: categoryFilter,
        enabledOnly: true,
        limit: 5,
      });

      const skills: SkillDiscoveryResult[] = matches.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        tier: s.tier,
      }));

      const message =
        skills.length > 0
          ? `Found ${skills.length} skill(s). They are now available for use.`
          : `No matching skills found for "${query}".`;

      return {
        skills,
        skillIds: skills.map((s) => s.id),
        message,
        query,
        category: category || "all",
      };
    },
  });
}
