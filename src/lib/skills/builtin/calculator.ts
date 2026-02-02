import { tool } from "ai";
import { z } from "zod";
import { evaluate, format } from "mathjs";
import type { SkillConfig } from "../types";

/**
 * Calculator skill using mathjs for safe expression evaluation.
 * Supports arithmetic, algebra, unit conversions, and more.
 */
export const calculatorTool = tool({
  description: `Evaluate mathematical expressions safely. Supports:
- Basic arithmetic: 2 + 3 * 4, sqrt(16), 2^10
- Percentages: 15% of 200, 50 + 10%
- Unit conversions: 5 km to miles, 100 fahrenheit to celsius
- Functions: sin, cos, tan, log, exp, abs, round, floor, ceil
- Constants: pi, e, phi
- Complex expressions: (2 + 3i) * (4 - 2i)
- Statistics: mean([1,2,3]), std([1,2,3])`,
  inputSchema: z.object({
    expression: z
      .string()
      .min(1)
      .describe('The mathematical expression to evaluate (e.g., "15% of 847", "5 km to miles")'),
    precision: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .default(6)
      .describe("Number of significant digits for the result (default: 6)"),
  }),
  execute: async ({ expression, precision }) => {
    try {
      // Handle percentage expressions like "15% of 200"
      const normalizedExpr = expression
        .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, "($1 / 100) * $2")
        .replace(/(\d+(?:\.\d+)?)\s*%/g, "($1 / 100)");

      const result = evaluate(normalizedExpr);

      // Format the result
      const formatted = format(result, { precision: precision ?? 6 });

      return {
        success: true,
        expression,
        result: formatted,
        numericValue: typeof result === "number" ? result : null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        expression,
        error: `Failed to evaluate: ${message}`,
        hint: "Check syntax. Examples: '2 + 3', 'sqrt(16)', '5 km to miles'",
      };
    }
  },
});

/**
 * Skill configuration for registration
 */
export const calculatorSkillConfig: SkillConfig = {
  id: "calculator",
  name: "Calculator",
  description: "Evaluate math expressions, unit conversions, and calculations",
  keywords: [
    "math",
    "calculate",
    "calculator",
    "arithmetic",
    "add",
    "subtract",
    "multiply",
    "divide",
    "percentage",
    "percent",
    "convert",
    "units",
    "conversion",
    "sqrt",
    "power",
    "exponent",
    "sin",
    "cos",
    "tan",
    "log",
    "statistics",
    "mean",
    "average",
  ],
  tier: "core",
  category: "productivity",
  tool: calculatorTool,
};
