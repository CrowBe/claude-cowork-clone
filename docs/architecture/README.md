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

## Key Architectural Goals

1. **Provider Agnostic** - Abstract LLM providers behind a unified interface
2. **Extensible** - Easy to add new LLM backends
3. **Local-First Option** - Full functionality without cloud dependencies (via Ollama)
4. **Modular** - Components can be developed and tested independently
