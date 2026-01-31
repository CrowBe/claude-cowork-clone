# ADR-008: Project Structure and Local Development

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Next.js App Router with modular feature-based architecture

## Context

We need to define:
- Project directory structure
- Technology choices for framework and tooling
- Local development setup and workflow
- Developer experience priorities

This decision synthesizes prior ADRs into a concrete project structure.

## Decision

### Framework: Next.js 15 with App Router

**Rationale:**
- Native Vercel AI SDK integration (ADR-001)
- API Routes for `/api/chat` endpoint (ADR-007)
- React Server Components for performance
- Built-in TypeScript support
- Excellent developer experience with Fast Refresh

### Project Structure

```
claude-cowork-clone/
├── .env.local                    # Local environment variables (git-ignored)
├── .env.example                  # Template for environment setup
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── components.json               # shadcn/ui config
│
├── docs/                         # Documentation (existing)
│   ├── architecture/             # ADRs
│   ├── user-stories/             # Epics and stories
│   └── dev-plans/                # Implementation plans
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home/chat page
│   │   ├── globals.css           # Global styles + Tailwind
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   └── chat/
│   │   │       └── route.ts      # POST /api/chat (ADR-007)
│   │   │
│   │   └── settings/             # Settings page
│   │       └── page.tsx
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── chat/                 # Chat-specific components
│   │   │   ├── chat-interface.tsx    # Main chat wrapper
│   │   │   ├── message-list.tsx      # assistant-ui Thread
│   │   │   ├── composer.tsx          # Input area
│   │   │   └── tool-ui.tsx           # MCP Apps renderer
│   │   │
│   │   ├── providers/            # Provider selector UI
│   │   │   ├── provider-selector.tsx
│   │   │   └── model-selector.tsx
│   │   │
│   │   └── memory/               # Memory transparency UI
│   │       ├── memory-viewer.tsx
│   │       └── export-import.tsx
│   │
│   ├── lib/                      # Core libraries
│   │   ├── providers/            # LLM Provider implementations
│   │   │   ├── index.ts          # Provider registry
│   │   │   ├── anthropic.ts      # Anthropic provider setup
│   │   │   ├── ollama.ts         # Ollama provider setup
│   │   │   └── types.ts          # Provider interfaces
│   │   │
│   │   ├── storage/              # Browser storage (ADR-002, ADR-004)
│   │   │   ├── memory-store.ts   # IndexedDB for markdown memory
│   │   │   ├── conversation-store.ts  # IndexedDB for conversations
│   │   │   ├── export.ts         # Export/import utilities
│   │   │   └── types.ts
│   │   │
│   │   ├── context/              # Context management (ADR-005)
│   │   │   ├── token-counter.ts
│   │   │   ├── sliding-window.ts
│   │   │   └── summarizer.ts
│   │   │
│   │   ├── prompts/              # System prompts (ADR-006)
│   │   │   ├── base-prompt.ts
│   │   │   ├── personality.ts
│   │   │   └── builder.ts
│   │   │
│   │   └── utils/                # Shared utilities
│   │       ├── errors.ts         # Error handling (ADR-007)
│   │       └── formatting.ts
│   │
│   ├── hooks/                    # React hooks
│   │   ├── use-provider.ts       # Provider selection state
│   │   ├── use-memory.ts         # Memory store access
│   │   └── use-conversations.ts  # Conversation management
│   │
│   └── types/                    # TypeScript types
│       ├── provider.ts
│       ├── conversation.ts
│       └── memory.ts
│
├── public/                       # Static assets
│   └── icons/
│
└── tests/                        # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

### Key Architectural Decisions

#### 1. Feature-Based Organization

Components are grouped by feature domain (`chat/`, `providers/`, `memory/`) rather than by type. This keeps related code together and makes the codebase navigable.

#### 2. Lib Layer Separation

The `lib/` directory contains framework-agnostic business logic:
- **providers/** - LLM provider abstraction (could work without React)
- **storage/** - IndexedDB operations (browser-specific but not React)
- **context/** - Token management algorithms
- **prompts/** - System prompt construction

This separation enables:
- Easier testing (no React dependencies in core logic)
- Potential reuse in different contexts
- Clear dependency direction (components → lib, never lib → components)

#### 3. API Routes Structure

Single `/api/chat` route handles all LLM interactions:
- Provider selection via request body
- Streaming response via Vercel AI SDK
- Error handling per ADR-007

### Package Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",

    "ai": "^6.x",
    "@ai-sdk/anthropic": "^1.x",
    "ai-sdk-ollama": "^3.x",

    "@assistant-ui/react": "^0.11.x",
    "@assistant-ui/react-ai-sdk": "^0.11.x",
    "@mcp-ui/client": "^1.x",

    "idb": "^8.x",
    "jszip": "^3.x",

    "tailwindcss": "^4.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "vitest": "^3.x",
    "playwright": "^1.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

## Local Development

### Prerequisites

1. **Node.js 22+** - Required for Next.js 15
2. **pnpm** (recommended) or npm
3. **Ollama** - For local LLM testing
4. **Anthropic API Key** - For Claude (optional for local-only dev)

### Environment Setup

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...     # Optional: only needed for Claude
OLLAMA_BASE_URL=http://localhost:11434  # Default Ollama URL
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev                # Runs on http://localhost:3000

# Start Ollama (separate terminal)
ollama serve
ollama pull llama3.2    # Download a model

# Run tests
pnpm test               # Unit tests with Vitest
pnpm test:e2e          # E2E tests with Playwright

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Build for production
pnpm build
```

### Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Terminal 1:  pnpm dev         → Next.js dev server         │
│  Terminal 2:  ollama serve     → Local LLM server           │
│  Browser:     localhost:3000   → App with hot reload        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Provider Options                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Ollama (local):     Works without API key                  │
│                      Uses localhost:11434                    │
│                      Models: llama3.2, mistral, etc.        │
│                                                              │
│  Anthropic (cloud):  Requires ANTHROPIC_API_KEY             │
│                      Uses api.anthropic.com                  │
│                      Models: claude-3.5-sonnet, etc.        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Hot Reload Behavior

| Change Type | Reload Behavior |
|-------------|-----------------|
| React components | Fast Refresh (preserves state) |
| API routes | Full page reload |
| `lib/` changes | Fast Refresh (if imported by component) |
| Tailwind classes | Instant update |
| Environment variables | Requires server restart |

### Browser DevTools

IndexedDB data is viewable in browser DevTools:
- **Chrome**: DevTools → Application → IndexedDB
- **Firefox**: DevTools → Storage → IndexedDB

Databases:
- `claude-cowork-memory` - Markdown files (prompts, preferences)
- `claude-cowork-conversations` - Chat history

### Testing Strategy

```
tests/
├── unit/                         # Vitest
│   ├── lib/providers/            # Provider logic
│   ├── lib/storage/              # Storage operations
│   └── lib/context/              # Context management
│
├── integration/                  # Vitest with happy-dom
│   ├── components/               # React component tests
│   └── hooks/                    # Hook tests
│
└── e2e/                          # Playwright
    ├── chat.spec.ts              # Chat flow tests
    ├── provider-switch.spec.ts   # Provider switching
    └── memory-export.spec.ts     # Export/import flow
```

### Local-First Development Priorities

1. **Ollama as default** - Works without any API keys
2. **IndexedDB persistence** - Data persists across page reloads
3. **No external dependencies** - No database, no auth required
4. **Graceful degradation** - App works even if Ollama is down

## Consequences

### Positive

- Clear separation of concerns
- Easy to navigate codebase
- Local-first development (Ollama)
- Fast iteration with Next.js Fast Refresh
- Core logic testable without React

### Negative

- Slightly deeper nesting than flat structures
- Must maintain directory conventions
- Next.js-specific patterns may not transfer to other frameworks

### Mitigations

- Document structure in this ADR
- Use index files for clean imports
- Keep feature modules self-contained

## Related Decisions

- [ADR-001: LLM SDK Selection](./adr-001-llm-sdk-selection.md)
- [ADR-002: Markdown Memory Storage](./adr-002-markdown-memory-storage.md)
- [ADR-003: Chat UI Library](./adr-003-chat-ui-library.md)
- [ADR-004: Conversation Storage](./adr-004-conversation-storage.md)
- [ADR-007: API Schema](./adr-007-api-schema.md)

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel AI SDK](https://ai-sdk.dev)
- [assistant-ui](https://www.assistant-ui.com)
- [Ollama](https://ollama.ai)
- [shadcn/ui](https://ui.shadcn.com)
