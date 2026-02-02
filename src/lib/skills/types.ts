import type { Tool } from "ai";

/**
 * Skill tier classification
 * - core: Safe, local-only skills (enabled by default)
 * - enhanced: Local with sandboxing (enabled by default)
 * - network: Requires internet (disabled by default)
 * - integration: External service connection (disabled by default)
 */
export type SkillTier = "core" | "enhanced" | "network" | "integration";

/**
 * Skill category for filtering and organization
 */
export type SkillCategory = "productivity" | "developer" | "network" | "integrations";

/**
 * Skill implementation type
 * - builtin: Implemented as Vercel AI SDK tool
 * - mcp: Implemented via MCP server (future)
 */
export type SkillType = "builtin" | "mcp";

/**
 * Complete skill definition
 */
export interface SkillDefinition {
  // Identity
  id: string;
  name: string;
  description: string;
  keywords: string[]; // For search matching

  // Classification
  tier: SkillTier;
  category: SkillCategory;

  // Permissions
  requiresApproval: boolean;
  requiresNetwork: boolean;
  defaultEnabled: boolean;

  // State
  enabled: boolean;

  // Implementation
  type: SkillType;
  tool?: Tool; // For builtin (AI SDK tool)
  mcpServer?: string; // For MCP (server ID)
  mcpToolName?: string; // For MCP (tool name on server)
}

/**
 * Options for searching skills
 */
export interface SkillSearchOptions {
  category?: SkillCategory;
  tier?: SkillTier;
  enabledOnly?: boolean;
  limit?: number;
}

/**
 * Result from skill discovery
 */
export interface SkillDiscoveryResult {
  id: string;
  name: string;
  description: string;
  tier: SkillTier;
}

/**
 * Conversation-level tool state tracking
 */
export interface ConversationToolState {
  conversationId: string;
  loadedSkills: Set<string>;
  discoveryHistory: Array<{
    query: string;
    category?: SkillCategory;
    results: string[];
    timestamp: Date;
  }>;
}

/**
 * Skill registration configuration (used when registering skills)
 */
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  tier: SkillTier;
  category: SkillCategory;
  requiresApproval?: boolean;
  requiresNetwork?: boolean;
  defaultEnabled?: boolean;
  tool: Tool;
}
