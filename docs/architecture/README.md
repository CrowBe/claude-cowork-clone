# Architecture

This directory contains architectural decisions, system design documents, and technical specifications.

## Contents

- **ADRs** - Architecture Decision Records
- **System Design** - High-level system diagrams and component descriptions
- **Integration Guides** - How components interact

## Architecture Decision Records (ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](./adr-001-llm-sdk-selection.md) | LLM SDK Selection (Vercel AI SDK) | Approved |
| [ADR-002](./adr-002-markdown-memory-storage.md) | Markdown Memory Storage (IndexedDB + Export) | Approved |
| [ADR-003](./adr-003-chat-ui-library.md) | Chat UI Library (assistant-ui + MCP Apps) | Approved |
| [ADR-004](./adr-004-conversation-storage.md) | Conversation History Storage (JSON/IndexedDB) | Approved |
| [ADR-005](./adr-005-context-management.md) | Context Management (Sliding Window) | Approved |
| [ADR-006](./adr-006-system-prompts.md) | System Prompts and AI Personality | Approved |
| [ADR-007](./adr-007-api-schema.md) | API Response Schema | Approved |

## Key Architectural Goals

1. **Local-First** - Maximize user control and privacy through local LLMs (Ollama) and local storage (IndexedDB)
2. **Provider Agnostic** - Abstract LLM providers behind a unified interface (Vercel AI SDK)
3. **Extensible** - Easy to add new LLM backends and storage backends
4. **Transparent** - User data stored in human-readable formats (markdown)
5. **Portable** - No vendor lock-in; data exports as standard files
