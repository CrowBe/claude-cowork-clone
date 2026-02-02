import { tool } from "ai";
import { z } from "zod";
import YAML from "yaml";
import type { SkillConfig } from "../types";

/**
 * Parse JSON tool - validates and parses JSON strings
 */
export const parseJsonTool = tool({
  description: `Parse and validate JSON strings. Features:
- Validates JSON syntax
- Pretty-prints the result
- Extracts specific paths using dot notation (e.g., "data.users[0].name")
- Reports detailed error messages for invalid JSON`,
  inputSchema: z.object({
    input: z.string().min(1).describe("The JSON string to parse"),
    path: z
      .string()
      .optional()
      .describe('Optional path to extract (e.g., "data.items[0]")'),
    pretty: z
      .boolean()
      .optional()
      .default(true)
      .describe("Pretty-print the output (default: true)"),
  }),
  execute: async ({ input, path, pretty }) => {
    try {
      const parsed = JSON.parse(input);

      // Extract path if specified
      let result = parsed;
      if (path) {
        result = extractPath(parsed, path);
        if (result === undefined) {
          return {
            success: false,
            error: `Path "${path}" not found in JSON`,
            availableKeys: getAvailableKeys(parsed),
          };
        }
      }

      const output = pretty ?? true ? JSON.stringify(result, null, 2) : JSON.stringify(result);

      return {
        success: true,
        parsed: result,
        formatted: output,
        type: Array.isArray(result) ? "array" : typeof result,
        path: path || "(root)",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Try to provide helpful context for syntax errors
      const match = message.match(/position (\d+)/i);
      let context = "";
      if (match) {
        const pos = parseInt(match[1], 10);
        const start = Math.max(0, pos - 20);
        const end = Math.min(input.length, pos + 20);
        context = `Near: ...${input.slice(start, end)}...`;
      }

      return {
        success: false,
        error: `Invalid JSON: ${message}`,
        context,
        hint: "Common issues: missing quotes, trailing commas, single quotes instead of double",
      };
    }
  },
});

/**
 * Parse YAML tool - converts YAML to JSON
 */
export const parseYamlTool = tool({
  description: `Parse YAML strings and convert to JSON. Features:
- Validates YAML syntax
- Converts to JSON format
- Supports multi-document YAML
- Handles anchors and aliases`,
  inputSchema: z.object({
    input: z.string().min(1).describe("The YAML string to parse"),
    multiDocument: z
      .boolean()
      .optional()
      .default(false)
      .describe("Parse as multi-document YAML (default: false)"),
  }),
  execute: async ({ input, multiDocument }) => {
    try {
      let result: unknown;

      if (multiDocument) {
        result = YAML.parseAllDocuments(input).map((doc) => doc.toJSON());
      } else {
        result = YAML.parse(input);
      }

      return {
        success: true,
        parsed: result,
        json: JSON.stringify(result, null, 2),
        type: Array.isArray(result) ? "array" : typeof result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Invalid YAML: ${message}`,
        hint: "Check indentation (use spaces, not tabs) and colon placement",
      };
    }
  },
});

/**
 * Convert JSON to YAML tool
 */
export const jsonToYamlTool = tool({
  description: "Convert JSON to YAML format.",
  inputSchema: z.object({
    input: z.string().min(1).describe("The JSON string to convert"),
    indent: z
      .number()
      .int()
      .min(1)
      .max(8)
      .optional()
      .default(2)
      .describe("Indentation spaces (default: 2)"),
  }),
  execute: async ({ input, indent }) => {
    try {
      const parsed = JSON.parse(input);
      const yaml = YAML.stringify(parsed, { indent: indent ?? 2 });

      return {
        success: true,
        yaml,
        originalFormat: "json",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to convert: ${message}`,
      };
    }
  },
});

/**
 * Convert YAML to JSON tool
 */
export const yamlToJsonTool = tool({
  description: "Convert YAML to JSON format.",
  inputSchema: z.object({
    input: z.string().min(1).describe("The YAML string to convert"),
    pretty: z
      .boolean()
      .optional()
      .default(true)
      .describe("Pretty-print the JSON output (default: true)"),
  }),
  execute: async ({ input, pretty }) => {
    try {
      const parsed = YAML.parse(input);
      const json = (pretty ?? true) ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);

      return {
        success: true,
        json,
        originalFormat: "yaml",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to convert: ${message}`,
      };
    }
  },
});

/**
 * Validate data structure tool
 */
export const validateStructureTool = tool({
  description: `Analyze the structure of JSON/YAML data. Returns:
- Schema-like type information
- Nested object structure
- Array element types
- Key counts and depths`,
  inputSchema: z.object({
    input: z.string().min(1).describe("The JSON or YAML string to analyze"),
    format: z
      .enum(["json", "yaml", "auto"])
      .optional()
      .default("auto")
      .describe("Input format (auto-detected if not specified)"),
  }),
  execute: async ({ input, format }) => {
    try {
      let parsed: unknown;
      let detectedFormat = format ?? "auto";

      if (detectedFormat === "auto") {
        // Try JSON first, then YAML
        try {
          parsed = JSON.parse(input);
          detectedFormat = "json";
        } catch {
          parsed = YAML.parse(input);
          detectedFormat = "yaml";
        }
      } else if (detectedFormat === "json") {
        parsed = JSON.parse(input);
      } else {
        parsed = YAML.parse(input);
      }

      const structure = analyzeStructure(parsed);

      return {
        success: true,
        format: detectedFormat,
        structure,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to analyze: ${message}`,
      };
    }
  },
});

/**
 * Helper: Extract a value at a dot-notation path
 */
function extractPath(obj: unknown, path: string): unknown {
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;

    const index = parseInt(part, 10);
    if (!isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Helper: Get available keys for error messages
 */
function getAvailableKeys(obj: unknown): string[] {
  if (obj === null || typeof obj !== "object") return [];
  if (Array.isArray(obj)) return obj.map((_, i) => `[${i}]`);
  return Object.keys(obj);
}

/**
 * Helper: Analyze structure recursively
 */
function analyzeStructure(
  value: unknown,
  depth = 0,
  maxDepth = 5
): {
  type: string;
  keys?: string[];
  length?: number;
  children?: Record<string, unknown>;
  sample?: unknown;
} {
  if (depth > maxDepth) {
    return { type: "...(max depth)" };
  }

  if (value === null) return { type: "null" };
  if (value === undefined) return { type: "undefined" };

  const type = typeof value;

  if (type !== "object") {
    return { type, sample: type === "string" && String(value).length > 50 ? String(value).slice(0, 50) + "..." : value };
  }

  if (Array.isArray(value)) {
    const result: { type: string; length: number; elementTypes?: string[]; sample?: unknown } = {
      type: "array",
      length: value.length,
    };

    if (value.length > 0) {
      const elementTypes = [...new Set(value.slice(0, 10).map((v) => (v === null ? "null" : typeof v)))];
      result.elementTypes = elementTypes;

      if (value.length <= 3) {
        result.sample = value.map((v) => analyzeStructure(v, depth + 1, maxDepth));
      } else {
        result.sample = analyzeStructure(value[0], depth + 1, maxDepth);
      }
    }

    return result;
  }

  // Object
  const keys = Object.keys(value);
  const children: Record<string, unknown> = {};

  for (const key of keys.slice(0, 20)) {
    children[key] = analyzeStructure((value as Record<string, unknown>)[key], depth + 1, maxDepth);
  }

  return {
    type: "object",
    keys: keys.length <= 20 ? keys : [...keys.slice(0, 20), `...(${keys.length - 20} more)`],
    children,
  };
}

/**
 * Skill configurations
 */
export const parseJsonSkillConfig: SkillConfig = {
  id: "parse_json",
  name: "Parse JSON",
  description: "Parse and validate JSON strings with path extraction",
  keywords: ["json", "parse", "validate", "extract", "path", "data"],
  tier: "core",
  category: "developer",
  tool: parseJsonTool,
};

export const parseYamlSkillConfig: SkillConfig = {
  id: "parse_yaml",
  name: "Parse YAML",
  description: "Parse YAML strings and convert to JSON",
  keywords: ["yaml", "yml", "parse", "validate", "config", "data"],
  tier: "core",
  category: "developer",
  tool: parseYamlTool,
};

export const jsonToYamlSkillConfig: SkillConfig = {
  id: "json_to_yaml",
  name: "JSON to YAML",
  description: "Convert JSON to YAML format",
  keywords: ["json", "yaml", "convert", "transform"],
  tier: "core",
  category: "developer",
  tool: jsonToYamlTool,
};

export const yamlToJsonSkillConfig: SkillConfig = {
  id: "yaml_to_json",
  name: "YAML to JSON",
  description: "Convert YAML to JSON format",
  keywords: ["yaml", "json", "convert", "transform"],
  tier: "core",
  category: "developer",
  tool: yamlToJsonTool,
};

export const validateStructureSkillConfig: SkillConfig = {
  id: "validate_structure",
  name: "Validate Structure",
  description: "Analyze the structure of JSON/YAML data",
  keywords: ["validate", "structure", "schema", "analyze", "json", "yaml", "type"],
  tier: "core",
  category: "developer",
  tool: validateStructureTool,
};
