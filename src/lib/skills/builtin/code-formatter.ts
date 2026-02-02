import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

/**
 * Supported languages for formatting
 */
const supportedLanguages = [
  "javascript",
  "typescript",
  "json",
  "html",
  "css",
  "markdown",
  "yaml",
  "xml",
  "sql",
  "python",
  "auto",
] as const;

type Language = (typeof supportedLanguages)[number];

/**
 * Basic code formatter that handles indentation and common formatting.
 * Note: For production, consider integrating Prettier or language-specific formatters.
 */
function formatCode(code: string, language: Language, indent: number): string {
  const indentStr = " ".repeat(indent);

  // Auto-detect language if needed
  let detectedLang = language;
  if (language === "auto") {
    detectedLang = detectLanguage(code);
  }

  switch (detectedLang) {
    case "json":
      return formatJson(code, indent);
    case "html":
    case "xml":
      return formatXml(code, indentStr);
    case "css":
      return formatCss(code, indentStr);
    case "sql":
      return formatSql(code);
    case "yaml":
      return formatYaml(code, indent);
    default:
      // For JS/TS/Python/Markdown, do basic cleanup
      return formatGeneric(code, indentStr);
  }
}

function detectLanguage(code: string): Language {
  const trimmed = code.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) return "html";
  if (trimmed.startsWith("<")) return "xml";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(trimmed)) return "sql";
  if (/^[\w-]+:\s/m.test(trimmed)) return "yaml";
  if (/^\s*\.\w+\s*\{/.test(trimmed) || /^\s*#\w+\s*\{/.test(trimmed)) return "css";
  if (/^(import|export|const|let|var|function|class)\s/.test(trimmed)) return "javascript";
  if (/^(def|class|import|from)\s/.test(trimmed)) return "python";
  return "javascript"; // Default
}

function formatJson(code: string, indent: number): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, indent);
  } catch {
    return code; // Return original if invalid JSON
  }
}

function formatXml(code: string, indentStr: string): string {
  let formatted = "";
  let depth = 0;
  const lines = code
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Closing tag
    if (line.startsWith("</")) {
      depth = Math.max(0, depth - 1);
    }

    formatted += indentStr.repeat(depth) + line + "\n";

    // Opening tag (not self-closing)
    if (line.startsWith("<") && !line.startsWith("</") && !line.endsWith("/>") && !line.startsWith("<!")) {
      depth++;
    }
  }

  return formatted.trimEnd();
}

function formatCss(code: string, indentStr: string): string {
  return code
    .replace(/\s*{\s*/g, " {\n" + indentStr)
    .replace(/;\s*/g, ";\n" + indentStr)
    .replace(/\s*}\s*/g, "\n}\n")
    .replace(new RegExp(indentStr + "}", "g"), "}")
    .replace(/\n\n+/g, "\n")
    .trim();
}

function formatSql(code: string): string {
  const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "VALUES", "SET"];

  let formatted = code;
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    formatted = formatted.replace(regex, "\n" + kw);
  }

  return formatted
    .replace(/^\n+/, "")
    .replace(/\n+/g, "\n")
    .trim();
}

function formatYaml(code: string, indent: number): string {
  // Basic YAML formatting - normalize indentation
  const lines = code.split("\n");
  const formatted: string[] = [];
  let currentIndent = 0;
  const indentStr = " ".repeat(indent);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted.push("");
      continue;
    }

    // Detect list items and key-value pairs
    if (trimmed.startsWith("- ")) {
      formatted.push(indentStr.repeat(currentIndent) + trimmed);
    } else if (trimmed.includes(":")) {
      // Check if it's a new section (ends with just :)
      if (trimmed.endsWith(":") && !trimmed.includes(": ")) {
        formatted.push(indentStr.repeat(currentIndent) + trimmed);
        currentIndent++;
      } else {
        formatted.push(indentStr.repeat(currentIndent) + trimmed);
      }
    } else {
      formatted.push(indentStr.repeat(currentIndent) + trimmed);
    }
  }

  return formatted.join("\n");
}

function formatGeneric(code: string, indentStr: string): string {
  // Basic cleanup for JS/TS/Python
  let formatted = code
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\t/g, indentStr) // Replace tabs
    .replace(/[ \t]+$/gm, "") // Trim trailing whitespace
    .replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines

  return formatted.trim();
}

/**
 * Code formatter tool
 */
export const formatCodeTool = tool({
  description: `Format and beautify code. Supports:
- JSON: Properly indented with configurable spacing
- HTML/XML: Tag-based indentation
- CSS: Rule formatting
- SQL: Keyword alignment
- YAML: Consistent indentation
- JavaScript/TypeScript/Python: Basic cleanup
Use "auto" for automatic language detection.`,
  inputSchema: z.object({
    code: z.string().min(1).describe("The code to format"),
    language: z
      .enum(supportedLanguages)
      .optional()
      .default("auto")
      .describe("Programming language (or 'auto' to detect)"),
    indent: z
      .number()
      .int()
      .min(1)
      .max(8)
      .optional()
      .default(2)
      .describe("Number of spaces for indentation (default: 2)"),
  }),
  execute: async ({ code, language, indent }) => {
    const lang = language ?? "auto";
    const indentSize = indent ?? 2;

    try {
      const formatted = formatCode(code, lang, indentSize);
      const detectedLang = lang === "auto" ? detectLanguage(code) : lang;

      return {
        success: true,
        formatted,
        language: detectedLang,
        originalLength: code.length,
        formattedLength: formatted.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to format code: ${message}`,
        code, // Return original code
      };
    }
  },
});

/**
 * Minify code tool (opposite of format)
 */
export const minifyCodeTool = tool({
  description: "Minify code by removing unnecessary whitespace. Works best with JSON, CSS, and HTML.",
  inputSchema: z.object({
    code: z.string().min(1).describe("The code to minify"),
    language: z
      .enum(["json", "css", "html", "auto"])
      .optional()
      .default("auto")
      .describe("Language to minify (auto-detected if not specified)"),
  }),
  execute: async ({ code, language }) => {
    const lang = language ?? "auto";
    let detectedLang = lang === "auto" ? detectLanguage(code) : lang;

    try {
      let minified: string;

      switch (detectedLang) {
        case "json":
          minified = JSON.stringify(JSON.parse(code));
          break;
        case "css":
          minified = code
            .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
            .replace(/\s+/g, " ")
            .replace(/\s*([{}:;,])\s*/g, "$1")
            .trim();
          break;
        case "html":
        case "xml":
          minified = code
            .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
            .replace(/>\s+</g, "><")
            .replace(/\s+/g, " ")
            .trim();
          break;
        default:
          minified = code.replace(/\s+/g, " ").trim();
      }

      return {
        success: true,
        minified,
        language: detectedLang,
        originalLength: code.length,
        minifiedLength: minified.length,
        reduction: `${Math.round((1 - minified.length / code.length) * 100)}%`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to minify: ${message}`,
      };
    }
  },
});

/**
 * Skill configurations
 */
export const formatCodeSkillConfig: SkillConfig = {
  id: "format_code",
  name: "Format Code",
  description: "Format and beautify code with proper indentation",
  keywords: [
    "format",
    "beautify",
    "pretty",
    "indent",
    "code",
    "json",
    "html",
    "css",
    "sql",
    "yaml",
    "xml",
    "prettier",
  ],
  tier: "core",
  category: "developer",
  tool: formatCodeTool,
};

export const minifyCodeSkillConfig: SkillConfig = {
  id: "minify_code",
  name: "Minify Code",
  description: "Minify code by removing whitespace",
  keywords: ["minify", "compress", "minimize", "compact", "code", "json", "css", "html"],
  tier: "core",
  category: "developer",
  tool: minifyCodeTool,
};
