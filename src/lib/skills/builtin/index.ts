/**
 * Builtin skills index
 * Exports all skill configurations for registration
 */

// Calculator
export { calculatorSkillConfig, calculatorTool } from "./calculator";

// Notes
export {
  createNoteSkillConfig,
  readNoteSkillConfig,
  listNotesSkillConfig,
  deleteNoteSkillConfig,
  createNoteTool,
  readNoteTool,
  listNotesTool,
  deleteNoteTool,
} from "./notes";

// Tasks
export {
  createTaskSkillConfig,
  listTasksSkillConfig,
  updateTaskSkillConfig,
  completeTaskSkillConfig,
  deleteTaskSkillConfig,
  createTaskTool,
  listTasksTool,
  updateTaskTool,
  completeTaskTool,
  deleteTaskTool,
} from "./tasks";

// Memory
export {
  saveMemorySkillConfig,
  recallMemorySkillConfig,
  listMemoriesSkillConfig,
  deleteMemorySkillConfig,
  saveMemoryTool,
  recallMemoryTool,
  listMemoriesTool,
  deleteMemoryTool,
} from "./memory";

// Code Formatter
export {
  formatCodeSkillConfig,
  minifyCodeSkillConfig,
  formatCodeTool,
  minifyCodeTool,
} from "./code-formatter";

// Data Parser (JSON/YAML)
export {
  parseJsonSkillConfig,
  parseYamlSkillConfig,
  jsonToYamlSkillConfig,
  yamlToJsonSkillConfig,
  validateStructureSkillConfig,
  parseJsonTool,
  parseYamlTool,
  jsonToYamlTool,
  yamlToJsonTool,
  validateStructureTool,
} from "./data-parser";

// Aggregate all skill configs for easy registration
import { calculatorSkillConfig } from "./calculator";
import {
  createNoteSkillConfig,
  readNoteSkillConfig,
  listNotesSkillConfig,
  deleteNoteSkillConfig,
} from "./notes";
import {
  createTaskSkillConfig,
  listTasksSkillConfig,
  updateTaskSkillConfig,
  completeTaskSkillConfig,
  deleteTaskSkillConfig,
} from "./tasks";
import {
  saveMemorySkillConfig,
  recallMemorySkillConfig,
  listMemoriesSkillConfig,
  deleteMemorySkillConfig,
} from "./memory";
import { formatCodeSkillConfig, minifyCodeSkillConfig } from "./code-formatter";
import {
  parseJsonSkillConfig,
  parseYamlSkillConfig,
  jsonToYamlSkillConfig,
  yamlToJsonSkillConfig,
  validateStructureSkillConfig,
} from "./data-parser";

import type { SkillConfig } from "../types";

/**
 * All builtin skill configurations
 */
export const builtinSkillConfigs: SkillConfig[] = [
  // Productivity
  calculatorSkillConfig,
  createNoteSkillConfig,
  readNoteSkillConfig,
  listNotesSkillConfig,
  deleteNoteSkillConfig,
  createTaskSkillConfig,
  listTasksSkillConfig,
  updateTaskSkillConfig,
  completeTaskSkillConfig,
  deleteTaskSkillConfig,
  saveMemorySkillConfig,
  recallMemorySkillConfig,
  listMemoriesSkillConfig,
  deleteMemorySkillConfig,

  // Developer
  formatCodeSkillConfig,
  minifyCodeSkillConfig,
  parseJsonSkillConfig,
  parseYamlSkillConfig,
  jsonToYamlSkillConfig,
  yamlToJsonSkillConfig,
  validateStructureSkillConfig,
];
