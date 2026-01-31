# ADR-005: Context Management

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Sliding window with summarization for long conversations

## Context

LLMs have finite context windows. We need a strategy for:
- Managing token limits within a conversation
- Optionally carrying context across sessions
- Balancing context size vs. response quality

## Decision

### Token Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Window                            │
├─────────────────────────────────────────────────────────────┤
│  System Prompt        │  ~500 tokens (fixed)                │
│  Memory Context       │  ~500 tokens (from preferences.md)  │
│  Conversation History │  Remaining tokens (sliding window)  │
└─────────────────────────────────────────────────────────────┘
```

### Model Context Budgets

| Provider | Model | Context | Reserved | Available for Chat |
|----------|-------|---------|----------|-------------------|
| Anthropic | Claude 3.5 Sonnet | 200K | 2K | ~198K |
| Anthropic | Claude 3 Haiku | 200K | 2K | ~198K |
| Ollama | Llama 3.2 | 128K | 2K | ~126K |
| Ollama | Llama 3.2:1b | 8K | 1K | ~7K |

### Sliding Window Implementation

```typescript
interface ContextConfig {
  maxTokens: number;           // Model's context limit
  reservedForSystem: number;   // System prompt + memory
  reservedForResponse: number; // Leave room for response (~4K)
  summarizeThreshold: number;  // When to summarize (80% full)
}

// When conversation exceeds threshold:
// 1. Keep system prompt + memory context
// 2. Keep last N messages verbatim
// 3. Summarize older messages into a "conversation so far" block
```

### Cross-Session Context (Future)

MVP: Each conversation starts fresh.

Future enhancement:
- "Continue from previous" option
- Inject summary of past conversation
- User controls what context carries over

## Consequences

**Positive:**
- Works within any model's limits
- Graceful degradation for small-context models
- User never hits hard failures

**Negative:**
- Summarization loses some detail
- Requires token counting (use tiktoken or provider estimates)

## References

- [Vercel AI SDK Token Management](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
