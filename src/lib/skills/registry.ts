import type {
  SkillDefinition,
  SkillConfig,
  SkillSearchOptions,
  SkillCategory,
  SkillTier,
} from "./types";

/**
 * SkillRegistry manages all available skills and provides search functionality.
 * This is the central hub for skill discovery and management.
 */
export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  /**
   * Register a skill with the registry
   */
  register(config: SkillConfig): void {
    const skill: SkillDefinition = {
      id: config.id,
      name: config.name,
      description: config.description,
      keywords: config.keywords,
      tier: config.tier,
      category: config.category,
      requiresApproval: config.requiresApproval ?? false,
      requiresNetwork: config.requiresNetwork ?? false,
      defaultEnabled: config.defaultEnabled ?? (config.tier === "core" || config.tier === "enhanced"),
      enabled: config.defaultEnabled ?? (config.tier === "core" || config.tier === "enhanced"),
      type: "builtin",
      tool: config.tool,
    };

    this.skills.set(skill.id, skill);
  }

  /**
   * Get a skill by ID
   */
  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  /**
   * Check if a skill exists
   */
  has(id: string): boolean {
    return this.skills.has(id);
  }

  /**
   * Enable or disable a skill
   */
  setEnabled(id: string, enabled: boolean): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;
    skill.enabled = enabled;
    return true;
  }

  /**
   * Search skills by query string and optional filters
   * Uses keyword matching against name, description, and keywords
   */
  search(query: string, options: SkillSearchOptions = {}): SkillDefinition[] {
    const queryLower = query.toLowerCase().trim();
    const queryTerms = queryLower.split(/\s+/).filter(Boolean);
    const limit = options.limit ?? 10;

    if (queryTerms.length === 0) {
      // Empty query - return all matching filters
      return this.filter(options).slice(0, limit);
    }

    const results: Array<{ skill: SkillDefinition; score: number }> = [];

    for (const skill of this.skills.values()) {
      // Apply filters first
      if (options.enabledOnly && !skill.enabled) continue;
      if (options.category && skill.category !== options.category) continue;
      if (options.tier && skill.tier !== options.tier) continue;

      // Calculate relevance score
      const score = this.calculateRelevance(skill, queryTerms);
      if (score > 0) {
        results.push({ skill, score });
      }
    }

    // Sort by score descending, then by name
    return results
      .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
      .slice(0, limit)
      .map((r) => r.skill);
  }

  /**
   * Calculate relevance score for a skill against query terms
   */
  private calculateRelevance(skill: SkillDefinition, queryTerms: string[]): number {
    let score = 0;

    const nameLower = skill.name.toLowerCase();
    const descLower = skill.description.toLowerCase();
    const keywordsLower = skill.keywords.map((k) => k.toLowerCase());

    for (const term of queryTerms) {
      // Exact name match (highest score)
      if (nameLower === term) {
        score += 100;
      } else if (nameLower.includes(term)) {
        score += 50;
      }

      // Keyword exact match
      if (keywordsLower.includes(term)) {
        score += 40;
      } else if (keywordsLower.some((k) => k.includes(term))) {
        score += 20;
      }

      // Description match
      if (descLower.includes(term)) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Filter skills by options without search query
   */
  private filter(options: SkillSearchOptions): SkillDefinition[] {
    return Array.from(this.skills.values()).filter((skill) => {
      if (options.enabledOnly && !skill.enabled) return false;
      if (options.category && skill.category !== options.category) return false;
      if (options.tier && skill.tier !== options.tier) return false;
      return true;
    });
  }

  /**
   * Get all enabled skills
   */
  getEnabledSkills(): SkillDefinition[] {
    return Array.from(this.skills.values()).filter((s) => s.enabled);
  }

  /**
   * Get all skills (for settings UI)
   */
  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills grouped by tier
   */
  getSkillsByTier(): Record<SkillTier, SkillDefinition[]> {
    const grouped: Record<SkillTier, SkillDefinition[]> = {
      core: [],
      enhanced: [],
      network: [],
      integration: [],
    };

    for (const skill of this.skills.values()) {
      grouped[skill.tier].push(skill);
    }

    return grouped;
  }

  /**
   * Get skills grouped by category
   */
  getSkillsByCategory(): Record<SkillCategory, SkillDefinition[]> {
    const grouped: Record<SkillCategory, SkillDefinition[]> = {
      productivity: [],
      developer: [],
      network: [],
      integrations: [],
    };

    for (const skill of this.skills.values()) {
      grouped[skill.category].push(skill);
    }

    return grouped;
  }

  /**
   * Get count of skills by category
   */
  getSkillCounts(): Record<SkillCategory, number> {
    const counts: Record<SkillCategory, number> = {
      productivity: 0,
      developer: 0,
      network: 0,
      integrations: 0,
    };

    for (const skill of this.skills.values()) {
      counts[skill.category]++;
    }

    return counts;
  }

  /**
   * Reset all skills to their default enabled state
   */
  resetToDefaults(): void {
    for (const skill of this.skills.values()) {
      skill.enabled = skill.defaultEnabled;
    }
  }

  /**
   * Get skill IDs by tier
   */
  getSkillIdsByTier(tier: SkillTier): string[] {
    return Array.from(this.skills.values())
      .filter((s) => s.tier === tier)
      .map((s) => s.id);
  }
}

// Global singleton instance
export const skillRegistry = new SkillRegistry();
