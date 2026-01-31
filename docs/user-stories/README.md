# User Stories

This directory contains user stories that define the features and functionality of the cowork clone from a user's perspective.

## Format

Each user story follows this template:

```
**As a** [type of user]
**I want** [goal/desire]
**So that** [benefit/value]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Epics

| Epic | Description | Status |
|------|-------------|--------|
| [Epic 001: Suggested Prompts & Transparent Memory](./epic-001-suggested-prompts.md) | Onboarding experience with intelligent prompts and user-visible memory | Draft |
| [Epic 002: LLM Provider Integration](./epic-002-llm-provider-integration.md) | Support for Claude Pro and local Ollama providers | Draft |

See [docs/README](../README.md) for design principles, target audience, and local-first philosophy.

## Stories by Epic

### Epic 001: Suggested Prompts & Transparent Memory

#### MVP (Phase 1)
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-001 | Static Welcome Prompts | High | Draft |
| US-002 | Record Prompt Usage to Local Storage | High | Draft |
| US-003 | Recently Used Prompts | High | Draft |
| US-010 | Export Memory Files | High | Draft |
| US-011 | Import Memory Files | High | Draft |
| US-012 | Backup Reminder | High | Draft |
| US-013 | Platform-Agnostic Storage Layer | High | Draft |

#### Phase 2: Personalization
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-004 | Frequently Used Prompts Surface | Medium | Draft |
| US-005 | Personalized Suggestions | Medium | Draft |
| US-006 | View Memory In-App | High | Draft |

#### Phase 3: Power Users
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-007 | Edit Memory In-App | Medium | Draft |
| US-008 | Explain Why This Suggestion | Medium | Draft |
| US-009 | Clear/Reset Memory | High | Draft |

#### Phase 4: Cloud Sync (V2)
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-014 | Optional Google Drive Sync | Low | Draft |
| US-015 | Optional OneDrive Sync | Low | Draft |

---

### Epic 002: LLM Provider Integration

#### Phase 1: Core Provider Support
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-020 | Select LLM Provider | High | Draft |
| US-021 | Configure Ollama (Local) | High | Draft |
| US-022 | Ollama Setup Guide | High | Draft |
| US-023 | Configure Claude API Key | High | Draft |
| US-024 | Select Claude Model | Medium | Draft |

#### Phase 2: Chat Integration
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-025 | Chat with Active Provider | High | Draft |
| US-026 | Provider Status in Chat | Medium | Draft |
| US-027 | Handle Provider Errors Gracefully | High | Draft |

#### Phase 3: Advanced Features
| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-028 | Switch Provider Mid-Conversation | Low | Draft |
| US-029 | Test Provider Connection | Medium | Draft |
| US-030 | Default Provider Recommendation | Medium | Draft |
