# API Documentation

This directory contains API specifications and integration documentation.

## Contents

- **LLM Provider Interface** - Vercel AI SDK provider configuration
- **Memory Store Interface** - Storage abstraction for memory files
- **Internal APIs** - Application internal APIs

## LLM Provider Interface

We use [Vercel AI SDK v6](https://ai-sdk.dev/docs/introduction) for LLM abstraction. See [ADR-001](../architecture/adr-001-llm-sdk-selection.md) for the decision rationale.

### Supported Providers

| Provider | Package | Use Case |
|----------|---------|----------|
| Anthropic Claude | `@ai-sdk/anthropic` | Cloud LLM via Pro subscription |
| Ollama | `ai-sdk-ollama` | Local LLM inference |

### Usage Pattern

```typescript
import { generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ollama } from 'ai-sdk-ollama';

// Select provider based on user preference
const model = useLocalLLM
  ? ollama('llama3.2')
  : anthropic('claude-3-5-sonnet-20241022');

// Streaming response (recommended for chat UI)
const result = await streamText({
  model,
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

// React hook usage
import { useChat } from 'ai/react';

function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });
  // ...
}
```

### Provider Configuration

```typescript
// Anthropic (requires API key)
const anthropicProvider = anthropic('claude-3-5-sonnet-20241022', {
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Ollama (local, no API key needed)
const ollamaProvider = ollama('llama3.2', {
  baseURL: 'http://localhost:11434', // default Ollama URL
});
```

## Memory Store Interface

Abstraction layer for memory storage. See [ADR-002](../architecture/adr-002-markdown-memory-storage.md) for the decision rationale.

### Interface Definition

```typescript
interface MemoryStore {
  // Read a memory file (returns markdown string)
  read(filename: string): Promise<string>;

  // Write a memory file (markdown string)
  write(filename: string, content: string): Promise<void>;

  // Check if file exists
  exists(filename: string): Promise<boolean>;

  // List all memory files
  list(): Promise<string[]>;

  // Export all files as zip blob
  exportAll(): Promise<Blob>;

  // Import from zip file
  importAll(file: File): Promise<void>;
}
```

### Implementations

| Implementation | Use Case | Status |
|----------------|----------|--------|
| `IndexedDBStore` | Web browser storage | MVP |
| `LocalFileStore` | Desktop app (Electron/Tauri) | Future |
| `GoogleDriveStore` | Cloud sync option | V2 |
| `OneDriveStore` | Cloud sync option | V2 |

### Memory Files

| File | Purpose |
|------|---------|
| `prompts.md` | Recent prompts, pinned prompts |
| `preferences.md` | User settings, learned patterns |
| `usage-stats.md` | Prompt frequency, category breakdown |

### Example: IndexedDBStore

```typescript
class IndexedDBStore implements MemoryStore {
  private dbName = 'claude-cowork-memory';
  private storeName = 'files';

  async read(filename: string): Promise<string> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const result = await store.get(filename);
    return result?.content ?? '';
  }

  async write(filename: string, content: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await store.put({ filename, content, updatedAt: new Date() });
  }

  async exportAll(): Promise<Blob> {
    // Use JSZip or similar to create .zip from all files
    const files = await this.list();
    const zip = new JSZip();
    for (const file of files) {
      const content = await this.read(file);
      zip.file(file, content);
    }
    return zip.generateAsync({ type: 'blob' });
  }

  // ... other methods
}
```

## Related Documentation

- [ADR-001: LLM SDK Selection](../architecture/adr-001-llm-sdk-selection.md)
- [ADR-002: Markdown Memory Storage](../architecture/adr-002-markdown-memory-storage.md)
- [User Stories](../user-stories/) - Feature requirements
