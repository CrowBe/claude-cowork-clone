import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

/**
 * Task priority levels
 */
const priorityLevels = ["low", "medium", "high", "urgent"] as const;
type Priority = (typeof priorityLevels)[number];

/**
 * Task status values
 */
const statusValues = ["pending", "in_progress", "completed", "cancelled"] as const;
type Status = (typeof statusValues)[number];

/**
 * Task interface
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * In-memory task storage (will be replaced with IndexedDB in browser)
 */
const tasksStore = new Map<string, Task>();
let taskIdCounter = 1;

function generateTaskId(): string {
  return `task_${taskIdCounter++}`;
}

/**
 * Create task tool
 */
export const createTaskTool = tool({
  description: "Create a new task/todo item with optional priority and due date.",
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe("The task title"),
    description: z.string().optional().describe("Optional detailed description"),
    priority: z
      .enum(priorityLevels)
      .optional()
      .default("medium")
      .describe("Task priority: low, medium, high, or urgent"),
    dueDate: z
      .string()
      .optional()
      .describe("Optional due date in ISO format (e.g., 2024-12-31)"),
  }),
  execute: async ({ title, description, priority, dueDate }) => {
    const now = new Date();
    const id = generateTaskId();

    const task: Task = {
      id,
      title,
      description,
      priority: priority ?? "medium",
      status: "pending",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    tasksStore.set(id, task);

    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.toISOString(),
      },
      message: `Task "${title}" created with ID ${id}.`,
    };
  },
});

/**
 * List tasks tool
 */
export const listTasksTool = tool({
  description: "List tasks with optional filters for status and priority.",
  inputSchema: z.object({
    status: z
      .enum([...statusValues, "all"])
      .optional()
      .default("all")
      .describe("Filter by status: pending, in_progress, completed, cancelled, or all"),
    priority: z
      .enum([...priorityLevels, "all"])
      .optional()
      .default("all")
      .describe("Filter by priority: low, medium, high, urgent, or all"),
    includeDone: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include completed/cancelled tasks"),
  }),
  execute: async ({ status, priority, includeDone }) => {
    let tasks = Array.from(tasksStore.values());

    // Filter by status
    if (status !== "all") {
      tasks = tasks.filter((t) => t.status === status);
    } else if (!includeDone) {
      tasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    }

    // Filter by priority
    if (priority !== "all") {
      tasks = tasks.filter((t) => t.priority === priority);
    }

    // Sort by priority (urgent first) then by due date
    const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    const results = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate?.toISOString().split("T")[0],
    }));

    return {
      success: true,
      count: results.length,
      tasks: results,
      message: results.length === 0 ? "No tasks found." : `Found ${results.length} task(s).`,
    };
  },
});

/**
 * Update task status tool
 */
export const updateTaskTool = tool({
  description: "Update a task's status, priority, or other fields.",
  inputSchema: z.object({
    id: z.string().describe("The task ID to update"),
    status: z.enum(statusValues).optional().describe("New status"),
    priority: z.enum(priorityLevels).optional().describe("New priority"),
    title: z.string().optional().describe("New title"),
    dueDate: z.string().optional().describe("New due date (ISO format)"),
  }),
  execute: async ({ id, status, priority, title, dueDate }) => {
    const task = tasksStore.get(id);

    if (!task) {
      return {
        success: false,
        error: `Task "${id}" not found.`,
      };
    }

    const now = new Date();
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (title) task.title = title;
    if (dueDate) task.dueDate = new Date(dueDate);
    task.updatedAt = now;

    if (status === "completed" && !task.completedAt) {
      task.completedAt = now;
    }

    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.toISOString().split("T")[0],
      },
      message: `Task "${task.title}" updated.`,
    };
  },
});

/**
 * Complete task shortcut tool
 */
export const completeTaskTool = tool({
  description: "Mark a task as completed.",
  inputSchema: z.object({
    id: z.string().describe("The task ID to complete"),
  }),
  execute: async ({ id }) => {
    const task = tasksStore.get(id);

    if (!task) {
      return {
        success: false,
        error: `Task "${id}" not found.`,
      };
    }

    const now = new Date();
    task.status = "completed";
    task.completedAt = now;
    task.updatedAt = now;

    return {
      success: true,
      message: `Task "${task.title}" marked as completed.`,
    };
  },
});

/**
 * Delete task tool
 */
export const deleteTaskTool = tool({
  description: "Delete a task permanently.",
  inputSchema: z.object({
    id: z.string().describe("The task ID to delete"),
  }),
  execute: async ({ id }) => {
    const task = tasksStore.get(id);

    if (!task) {
      return {
        success: false,
        error: `Task "${id}" not found.`,
      };
    }

    tasksStore.delete(id);

    return {
      success: true,
      message: `Task "${task.title}" deleted.`,
    };
  },
});

/**
 * Skill configurations
 */
export const createTaskSkillConfig: SkillConfig = {
  id: "create_task",
  name: "Create Task",
  description: "Create a new task/todo with priority and due date",
  keywords: ["task", "todo", "create", "add", "new", "reminder", "deadline"],
  tier: "core",
  category: "productivity",
  tool: createTaskTool,
};

export const listTasksSkillConfig: SkillConfig = {
  id: "list_tasks",
  name: "List Tasks",
  description: "List and filter tasks by status and priority",
  keywords: ["task", "todo", "list", "show", "pending", "tasks", "todos"],
  tier: "core",
  category: "productivity",
  tool: listTasksTool,
};

export const updateTaskSkillConfig: SkillConfig = {
  id: "update_task",
  name: "Update Task",
  description: "Update task status, priority, or details",
  keywords: ["task", "todo", "update", "change", "modify", "edit"],
  tier: "core",
  category: "productivity",
  tool: updateTaskTool,
};

export const completeTaskSkillConfig: SkillConfig = {
  id: "complete_task",
  name: "Complete Task",
  description: "Mark a task as completed",
  keywords: ["task", "todo", "complete", "done", "finish", "check"],
  tier: "core",
  category: "productivity",
  tool: completeTaskTool,
};

export const deleteTaskSkillConfig: SkillConfig = {
  id: "delete_task",
  name: "Delete Task",
  description: "Delete a task permanently",
  keywords: ["task", "todo", "delete", "remove"],
  tier: "core",
  category: "productivity",
  tool: deleteTaskTool,
};
