# ADR-001: LLM SDK Selection

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Use Vercel AI SDK v6 as the primary LLM abstraction layer

## Context

We are building a multi-LLM cowork clone that needs to support:
- Anthropic Claude (via Pro subscription)
- Local LLMs via Ollama
- Potential future providers

We need an SDK that provides:
- Unified interface across providers
- Streaming support for responsive UI
- Good TypeScript support
- Active maintenance and community

## Options Considered

### Option 1: Vercel AI SDK

**Pros:**
- Streaming-first architecture
- Native Anthropic support (`@ai-sdk/anthropic`)
- Ollama support via community providers (`ai-sdk-ollama`)
- Built-in React hooks (`useChat`, `useCompletion`)
- Lightweight bundle size
- Excellent TypeScript support
- Active development (v6 released with agent support)
- Edge runtime compatible

**Cons:**
- Ollama support is community-maintained, not official
- Smaller ecosystem than LangChain for complex agent workflows

### Option 2: LangChain JS

**Pros:**
- 50+ LLM provider integrations
- Rich ecosystem for RAG and agents
- LangGraph for complex workflows
- Large community

**Cons:**
- Heavier bundle size (101.2 kB gzipped)
- More boilerplate required
- Blocks edge runtime deployment
- Steeper learning curve
- Can be over-abstracted for simple use cases

### Option 3: LiteLLM

**Pros:**
- 100+ provider support
- Simple unified API (OpenAI-compatible)
- Easy to get started

**Cons:**
- Python only (would require separate backend)
- Less suitable for streaming UI applications
- Limited as applications scale

### Option 4: Direct SDK Usage

**Pros:**
- Full control
- No abstraction overhead
- Direct access to provider-specific features

**Cons:**
- Must maintain separate code paths per provider
- More work to add new providers
- Duplicate streaming/error handling logic

## Decision

**We will use Vercel AI SDK v6** as our primary LLM abstraction layer.

### Packages

| Package | Purpose |
|---------|---------|
| `ai` | Core AI SDK |
| `@ai-sdk/anthropic` | Official Anthropic provider |
| `ai-sdk-ollama` | Community Ollama provider (v3+ for SDK v6) |

### Rationale

1. **Streaming-first** - Essential for a responsive cowork experience
2. **React integration** - Built-in hooks reduce boilerplate significantly
3. **Provider parity** - Both Anthropic and Ollama have compatible providers
4. **Modern architecture** - v6 supports agents, tool approval, and modern patterns
5. **Right-sized** - Not over-engineered for our use case (unlike LangChain)
6. **TypeScript** - Full type safety across the stack

## Consequences

### Positive
- Consistent API across Anthropic and Ollama
- Fast time-to-working-prototype
- Good developer experience with React hooks
- Future providers can be added via AI SDK provider interface

### Negative
- Dependent on community maintenance for Ollama provider
- May need to contribute fixes upstream if Ollama provider has issues
- If we need complex agent workflows later, may need to add LangGraph

### Mitigations
- Pin Ollama provider version to known-good release
- Abstract provider instantiation so we can swap implementations if needed
- Monitor `ai-sdk-ollama` repository for updates and breaking changes

## References

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [AI SDK v6 Release](https://vercel.com/blog/ai-sdk-6)
- [ai-sdk-ollama GitHub](https://github.com/jagreehal/ai-sdk-ollama)
- [@ai-sdk/anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Ollama Community Provider Docs](https://ai-sdk.dev/providers/community-providers/ollama)
