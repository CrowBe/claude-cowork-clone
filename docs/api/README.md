# API Documentation

This directory contains API specifications and integration documentation.

## Contents

- **LLM Provider Interface** - Common interface all LLM backends must implement
- **Internal APIs** - Application internal APIs
- **External Integrations** - Third-party API usage documentation

## LLM Provider Interface (Draft)

Each LLM provider must implement:

```
interface LLMProvider {
  // Initialize the provider with configuration
  initialize(config: ProviderConfig): Promise<void>

  // Send a message and get a response
  chat(messages: Message[]): Promise<Response>

  // Stream a response
  streamChat(messages: Message[]): AsyncIterator<ResponseChunk>

  // Check if the provider is available
  isAvailable(): Promise<boolean>

  // Get provider metadata
  getInfo(): ProviderInfo
}
```

*Full specification TBD*
