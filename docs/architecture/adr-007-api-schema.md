# ADR-007: API Response Schema

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Follow Vercel AI SDK conventions with standardized error format

## Context

We need consistent API contracts for:
- Chat endpoint (`/api/chat`)
- Error responses
- Streaming protocol

## Decision

### Chat Endpoint

**Request:**
```typescript
POST /api/chat
Content-Type: application/json

{
  "messages": Message[],
  "conversationId"?: string,    // Optional: continue existing
  "providerId"?: string,        // Override default provider
  "modelId"?: string            // Override default model
}
```

**Response:** Vercel AI SDK Data Stream (SSE)

```typescript
// Streaming response via AI SDK's toDataStreamResponse()
// Client consumes via useChat() hook - no custom parsing needed
```

### Error Response Format

```typescript
interface APIError {
  error: {
    code: string;           // Machine-readable: 'PROVIDER_UNAVAILABLE'
    message: string;        // Human-readable: 'Ollama is not running'
    details?: {
      provider?: string;
      statusCode?: number;
      retryAfter?: number;  // Seconds (for rate limits)
    };
  };
}
```

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `PROVIDER_UNAVAILABLE` | 503 | Provider not reachable |
| `INVALID_API_KEY` | 401 | Bad or missing API key |
| `RATE_LIMITED` | 429 | Too many requests |
| `CONTEXT_TOO_LONG` | 400 | Message exceeds context |
| `MODEL_NOT_FOUND` | 404 | Requested model unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Streaming Error Handling

Errors during stream use AI SDK's error stream part:
```typescript
// Server
return result.toDataStreamResponse({
  onError: (error) => {
    // Transform to our error format
    return JSON.stringify({ code: 'STREAM_ERROR', message: error.message });
  }
});

// Client (assistant-ui handles this automatically)
```

## Consequences

**Positive:**
- Native AI SDK compatibility
- assistant-ui handles streaming automatically
- Consistent error handling across providers

**Negative:**
- Tied to AI SDK streaming format
- Custom endpoints need manual stream handling

## References

- [AI SDK Streaming](https://ai-sdk.dev/docs/ai-sdk-ui/streaming)
- [AI SDK Error Handling](https://ai-sdk.dev/docs/ai-sdk-ui/error-handling)
