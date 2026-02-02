import type { Tool } from "ai";
import type { ConversationToolState, SkillCategory } from "./types";
import { skillRegistry } from "./registry";
import { discoverSkillsTool } from "./discover";

/**
 * ConversationToolManager handles per-conversation tool state.
 * It implements the lazy-loading pattern where tools are dynamically
 * injected into conversations as they are discovered.
 *
 * Usage:
 * 1. Create a manager for each conversation
 * 2. After LLM calls discover_skills, call onSkillsDiscovered() with the results
 * 3. Call getToolsForRequest() to get the tools array for the next LLM request
 */
export class ConversationToolManager {
  private state: ConversationToolState;

  constructor(conversationId: string = "default") {
    this.state = {
      conversationId,
      loadedSkills: new Set(),
      discoveryHistory: [],
    };
  }

  /**
   * Called when discover_skills returns results.
   * Adds the discovered skills to the loaded set.
   */
  onSkillsDiscovered(
    query: string,
    skillIds: string[],
    category?: SkillCategory
  ): void {
    for (const id of skillIds) {
      // Only add if skill exists and is enabled
      const skill = skillRegistry.get(id);
      if (skill?.enabled) {
        this.state.loadedSkills.add(id);
      }
    }

    this.state.discoveryHistory.push({
      query,
      category,
      results: skillIds,
      timestamp: new Date(),
    });
  }

  /**
   * Manually load specific skills (for pre-loading or testing)
   */
  loadSkills(skillIds: string[]): void {
    for (const id of skillIds) {
      const skill = skillRegistry.get(id);
      if (skill?.enabled) {
        this.state.loadedSkills.add(id);
      }
    }
  }

  /**
   * Unload a specific skill
   */
  unloadSkill(skillId: string): void {
    this.state.loadedSkills.delete(skillId);
  }

  /**
   * Build the tools object for LLM requests.
   * Always includes discover_skills, plus any discovered skills.
   */
  getToolsForRequest(): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      discover_skills: discoverSkillsTool,
    };

    // Add all loaded skills
    for (const skillId of this.state.loadedSkills) {
      const skill = skillRegistry.get(skillId);
      if (skill?.enabled && skill.tool) {
        tools[skill.id] = skill.tool;
      }
    }

    return tools;
  }

  /**
   * Get list of currently loaded skill IDs
   */
  getLoadedSkillIds(): string[] {
    return Array.from(this.state.loadedSkills);
  }

  /**
   * Get list of loaded skill names (for UI display)
   */
  getLoadedSkillNames(): string[] {
    return Array.from(this.state.loadedSkills)
      .map((id) => skillRegistry.get(id)?.name)
      .filter((name): name is string => Boolean(name));
  }

  /**
   * Get discovery history for debugging/analytics
   */
  getDiscoveryHistory() {
    return [...this.state.discoveryHistory];
  }

  /**
   * Get conversation ID
   */
  getConversationId(): string {
    return this.state.conversationId;
  }

  /**
   * Check if a skill is loaded
   */
  isSkillLoaded(skillId: string): boolean {
    return this.state.loadedSkills.has(skillId);
  }

  /**
   * Get count of loaded skills (excluding discover_skills)
   */
  getLoadedSkillCount(): number {
    return this.state.loadedSkills.size;
  }

  /**
   * Reset the manager (when conversation ends)
   */
  reset(): void {
    this.state.loadedSkills.clear();
    this.state.discoveryHistory = [];
  }

  /**
   * Export state for persistence
   */
  exportState(): {
    conversationId: string;
    loadedSkills: string[];
    discoveryHistory: Array<{
      query: string;
      category?: SkillCategory;
      results: string[];
      timestamp: string;
    }>;
  } {
    return {
      conversationId: this.state.conversationId,
      loadedSkills: Array.from(this.state.loadedSkills),
      discoveryHistory: this.state.discoveryHistory.map((h) => ({
        ...h,
        timestamp: h.timestamp.toISOString(),
      })),
    };
  }

  /**
   * Import state from persistence
   */
  importState(data: {
    conversationId: string;
    loadedSkills: string[];
    discoveryHistory: Array<{
      query: string;
      category?: SkillCategory;
      results: string[];
      timestamp: string;
    }>;
  }): void {
    this.state = {
      conversationId: data.conversationId,
      loadedSkills: new Set(data.loadedSkills),
      discoveryHistory: data.discoveryHistory.map((h) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      })),
    };
  }
}

/**
 * Factory function to create a conversation manager
 */
export function createConversationToolManager(
  conversationId?: string
): ConversationToolManager {
  return new ConversationToolManager(conversationId);
}
