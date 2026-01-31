# Project Architecture Plan

**Status:** Draft
**Date:** 2025-01-31
**Dependencies:** All ADRs (001-007)

## Overview

This document defines the project structure, technology stack, and architectural patterns for claude-cowork-clone. It synthesizes decisions from all ADRs into a concrete implementation plan.

### Goals

1. **Clear Organization** - Intuitive project structure that scales
2. **Separation of Concerns** - Business logic isolated from UI framework
3. **Local-First Development** - Works immediately with Ollama, no external dependencies
4. **Testability** - Core logic testable without browser or React

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Vercel AI SDK integration, API routes, React Server Components |
| UI Library | React 19 | Required by assistant-ui, excellent DX |
| Language | TypeScript 5 | Type safety, better IDE support |
| Styling | Tailwind CSS 4 | Utility-first, shadcn/ui compatibility |
| Components | shadcn/ui + assistant-ui | Theming (ADR-003) + chat components |
| LLM SDK | Vercel AI SDK v6 | Provider abstraction (ADR-001) |
| Storage | IndexedDB (idb) | Browser-native, no server needed (ADR-002, ADR-004) |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |

---

## Project Structure

```
claude-cowork-clone/
├── docs/                         # Documentation (existing)
│   ├── architecture/             # ADRs
│   ├── user-stories/             # Epics and stories
│   ├── dev-plans/                # Implementation plans
│   └── api/                      # API specifications
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home/chat page
│   │   ├── globals.css           # Global styles + Tailwind
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   └── chat/
│   │   │       └── route.ts      # POST /api/chat
│   │   │
│   │   └── settings/
│   │       └── page.tsx          # Settings page
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── chat/                 # Chat interface components
│   │   ├── providers/            # Provider selection UI
│   │   └── memory/               # Memory viewer/editor
│   │
│   ├── lib/                      # Framework-agnostic logic
│   │   ├── providers/            # LLM provider implementations
│   │   ├── storage/              # IndexedDB operations
│   │   ├── context/              # Token/context management
│   │   ├── prompts/              # System prompt building
│   │   └── utils/                # Shared utilities
│   │
│   ├── hooks/                    # React hooks
│   │   ├── use-provider.ts
│   │   ├── use-memory.ts
│   │   └── use-conversations.ts
│   │
│   └── types/                    # TypeScript definitions
│       ├── provider.ts
│       ├── conversation.ts
│       └── memory.ts
│
├── tests/
│   ├── unit/                     # Vitest unit tests
│   ├── integration/              # Component integration tests
│   └── e2e/                      # Playwright E2E tests
│
├── public/                       # Static assets
├── .env.example                  # Environment template
├── .env.local                    # Local environment (git-ignored)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── components.json               # shadcn/ui configuration
```

---

## Architectural Layers

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Layer                                 │
│  src/app/                                                        │
│  - Next.js pages and API routes                                  │
│  - Server/client boundary                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Components Layer                             │
│  src/components/                                                 │
│  - React components (client-side)                                │
│  - Uses hooks for state                                          │
│  - Renders UI based on lib/ data                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       Hooks Layer                                │
│  src/hooks/                                                      │
│  - React state management                                        │
│  - Bridges components ↔ lib                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        Lib Layer                                 │
│  src/lib/                                                        │
│  - Framework-agnostic business logic                             │
│  - No React dependencies                                         │
│  - Testable in isolation                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rules

1. **App → Components** - Pages compose components
2. **Components → Hooks** - Components use hooks for state
3. **Hooks → Lib** - Hooks call lib functions
4. **Lib → Nothing** - Lib is self-contained (only external deps)

**Never:**
- Lib importing from components/hooks
- Components importing directly from lib (use hooks)
- Circular dependencies

---

## Key Modules

### 1. LLM Providers (`src/lib/providers/`)

Wraps Vercel AI SDK providers with our configuration.

```typescript
// src/lib/providers/index.ts
export interface ProviderRegistry {
  getProvider(id: string): LanguageModel;
  listProviders(): ProviderConfig[];
  testConnection(id: string): Promise<ConnectionResult>;
}

// src/lib/providers/anthropic.ts
export function createAnthropicProvider(config: AnthropicConfig): LanguageModel;

// src/lib/providers/ollama.ts
export function createOllamaProvider(config: OllamaConfig): LanguageModel;
```

### 2. Storage (`src/lib/storage/`)

IndexedDB operations for memory and conversations.

```typescript
// src/lib/storage/memory-store.ts
// Implements ADR-002: Markdown memory files
export class MemoryStore {
  getFile(name: string): Promise<string>;
  setFile(name: string, content: string): Promise<void>;
  exportAll(): Promise<Blob>;  // ZIP export
}

// src/lib/storage/conversation-store.ts
// Implements ADR-004: Conversation persistence
export class ConversationStore {
  list(): Promise<ConversationMeta[]>;
  get(id: string): Promise<Conversation>;
  save(conversation: Conversation): Promise<void>;
}
```

### 3. Context Management (`src/lib/context/`)

Token counting and context window management (ADR-005).

```typescript
// src/lib/context/sliding-window.ts
export function buildContext(
  messages: Message[],
  maxTokens: number
): ContextResult;

// src/lib/context/summarizer.ts
export function summarizeMessages(
  messages: Message[],
  model: LanguageModel
): Promise<string>;
```

### 4. System Prompts (`src/lib/prompts/`)

Modular prompt construction (ADR-006).

```typescript
// src/lib/prompts/builder.ts
export function buildSystemPrompt(
  basePrompt: string,
  personality: PersonalityConfig,
  context: ContextInfo
): string;
```

---

## API Routes

### POST /api/chat

Main chat endpoint following ADR-007.

```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai';
import { getProvider } from '@/lib/providers';
import { buildSystemPrompt } from '@/lib/prompts';
import { buildContext } from '@/lib/context';

export async function POST(req: Request) {
  const { messages, providerId, modelId, conversationId } = await req.json();

  const provider = getProvider(providerId);
  const model = provider.model(modelId);
  const systemPrompt = await buildSystemPrompt(/* ... */);
  const context = buildContext(messages, model.contextWindow);

  const result = await streamText({
    model,
    system: systemPrompt,
    messages: context.messages,
  });

  return result.toDataStreamResponse();
}
```

---

## Component Organization

### Chat Components (`src/components/chat/`)

```
chat/
├── chat-interface.tsx      # Main wrapper, uses AssistantRuntimeProvider
├── thread.tsx              # Message list (assistant-ui Thread)
├── composer.tsx            # Input area (assistant-ui Composer)
├── message.tsx             # Single message display
└── tool-ui/                # MCP tool renderers
    ├── index.tsx           # Tool UI registry
    └── code-block.tsx      # Code display component
```

### Provider Components (`src/components/providers/`)

```
providers/
├── provider-selector.tsx   # Dropdown to switch providers
├── model-selector.tsx      # Model selection within provider
├── connection-status.tsx   # Status indicator (connected/error)
└── ollama-setup.tsx        # Setup guide when Ollama not detected
```

### Memory Components (`src/components/memory/`)

```
memory/
├── memory-viewer.tsx       # View markdown memory files
├── memory-editor.tsx       # Edit memory (optional feature)
└── export-button.tsx       # Export/import controls
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "ai": "^4.1.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "ollama-ai-provider": "^1.2.0",

    "@assistant-ui/react": "^0.7.0",
    "@assistant-ui/react-ai-sdk": "^0.7.0",

    "idb": "^8.0.0",
    "jszip": "^3.10.0",

    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

---

## Testing Strategy

### Unit Tests (`tests/unit/`)

Test lib/ modules in isolation.

```typescript
// tests/unit/lib/context/sliding-window.test.ts
describe('buildContext', () => {
  it('includes recent messages within token limit', () => {});
  it('adds summary when messages exceed limit', () => {});
  it('always includes system prompt', () => {});
});
```

### Integration Tests (`tests/integration/`)

Test hooks and components together.

```typescript
// tests/integration/hooks/use-provider.test.tsx
describe('useProvider', () => {
  it('switches provider and persists selection', () => {});
  it('handles connection errors gracefully', () => {});
});
```

### E2E Tests (`tests/e2e/`)

Full user flows with Playwright.

```typescript
// tests/e2e/chat-flow.spec.ts
test('user can send message and receive response', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="composer-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');
  await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible();
});
```

---

## Implementation Phases

### Phase 1: Project Setup

1. Initialize Next.js 15 project with TypeScript
2. Configure Tailwind CSS and shadcn/ui
3. Set up directory structure
4. Configure ESLint, Prettier, Vitest

### Phase 2: Core Lib Layer

1. Implement provider registry (`lib/providers/`)
2. Implement storage layer (`lib/storage/`)
3. Add unit tests for lib modules

### Phase 3: Basic UI

1. Create layout with sidebar placeholder
2. Implement basic chat interface with assistant-ui
3. Connect to Ollama for local testing

### Phase 4: Full Integration

1. Add provider switching UI
2. Implement context management
3. Add conversation persistence
4. Complete E2E tests

---

## Related Documents

- [ADR-001: LLM SDK Selection](../architecture/adr-001-llm-sdk-selection.md)
- [ADR-002: Markdown Memory Storage](../architecture/adr-002-markdown-memory-storage.md)
- [ADR-003: Chat UI Library](../architecture/adr-003-chat-ui-library.md)
- [ADR-004: Conversation Storage](../architecture/adr-004-conversation-storage.md)
- [ADR-005: Context Management](../architecture/adr-005-context-management.md)
- [ADR-006: System Prompts](../architecture/adr-006-system-prompts.md)
- [ADR-007: API Schema](../architecture/adr-007-api-schema.md)
- [LLM Provider Integration Plan](./llm-provider-integration.md)
