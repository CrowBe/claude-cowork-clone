# Documentation

This directory contains project documentation, planning materials, and specifications.

## Contents

- [User Stories](./user-stories/) - Feature requirements from a user perspective
- [Development Plans](./dev-plans/) - Technical implementation plans and milestones
- [Architecture](./architecture/) - System design and architectural decisions
- [API](./api/) - API specifications and integration guides

## Local-First Philosophy

This project embraces a **local-first** approach to maximize user control and privacy:

| Aspect | Local-First Approach |
|--------|---------------------|
| **LLM Inference** | Ollama for local model execution (no data leaves device) |
| **Data Storage** | IndexedDB in browser (no server accounts required) |
| **Data Format** | Human-readable markdown (transparent, editable) |
| **Portability** | Export/import as standard .md files (no vendor lock-in) |
| **Cloud Sync** | Optional, user-controlled (Google Drive / OneDrive) |

## Design Principles

1. **Transparency First** - Users can always see what the system knows about them
2. **Progressive Intelligence** - Features start simple and grow smarter with use
3. **User Control** - Users can view, edit, export, and reset any stored data
4. **Portable Data** - Memory exports as standard .md files that work anywhere
5. **No Black Boxes** - The system explains its reasoning
6. **Zero Friction Start** - Works immediately without accounts or setup

## Target Audience

Individuals and small businesses looking to optimize day-to-day actions:

- **Not developers** - No git, no technical file management expected
- **Google/Microsoft users** - Familiar with Drive, OneDrive, Docs, Sheets
- **Productivity-focused** - Want tools that "just work"

## Key Decisions

| Decision | Summary | ADR |
|----------|---------|-----|
| LLM SDK | Vercel AI SDK v6 for unified provider interface | [ADR-001](./architecture/adr-001-llm-sdk-selection.md) |
| Storage | IndexedDB + markdown format with export/import | [ADR-002](./architecture/adr-002-markdown-memory-storage.md) |

## Current Status

**Phase 0: Planning & Architecture**

See [Development Plans](./dev-plans/) for the full roadmap.

## Document Status Legend

- **Draft** - Initial ideas, not reviewed
- **In Review** - Under discussion
- **Approved** - Ready for implementation
- **Implemented** - Feature complete
