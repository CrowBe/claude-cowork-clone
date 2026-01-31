# Epic 001: Suggested Prompts & Transparent Memory

**Status:** Draft
**Created:** 2025-01-31
**Related ADR:** [ADR-002: Markdown Memory Storage](../architecture/adr-002-markdown-memory-storage.md)

## Overview

This epic covers the onboarding experience through suggested prompts that evolve from static suggestions to personalized recommendations based on local memory. A core principle is **transparency** - users can always see, understand, and modify how the system remembers and learns from their usage.

## Design Principles

1. **Progressive Intelligence** - Start simple with static prompts, grow smarter with use
2. **Transparency First** - Memory is stored in human-readable markdown files
3. **User Control** - Users can view, edit, and reset their memory at any time
4. **Portable Data** - Memory files work across devices and deployments
5. **No Black Boxes** - The system explains why it suggests what it suggests

---

## User Stories

### Core Onboarding

#### US-001: Static Welcome Prompts

**As a** new user
**I want** to see curated prompt suggestions on an empty chat
**So that** I can quickly start a conversation without the "blank page" problem

**Acceptance Criteria:**
- [ ] Empty chat state displays 4-6 prompt chips
- [ ] Prompts are organized by category (coding, writing, general, creative)
- [ ] Clicking a prompt populates the input field
- [ ] Provider-appropriate prompts shown (Anthropic vs Ollama capabilities)
- [ ] Prompts are visually distinct and inviting

**Priority:** High
**Estimate:** Small

---

#### US-002: Record Prompt Usage to Markdown

**As the** system
**I want** to record prompt usage to a local markdown file
**So that** data is portable, human-readable, and transparent to users

**Acceptance Criteria:**
- [ ] Prompt history stored in `memory/prompts.md`
- [ ] Uses markdown table format for structured data
- [ ] Records: prompt text, category, provider, timestamp
- [ ] Desktop: writes to local filesystem (`~/.claude-cowork/memory/`)
- [ ] Web: writes to configured cloud storage
- [ ] File remains valid markdown after every write

**Priority:** High
**Estimate:** Medium

---

#### US-003: Recently Used Prompts

**As a** returning user
**I want** to see my recently used prompts
**So that** I can quickly repeat common tasks

**Acceptance Criteria:**
- [ ] "Recent" section shows last 5-10 unique prompts
- [ ] One-click to reuse a prompt
- [ ] Shows relative time ("2 hours ago", "yesterday")
- [ ] Can dismiss/remove individual items
- [ ] Synced with `memory/prompts.md` file

**Priority:** High
**Estimate:** Small

---

### Personalization

#### US-004: Frequently Used Prompts Surface

**As a** returning user
**I want** frequently used prompts to appear more prominently
**So that** my most common workflows are always accessible

**Acceptance Criteria:**
- [ ] System calculates prompt frequency from usage data
- [ ] Top prompts appear in "Favorites" or "Most Used" section
- [ ] Minimum 3 uses before a prompt surfaces as frequent
- [ ] Graceful fallback to static prompts if insufficient data
- [ ] Frequency data visible in `memory/usage-stats.md`

**Priority:** Medium
**Estimate:** Medium

---

#### US-005: Personalized Suggestions

**As an** established user
**I want** suggestions based on my usage patterns
**So that** the app feels tailored to how I work

**Acceptance Criteria:**
- [ ] After 10+ interactions, static prompts blend with personalized ones
- [ ] Category preferences influence what's shown first
- [ ] Time-of-day patterns considered (if sufficient data)
- [ ] Suggestions explain why they're shown ("Based on your coding focus")
- [ ] User can reset to defaults at any time

**Priority:** Medium
**Estimate:** Large

---

### Transparency & User Control

#### US-006: View Memory Files In-App

**As a** curious user
**I want** to view my memory files directly within the app
**So that** I understand exactly what the system knows about me

**Acceptance Criteria:**
- [ ] Settings/Memory section shows list of memory files
- [ ] Click to view rendered markdown content
- [ ] Syntax highlighting for markdown structure
- [ ] Shows file location (local path or cloud URL)
- [ ] Explains what each file contains in plain language

**Priority:** High
**Estimate:** Medium

---

#### US-007: Edit Memory Files In-App

**As a** power user
**I want** to edit my memory files directly within the app
**So that** I can correct, curate, or customize my preferences

**Acceptance Criteria:**
- [ ] Edit button opens markdown editor for memory files
- [ ] Live preview of markdown rendering
- [ ] Validation warns if edits break expected format
- [ ] Save confirms changes and reloads memory
- [ ] Undo/history for recent edits

**Priority:** Medium
**Estimate:** Medium

---

#### US-008: Explain Why This Suggestion

**As a** user
**I want** to understand why a specific prompt is being suggested
**So that** I trust the system and understand its reasoning

**Acceptance Criteria:**
- [ ] Hover/tap on suggestion shows explanation tooltip
- [ ] Explanations like: "You've used this 8 times" or "Popular in coding category"
- [ ] Static prompts labeled as "Suggested starter"
- [ ] Personalized prompts labeled as "Based on your history"
- [ ] Links to relevant memory file for full context

**Priority:** Medium
**Estimate:** Small

---

#### US-009: Clear/Reset Memory

**As a** privacy-conscious user
**I want** to clear my local prompt memory
**So that** I can start fresh or protect my privacy

**Acceptance Criteria:**
- [ ] Settings option to clear prompt memory
- [ ] Confirmation dialog explains what will be deleted
- [ ] Option to clear all memory or specific files
- [ ] Resets to static/new-user experience
- [ ] Does not affect conversation history (separate concern)

**Priority:** High
**Estimate:** Small

---

#### US-010: Export Memory Files

**As a** user switching devices
**I want** to export my memory files
**So that** I can transfer my preferences to another installation

**Acceptance Criteria:**
- [ ] Export button downloads memory folder as zip
- [ ] Individual file download also available
- [ ] Import option to load exported memory
- [ ] Validates imported files before applying
- [ ] Merge or replace options for existing memory

**Priority:** Low
**Estimate:** Medium

---

### Platform Abstraction

#### US-011: Platform-Agnostic Storage Layer

**As a** developer
**I want** a storage abstraction layer
**So that** memory logic works across desktop (local) and web (cloud) deployments

**Acceptance Criteria:**
- [ ] `MemoryStore` interface abstracts read/write operations
- [ ] `LocalFileStore` implementation for desktop (filesystem)
- [ ] `CloudFileStore` implementation for web (S3, GitHub, etc.)
- [ ] Markdown parsing/serialization shared across implementations
- [ ] Easy to add new storage backends

**Priority:** High
**Estimate:** Medium

---

## Future Considerations

These are not committed stories but areas we may explore:

- **Account-based memory sync** - Memory tied to user accounts for cross-device sync
- **Memory sharing** - Export/import prompt collections with other users
- **Team memory** - Shared organizational prompts and preferences
- **AI-assisted memory curation** - LLM helps organize and clean up memory files
- **Memory insights dashboard** - Visualizations of usage patterns over time
- **Version history** - Git-like history of memory file changes

---

## File Structure

```
Desktop (~/.claude-cowork/):        Web (cloud storage):
memory/                             {user-id}/memory/
├── prompts.md                      ├── prompts.md
├── preferences.md                  ├── preferences.md
└── usage-stats.md                  └── usage-stats.md
```

### prompts.md

```markdown
# Prompt Memory

Last updated: 2025-01-31T10:30:00Z

## Recent Prompts

| Prompt | Category | Provider | Used |
|--------|----------|----------|------|
| Review this code for bugs | coding | anthropic | 2025-01-31T09:15:00Z |
| Summarize this document | writing | ollama | 2025-01-31T08:30:00Z |

## Pinned Prompts

- [x] Code review checklist
- [ ] Morning standup template
```

### preferences.md

```markdown
# User Preferences

Last updated: 2025-01-31T10:30:00Z

## Learned Patterns

- **Primary categories:** coding, debugging
- **Preferred provider:** anthropic
- **Peak usage hours:** 9am-12pm, 2pm-5pm

## Display Settings

- show_recent_prompts: true
- max_suggestions: 6
- blend_static_prompts: true
```

### usage-stats.md

```markdown
# Usage Statistics

Last updated: 2025-01-31T10:30:00Z

## Prompt Frequency

| Prompt | Uses | Last Used | Category |
|--------|------|-----------|----------|
| Review this code for bugs | 12 | 2025-01-31 | coding |
| Explain this error | 8 | 2025-01-30 | debugging |

## Category Breakdown

- coding: 45 uses (52%)
- writing: 20 uses (23%)
- general: 15 uses (17%)
- creative: 7 uses (8%)
```

---

## Success Metrics

- **Onboarding completion** - % of new users who send first message within 30 seconds
- **Prompt suggestion usage** - % of conversations started via suggested prompt
- **Return user engagement** - Do personalized suggestions increase session frequency?
- **Memory transparency engagement** - % of users who view their memory files
- **Trust indicators** - User feedback on understanding/trusting the system
