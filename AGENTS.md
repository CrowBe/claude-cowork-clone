# CLAUDE.md

## Project Overview

Multi-LLM collaborative AI platform. Local-first, privacy-respecting, no vendor lock-in.

**Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, Vercel AI SDK v6

## Architecture

```
src/app/        → Next.js pages & API routes
src/components/ → React UI components
src/hooks/      → React hooks (bridge to lib)
src/lib/        → Framework-agnostic business logic
src/types/      → TypeScript types
```

**Rules:**
- `lib/` must never import from React layers
- Components access `lib/` only through `hooks/`

## Commands

```bash
npm run dev     # Start dev server (localhost:3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

Requires Ollama running locally for LLM inference.

## Adding Skills

Skills live in `src/lib/skills/builtin/`. Each skill exports a tool and config:

```typescript
import { tool } from "ai";
import { z } from "zod";
import type { SkillConfig } from "../types";

export const myTool = tool({
  description: "What it does",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    return { success: true, result: "..." };
  },
});

export const mySkillConfig: SkillConfig = {
  id: "my-skill",
  name: "My Skill",
  description: "Brief description",
  keywords: ["search", "terms", "for", "discovery"],
  tier: "core",  // core | enhanced | network | integration
  category: "productivity",  // productivity | developer | network | integrations
  tool: myTool,
};
```

Register in `src/lib/skills/builtin/index.ts`.

## Skill Tiers

| Tier | Enabled | Network | Use |
|------|---------|---------|-----|
| core | Yes | No | Safe local ops |
| enhanced | Yes | No | Sandboxed execution |
| network | No | Yes | Internet required |
| integration | No | Yes | External services |

## Key Patterns

**Lazy-loading discovery:** LLM calls `discover_skills` to find tools → tools added to conversation context for subsequent requests.

**Tool returns:** Always return `{ success: true, result }` or `{ success: false, error, hint }`.

**Storage (planned):** IndexedDB for conversations and memory. Currently in-memory for MVP.

## Decisions

Architecture decisions documented in `docs/architecture/adr-*.md`. Key ones:
- ADR-001: Vercel AI SDK for LLM abstraction
- ADR-002: IndexedDB + markdown for storage
- ADR-008: Tiered skills with lazy-loading
