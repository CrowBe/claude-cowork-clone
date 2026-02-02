# Best Practices Guide

Quick reference for contributing to claude-cowork-clone.

## Core Philosophy

**Local-first, privacy-respecting, no black boxes.**

- All data stays on the user's device by default
- Users can view, edit, export, and delete any stored data
- System behavior is transparent and explainable

## Architecture Rules

### Layer Dependencies

```
App (src/app/)          → Pages, API routes
    ↓
Components (src/components/) → React UI
    ↓
Hooks (src/hooks/)      → State management bridge
    ↓
Lib (src/lib/)          → Framework-agnostic business logic
```

**Rules:**
- `lib/` never imports from `components/` or `hooks/`
- `components/` access `lib/` only through `hooks/`
- No circular dependencies

### File Organization

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js routes and API endpoints |
| `src/components/` | Reusable React components |
| `src/hooks/` | React state and side-effect hooks |
| `src/lib/` | Pure business logic (no React) |
| `src/types/` | TypeScript type definitions |

## Skills Development

### Creating a Skill

Every skill needs two parts: a **tool** and a **config**.

```typescript
// src/lib/skills/builtin/my-skill.ts
import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

// 1. Define the tool
export const myTool = tool({
  description: "What this tool does",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Implementation
    return { success: true, result: "..." };
  },
});

// 2. Define the config
export const mySkillConfig: SkillConfig = {
  id: "my-skill",           // Unique identifier
  name: "My Skill",         // Display name
  description: "...",       // Shown in discovery results
  keywords: ["search", "terms"],  // For skill search matching
  tier: "core",             // core | enhanced | network | integration
  category: "productivity", // productivity | developer | network | integrations
  tool: myTool,
};
```

### Skill Tiers

| Tier | Default | Network | Use Case |
|------|---------|---------|----------|
| `core` | Enabled | No | Safe, local operations (calculator, notes) |
| `enhanced` | Enabled | No | Sandboxed execution (code runner) |
| `network` | Disabled | Yes | Internet access required (web search) |
| `integration` | Disabled | Yes | External services (GitHub, calendar) |

### Registration

Register skills in `src/lib/skills/builtin/index.ts`:

```typescript
import { mySkillConfig } from "./my-skill";

export function registerBuiltinSkills(registry: SkillRegistry): void {
  registry.register(mySkillConfig);
}
```

### Keywords for Discovery

The lazy-loading system finds skills by searching keywords. Provide comprehensive keywords:

```typescript
keywords: [
  "primary-term",      // What users will likely search
  "synonym",           // Alternative terms
  "action-verb",       // What it does (calculate, create, search)
  "related-concept",   // Related ideas
]
```

## TypeScript Conventions

### Prefer Types from `types/`

```typescript
import type { SkillConfig, SkillTier } from "./types";
```

### Use `type` for imports when only using as type

```typescript
import type { Tool } from "ai";  // Type-only import
import { tool } from "ai";       // Value import
```

### Tool Return Values

Always return structured objects with clear status:

```typescript
// Success case
return {
  success: true,
  result: computed_value,
};

// Error case
return {
  success: false,
  error: "Clear error message",
  hint: "How to fix it",
};
```

## Code Style

### Keep It Simple

- Solve the current problem, not hypothetical future ones
- Avoid premature abstractions
- Three similar lines are better than a confusing helper

### Error Handling

- Handle errors at the boundary where they can be meaningfully addressed
- Return structured error objects from tools (don't throw)
- Log errors for debugging but surface user-friendly messages

### Avoid

- Over-engineering and unnecessary abstractions
- Adding features not explicitly requested
- Creating documentation files unless asked
- Using `eval()` or executing arbitrary user code unsafely

## Testing

### Structure

```
tests/
├── unit/        # Test lib/ modules in isolation
├── integration/ # Test hooks and components together
└── e2e/         # Full user flows (Playwright)
```

### What to Test

- **Unit**: Business logic in `lib/` (no React)
- **Integration**: Hooks with mocked lib functions
- **E2E**: Critical user journeys

## API Endpoints

### POST /api/chat

The main chat endpoint injects discovered tools into the request:

```typescript
const tools = conversationManager.getToolsForRequest(conversationId);

const result = await streamText({
  model,
  system: systemPrompt,
  messages,
  tools,  // discover_skills + any loaded skills
});
```

## Storage (Planned)

Following ADR-002 and ADR-004:

- **Conversations**: IndexedDB as JSON
- **Memory files**: IndexedDB with markdown format
- **Export format**: Standard .md and .json files

Currently in-memory for MVP; IndexedDB implementation pending.

## Commit Messages

Use conventional commit format:

```
feat: add calculator skill with unit conversions
fix: handle empty search queries in skill discovery
docs: update skills architecture documentation
refactor: extract tool registration to separate module
```

## Quick Reference

| Question | Answer |
|----------|--------|
| Where do I add a new skill? | `src/lib/skills/builtin/` |
| How do I register it? | Add to `builtin/index.ts` |
| Where is business logic? | `src/lib/` (no React) |
| Where are React components? | `src/components/` |
| How do components access lib? | Through `src/hooks/` |
| What's the discovery pattern? | LLM calls `discover_skills` → tools added to context |
| Default skill tier? | `core` (enabled, local-only) |

## Related Documentation

- [Architecture Decisions](./architecture/) - ADRs for major decisions
- [Skills Architecture](./architecture/adr-008-skills-architecture.md) - Full skill system design
- [Project Architecture](./dev-plans/project-architecture.md) - Complete stack details
