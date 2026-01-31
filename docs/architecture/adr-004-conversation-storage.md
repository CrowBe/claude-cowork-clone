# ADR-004: Conversation History Storage

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Store conversations in separate IndexedDB database as JSON

## Context

We need to persist chat conversations locally. Key requirements:
- Separate from memory system (prompts.md, preferences.md)
- Support multiple conversations
- Include in data export for portability
- Work with assistant-ui and Vercel AI SDK message format

## Decision

**Separate IndexedDB database storing conversations as JSON.**

### Schema

```typescript
interface Conversation {
  id: string;                    // UUID
  title: string;                 // Auto-generated or user-set
  messages: Message[];           // Vercel AI SDK message format
  providerId: string;            // 'anthropic' | 'ollama'
  modelId: string;               // Model used
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  toolInvocations?: ToolInvocation[];  // For tool calls
}
```

### Storage Architecture

```
IndexedDB
├── claude-cowork-memory (MemoryStore - ADR-002)
│   └── files: prompts.md, preferences.md, usage-stats.md
│
└── claude-cowork-conversations (ConversationStore - NEW)
    └── conversations: Conversation[]
```

### Why Separate from MemoryStore?

| Aspect | Memory (Markdown) | Conversations (JSON) |
|--------|-------------------|----------------------|
| Format | Human-readable markdown | Structured JSON |
| Purpose | Learned preferences, patterns | Chat history |
| Size | Small (~KB) | Large (~MB over time) |
| Edit by user | Yes (transparency goal) | Rarely needed |
| AI SDK compat | N/A | Native Message format |

### Export Integration

Conversations included in .zip export:
```
export.zip
├── prompts.md
├── preferences.md
├── usage-stats.md
└── conversations/
    ├── conv-abc123.json
    └── conv-def456.json
```

### Retention Policy

- **Default:** Keep all conversations
- **Future:** User-configurable auto-delete (30/90/365 days)
- **Manual:** Delete individual conversations or clear all

## Alternatives Considered

1. **Markdown conversations** - Human-readable but loses structure for tool calls
2. **Single unified DB** - Simpler but conflates different data patterns
3. **TOON format** - Only ~1-2% token savings on chat; not worth complexity

## Consequences

**Positive:**
- Clean separation of concerns
- Native compatibility with AI SDK message format
- Efficient queries (by date, search)
- Portable via JSON export

**Negative:**
- Two IndexedDB databases to manage
- Conversations not human-editable like memory files

## References

- [ADR-002: Markdown Memory Storage](./adr-002-markdown-memory-storage.md)
- [Vercel AI SDK Message Format](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
