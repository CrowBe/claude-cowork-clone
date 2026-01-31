# LLM Provider Integration Plan

**Status:** Draft
**Date:** 2025-01-31
**Epic:** LLM Provider Integration
**Dependencies:** ADR-001 (Vercel AI SDK Selection)

## Overview

This plan outlines the implementation strategy for integrating multiple LLM providers into the application, supporting both cloud-based (Claude Pro) and local (Ollama) inference options.

### Goals

1. **Provider Flexibility** - Users can choose between Claude Pro subscription or local Ollama
2. **Seamless Switching** - Easy provider switching without losing context
3. **Local-First Default** - Ollama as the recommended default for privacy
4. **Zero Configuration Start** - Works out-of-box with Ollama (no API keys required)
5. **Graceful Degradation** - Clear error handling when providers are unavailable

---

## Architecture

### Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│           (Chat UI, Prompt Suggestions, etc.)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LLM Service Layer                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              LLMProviderService                          │    │
│  │  - getActiveProvider(): Provider                         │    │
│  │  - setActiveProvider(id: string): void                   │    │
│  │  - listProviders(): ProviderConfig[]                     │    │
│  │  - testConnection(id: string): Promise<boolean>          │    │
│  │  - chat(messages): Promise<StreamResult>                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Vercel AI SDK v6 Layer                           │
│  ┌────────────────────┐    ┌────────────────────────────────┐   │
│  │ @ai-sdk/anthropic  │    │      ai-sdk-ollama             │   │
│  │                    │    │                                │   │
│  │ Claude 3.5 Sonnet  │    │  Llama 3.2, Mistral, etc.     │   │
│  │ Claude 3 Opus      │    │  (any Ollama-supported model) │   │
│  │ Claude 3 Haiku     │    │                                │   │
│  └────────┬───────────┘    └───────────────┬────────────────┘   │
└───────────┼────────────────────────────────┼────────────────────┘
            │                                │
            ▼                                ▼
    ┌───────────────┐              ┌─────────────────┐
    │  Anthropic    │              │    Ollama       │
    │  API (Cloud)  │              │ (localhost:11434)│
    └───────────────┘              └─────────────────┘
```

### Core Interfaces

```typescript
// Provider configuration
interface ProviderConfig {
  id: string;                      // 'anthropic' | 'ollama'
  name: string;                    // Display name
  description: string;             // User-facing description
  type: 'cloud' | 'local';
  requiresApiKey: boolean;
  models: ModelConfig[];
  defaultModel: string;
  status: 'available' | 'unavailable' | 'unconfigured';
}

interface ModelConfig {
  id: string;                      // 'claude-3-5-sonnet-20241022'
  name: string;                    // 'Claude 3.5 Sonnet'
  description: string;
  contextWindow: number;
  capabilities: string[];          // ['chat', 'vision', 'tools']
}

// User's provider settings (stored in preferences.md)
interface ProviderSettings {
  activeProvider: string;          // 'anthropic' | 'ollama'
  activeModel: string;             // Current model ID
  anthropic: {
    apiKey?: string;               // Encrypted or from env
    model: string;
  };
  ollama: {
    baseURL: string;               // Default: http://localhost:11434
    model: string;
  };
}

// Provider service interface
interface ILLMProviderService {
  getActiveProvider(): ProviderConfig;
  setActiveProvider(id: string, model?: string): Promise<void>;
  listProviders(): ProviderConfig[];
  testConnection(providerId: string): Promise<ConnectionTestResult>;
  chat(messages: Message[], options?: ChatOptions): Promise<StreamableResult>;
  getAvailableModels(providerId: string): Promise<ModelConfig[]>;
}

interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
  modelInfo?: {
    name: string;
    version: string;
  };
}
```

---

## Provider Implementations

### 1. Anthropic Claude (Cloud)

**Package:** `@ai-sdk/anthropic`

#### Supported Models

| Model ID | Name | Context | Best For |
|----------|------|---------|----------|
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | 200K | General use (recommended) |
| `claude-3-opus-20240229` | Claude 3 Opus | 200K | Complex reasoning |
| `claude-3-haiku-20240307` | Claude 3 Haiku | 200K | Fast, simple tasks |

#### Configuration

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const createAnthropicProvider = (settings: AnthropicSettings) => {
  return anthropic(settings.model, {
    apiKey: settings.apiKey,
    // Optional: custom headers, baseURL for proxies
  });
};
```

#### API Key Management

```typescript
// API key sources (in priority order)
const getAnthropicApiKey = (): string | undefined => {
  // 1. User-configured (stored encrypted in IndexedDB)
  const stored = await secureStorage.get('anthropic_api_key');
  if (stored) return stored;

  // 2. Environment variable (for development/self-hosted)
  if (typeof process !== 'undefined') {
    return process.env.ANTHROPIC_API_KEY;
  }

  return undefined;
};
```

#### Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| `401 Unauthorized` | Invalid API key | "Your Claude API key is invalid. Please check your settings." |
| `429 Rate Limited` | Too many requests | "Rate limit reached. Please wait a moment and try again." |
| `402 Payment Required` | Billing issue | "Your Claude subscription may have expired. Check your Anthropic account." |
| `500+ Server Error` | Anthropic outage | "Claude is temporarily unavailable. Try switching to local Ollama." |

---

### 2. Ollama (Local)

**Package:** `ai-sdk-ollama` (v3+ for Vercel AI SDK v6 compatibility)

#### Recommended Models

| Model | Size | RAM Needed | Best For |
|-------|------|------------|----------|
| `llama3.2` | 3B | 4GB | Default - fast, capable |
| `llama3.2:1b` | 1B | 2GB | Resource-constrained systems |
| `mistral` | 7B | 8GB | Strong reasoning |
| `codellama` | 7B | 8GB | Code-focused tasks |
| `phi3` | 3.8B | 4GB | Microsoft's compact model |

#### Configuration

```typescript
import { ollama } from 'ai-sdk-ollama';

const createOllamaProvider = (settings: OllamaSettings) => {
  return ollama(settings.model, {
    baseURL: settings.baseURL || 'http://localhost:11434',
  });
};
```

#### Connection Detection

```typescript
// Check if Ollama is running and accessible
const checkOllamaConnection = async (baseURL: string): Promise<ConnectionTestResult> => {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return { success: false, error: 'Ollama not responding' };
    }

    const data = await response.json();
    return {
      success: true,
      modelInfo: {
        name: 'Ollama',
        version: data.models?.length ? `${data.models.length} models available` : 'No models',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
};

// Get available models from Ollama
const getOllamaModels = async (baseURL: string): Promise<ModelConfig[]> => {
  const response = await fetch(`${baseURL}/api/tags`);
  const data = await response.json();

  return data.models.map((model: any) => ({
    id: model.name,
    name: model.name,
    description: `${(model.size / 1e9).toFixed(1)}GB - ${model.details?.family || 'Unknown family'}`,
    contextWindow: model.details?.context_length || 4096,
    capabilities: ['chat'],
  }));
};
```

#### Ollama Not Running Guidance

When Ollama is not detected, display helpful setup instructions:

```markdown
## Ollama Not Detected

Ollama enables local AI inference without sending data to the cloud.

### Quick Setup

1. **Install Ollama**
   - macOS: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download from [ollama.ai](https://ollama.ai)

2. **Start Ollama**
   ```bash
   ollama serve
   ```

3. **Pull a model**
   ```bash
   ollama pull llama3.2
   ```

4. **Refresh this page** to detect Ollama

[Learn more about Ollama](https://ollama.ai)
```

---

## Provider Selection UI

### Settings Panel Design

```
┌─────────────────────────────────────────────────────────────────┐
│  LLM Provider Settings                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ◉ Ollama (Local)                              [Connected ✓]    │
│    Your data stays on your computer                              │
│    Model: [llama3.2          ▼]                                  │
│    Base URL: [http://localhost:11434]                            │
│                                                                  │
│  ○ Claude (Cloud)                             [Not configured]  │
│    Anthropic's Claude via Pro subscription                       │
│    Model: [claude-3-5-sonnet ▼]                                  │
│    API Key: [••••••••••••••••] [Test Connection]                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Save Settings]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Provider Status Indicators

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Connected | ✓ | Green | Provider is working |
| Unconfigured | ⚙ | Gray | Needs setup (API key) |
| Unavailable | ✗ | Red | Cannot connect |
| Testing | ○ | Yellow | Connection test in progress |

---

## Implementation Phases

### Phase 1: Core Provider Service

**Goal:** Create the foundational provider abstraction

**Tasks:**
1. Create `LLMProviderService` class
2. Implement provider configuration types
3. Add Anthropic provider wrapper
4. Add Ollama provider wrapper
5. Implement provider switching logic
6. Add connection testing functionality

**Files to create:**
```
src/
├── services/
│   └── llm/
│       ├── index.ts                 # Public exports
│       ├── types.ts                 # TypeScript interfaces
│       ├── provider-service.ts      # Main service class
│       ├── providers/
│       │   ├── anthropic.ts         # Anthropic provider
│       │   └── ollama.ts            # Ollama provider
│       └── utils/
│           └── connection-test.ts   # Connection testing utilities
```

### Phase 2: Settings Persistence

**Goal:** Save and load provider preferences

**Tasks:**
1. Integrate with MemoryStore for preferences
2. Implement secure API key storage
3. Add settings migration for updates
4. Create settings validation

**Settings storage format (preferences.md):**
```markdown
# User Preferences

## LLM Provider Settings

```yaml
activeProvider: ollama
activeModel: llama3.2

providers:
  ollama:
    baseURL: http://localhost:11434
    model: llama3.2
  anthropic:
    model: claude-3-5-sonnet-20241022
    # API key stored separately in secure storage
```
```

### Phase 3: Settings UI

**Goal:** User-friendly provider configuration

**Tasks:**
1. Create ProviderSettings React component
2. Add model selection dropdowns
3. Implement connection test UI
4. Add Ollama setup instructions
5. Add API key input with show/hide

**Components:**
```
src/
├── components/
│   └── settings/
│       ├── ProviderSettings.tsx     # Main settings panel
│       ├── ProviderCard.tsx         # Individual provider card
│       ├── ModelSelector.tsx        # Model dropdown
│       ├── ConnectionStatus.tsx     # Status indicator
│       └── OllamaSetupGuide.tsx     # Setup instructions
```

### Phase 4: Chat Integration

**Goal:** Connect providers to chat UI

**Tasks:**
1. Create `/api/chat` route handler
2. Integrate with useChat hook
3. Add streaming response handling
4. Implement error display in chat
5. Add provider indicator in chat header

**API Route:**
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { LLMProviderService } from '@/services/llm';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const providerService = new LLMProviderService();

  const model = await providerService.getActiveModel();

  const result = await streamText({
    model,
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

## Security Considerations

### API Key Storage

1. **Never store API keys in plain text**
2. **Use Web Crypto API for encryption** at rest
3. **Clear keys from memory** after use
4. **Provide clear key revocation** UI

```typescript
// Secure storage wrapper
class SecureStorage {
  private encryptionKey: CryptoKey | null = null;

  async setApiKey(provider: string, key: string): Promise<void> {
    const encrypted = await this.encrypt(key);
    await indexedDB.put('secure_keys', { provider, encrypted });
  }

  async getApiKey(provider: string): Promise<string | null> {
    const record = await indexedDB.get('secure_keys', provider);
    if (!record) return null;
    return this.decrypt(record.encrypted);
  }

  async clearApiKey(provider: string): Promise<void> {
    await indexedDB.delete('secure_keys', provider);
  }
}
```

### Network Security

1. **Ollama:** Local only by default (localhost)
2. **Anthropic:** HTTPS only, validate SSL
3. **No proxy support initially** (simplifies security model)

---

## Error Handling Strategy

### Provider Fallback

```typescript
const executeWithFallback = async (
  messages: Message[],
  primaryProvider: string,
  fallbackProvider?: string
): Promise<StreamResult> => {
  try {
    return await chat(messages, primaryProvider);
  } catch (error) {
    if (fallbackProvider && isRecoverableError(error)) {
      console.warn(`Primary provider failed, trying fallback: ${fallbackProvider}`);
      return await chat(messages, fallbackProvider);
    }
    throw error;
  }
};
```

### User-Facing Error Messages

| Scenario | Message | Action |
|----------|---------|--------|
| No provider configured | "Please set up an LLM provider in Settings" | Link to settings |
| Ollama not running | "Ollama is not running. Start it or switch to Claude." | Show setup guide |
| Invalid API key | "Your Claude API key is invalid" | Link to settings |
| Rate limited | "Rate limit reached. Try again in a moment." | Auto-retry with backoff |
| Network error | "Connection failed. Check your internet." | Retry button |

---

## Testing Plan

### Unit Tests

```typescript
describe('LLMProviderService', () => {
  it('should list all configured providers', () => {});
  it('should switch between providers', () => {});
  it('should validate API keys', () => {});
  it('should detect Ollama connection', () => {});
  it('should handle provider errors gracefully', () => {});
});
```

### Integration Tests

1. **Ollama Integration**
   - Start Ollama in test container
   - Verify model listing
   - Test chat completion

2. **Anthropic Integration**
   - Use mock API server
   - Test streaming responses
   - Verify error handling

### Manual Testing Checklist

- [ ] Fresh install with no configuration
- [ ] Ollama setup from scratch
- [ ] Claude API key configuration
- [ ] Provider switching mid-conversation
- [ ] Offline behavior (Ollama only)
- [ ] Error recovery scenarios

---

## Future Enhancements

### Potential Additional Providers

| Provider | Package | Priority | Notes |
|----------|---------|----------|-------|
| OpenAI | `@ai-sdk/openai` | Medium | Popular alternative |
| Google Gemini | `@ai-sdk/google` | Medium | Good free tier |
| Groq | `ai-sdk-groq` | Low | Fast inference |
| Together AI | Community | Low | Many open models |

### Advanced Features

1. **Provider Comparison Mode** - Run same prompt on multiple providers
2. **Cost Tracking** - Track API usage and costs
3. **Model Benchmarking** - Compare response quality/speed
4. **Custom Provider** - User-defined OpenAI-compatible endpoints

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "ai": "^4.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "ai-sdk-ollama": "^3.0.0"
  }
}
```

### Peer Dependencies

- React 18+
- Next.js 14+ (for API routes)

---

## References

- [ADR-001: LLM SDK Selection](../architecture/adr-001-llm-sdk-selection.md)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Ollama Documentation](https://ollama.ai/docs)
- [ai-sdk-ollama GitHub](https://github.com/jagreehal/ai-sdk-ollama)
