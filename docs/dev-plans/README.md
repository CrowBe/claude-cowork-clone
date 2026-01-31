# Development Plans

This directory contains technical implementation plans, milestones, and development roadmaps.

## Structure

- **Milestones** - High-level project phases and goals
- **Sprint Plans** - Detailed work breakdowns
- **Technical Specs** - Implementation details for specific features

## Current Phase

**Phase 0: Planning & Architecture**

Defining user stories, system architecture, and initial technical decisions.

## Roadmap Overview

### Phase 0: Planning & Architecture (Current)
- Define user stories and acceptance criteria
- Document architectural decisions (ADRs)
- Establish design principles and target audience

### Phase 1: Foundation
Core infrastructure and MVP features.

| Track | Work |
|-------|------|
| **LLM Layer** | Core abstraction using Vercel AI SDK |
| **Storage Layer** | IndexedDB with markdown format |
| **UI** | Basic chat interface |

**User Stories:** US-001, US-002, US-003, US-010, US-011, US-012, US-013

### Phase 2: LLM Integration
Connect to LLM providers.

| Track | Work |
|-------|------|
| **Anthropic** | Claude integration via @ai-sdk/anthropic |
| **Ollama** | Local LLM integration via ai-sdk-ollama |
| **Personalization** | Frequently used prompts, pattern learning |

**User Stories:** US-004, US-005, US-006

### Phase 3: Power Features
Advanced user control and transparency.

| Track | Work |
|-------|------|
| **Memory Editing** | In-app markdown editor for memory files |
| **Explainability** | "Why this suggestion?" tooltips |
| **Privacy Controls** | Clear/reset memory |

**User Stories:** US-007, US-008, US-009

### Phase 4: Cloud Sync (V2)
Optional cloud storage integration.

| Track | Work |
|-------|------|
| **Google Drive** | OAuth + Drive API integration |
| **OneDrive** | OAuth + Graph API integration |

**User Stories:** US-014, US-015

### Phase 5: Polish & Extended Features
Refinements based on user feedback.

| Track | Work |
|-------|------|
| **Conversation Persistence** | Save/load chat history |
| **Context Management** | Cross-session context |
| **Team Features** | Shared prompt libraries (future) |

## Related Documentation

- [User Stories](../user-stories/) - Feature requirements by phase
- [Architecture Decisions](../architecture/) - Technical decisions (ADRs)
- [API Documentation](../api/) - Interface specifications
