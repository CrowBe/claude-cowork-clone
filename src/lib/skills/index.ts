/**
 * Skills Module
 *
 * This module provides the core skills infrastructure including:
 * - SkillRegistry: Central registry for all skills with search functionality
 * - ConversationToolManager: Per-conversation tool state management
 * - discover_skills: Meta-tool for lazy-loading capabilities
 * - Builtin skills: Calculator, Notes, Tasks, Memory, Code Formatter, Data Parser
 *
 * Usage:
 *
 * ```typescript
 * import { skillRegistry, ConversationToolManager, initializeSkills } from '@/lib/skills';
 *
 * // Initialize all builtin skills (call once at startup)
 * initializeSkills();
 *
 * // Create a manager for a conversation
 * const manager = new ConversationToolManager('conversation-123');
 *
 * // Get tools for LLM request
 * const tools = manager.getToolsForRequest();
 *
 * // After discover_skills returns, load the skills
 * manager.onSkillsDiscovered('math', ['calculator']);
 *
 * // Next request will include the calculator tool
 * const updatedTools = manager.getToolsForRequest();
 * ```
 */

// Types
export type {
  SkillDefinition,
  SkillConfig,
  SkillTier,
  SkillCategory,
  SkillType,
  SkillSearchOptions,
  SkillDiscoveryResult,
  ConversationToolState,
} from "./types";

// Registry
export { SkillRegistry, skillRegistry } from "./registry";

// Discovery
export { discoverSkillsTool, createDiscoverSkillsTool } from "./discover";

// Conversation Manager
export {
  ConversationToolManager,
  createConversationToolManager,
} from "./conversation-manager";

// Builtin skills (individual exports)
export * from "./builtin";

// Import for initialization
import { skillRegistry } from "./registry";
import { builtinSkillConfigs } from "./builtin";

/**
 * Initialize all builtin skills
 * Call this once at application startup
 */
export function initializeSkills(): void {
  for (const config of builtinSkillConfigs) {
    skillRegistry.register(config);
  }
}

/**
 * Check if skills have been initialized
 */
export function areSkillsInitialized(): boolean {
  return skillRegistry.getAllSkills().length > 0;
}

/**
 * Get a summary of registered skills
 */
export function getSkillsSummary(): {
  total: number;
  byTier: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const skills = skillRegistry.getAllSkills();
  const byTier: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const skill of skills) {
    byTier[skill.tier] = (byTier[skill.tier] || 0) + 1;
    byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
  }

  return {
    total: skills.length,
    byTier,
    byCategory,
  };
}
