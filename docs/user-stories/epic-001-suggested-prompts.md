# Epic 001: Suggested Prompts & Transparent Memory

**Status:** Draft
**Created:** 2025-01-31
**Updated:** 2025-01-31
**Related ADR:** [ADR-002: Markdown Memory Storage](../architecture/adr-002-markdown-memory-storage.md)

## Overview

This epic covers the onboarding experience through suggested prompts that evolve from static suggestions to personalized recommendations based on local memory. A core principle is **transparency** - users can always see, understand, and modify how the system remembers and learns from their usage.

See [docs/README](../README.md) for design principles, target audience, and local-first philosophy.

---

## User Stories

### Core Onboarding

#### US-001: Static Welcome Prompts

**As a** new user
**I want** to see curated prompt suggestions on an empty chat
**So that** I can quickly start a conversation without the "blank page" problem

**Acceptance Criteria:**
- [ ] Empty chat state displays 4-6 prompt chips
- [ ] Prompts are organized by category (productivity, writing, analysis, creative)
- [ ] Clicking a prompt populates the input field
- [ ] Provider-appropriate prompts shown (Anthropic vs Ollama capabilities)
- [ ] Prompts are visually distinct and inviting

**Priority:** High
**Estimate:** Small

---

#### US-002: Record Prompt Usage to Local Storage

**As the** system
**I want** to record prompt usage to browser storage in markdown format
**So that** data persists between sessions and can be exported as readable files

**Acceptance Criteria:**
- [ ] Prompt history stored in IndexedDB as markdown-formatted strings
- [ ] Uses markdown table format for structured data
- [ ] Records: prompt text, category, provider, timestamp
- [ ] Requests persistent storage permission on first use
- [ ] Data survives browser restart (within eviction limits)
- [ ] Format matches export structure (prompts.md, preferences.md, usage-stats.md)

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
- [ ] Synced with stored memory

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
- [ ] Frequency data visible when viewing memory

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
- [ ] Suggestions explain why they're shown ("Based on your productivity focus")
- [ ] User can reset to defaults at any time

**Priority:** Medium
**Estimate:** Large

---

### Transparency & User Control

#### US-006: View Memory In-App

**As a** curious user
**I want** to view my memory directly within the app
**So that** I understand exactly what the system knows about me

**Acceptance Criteria:**
- [ ] Settings/Memory section shows memory contents
- [ ] Renders markdown content beautifully
- [ ] Organized by file (prompts, preferences, usage stats)
- [ ] Explains what each section contains in plain language
- [ ] Shows last updated timestamp

**Priority:** High
**Estimate:** Medium

---

#### US-007: Edit Memory In-App

**As a** power user
**I want** to edit my memory directly within the app
**So that** I can correct, curate, or customize my preferences

**Acceptance Criteria:**
- [ ] Edit button opens markdown editor for memory
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
- [ ] Explanations like: "You've used this 8 times" or "Popular for productivity"
- [ ] Static prompts labeled as "Suggested starter"
- [ ] Personalized prompts labeled as "Based on your history"
- [ ] Links to memory view for full context

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
- [ ] Option to clear all memory or specific sections
- [ ] Resets to static/new-user experience
- [ ] Does not affect conversation history (separate concern)

**Priority:** High
**Estimate:** Small

---

### Data Portability (Critical for Local-First)

#### US-010: Export Memory Files

**As a** user who wants to protect my data
**I want** to export my memory as downloadable files
**So that** I have a backup and can transfer to another device

**Acceptance Criteria:**
- [ ] "Download Memory" button in settings
- [ ] Exports as .zip containing .md files (prompts.md, preferences.md, usage-stats.md)
- [ ] Files are human-readable markdown
- [ ] Individual file download also available
- [ ] Export includes timestamp in filename
- [ ] Works offline

**Priority:** High (Critical for local-first approach)
**Estimate:** Small

---

#### US-011: Import Memory Files

**As a** user switching devices or restoring from backup
**I want** to import previously exported memory files
**So that** I can restore my preferences and history

**Acceptance Criteria:**
- [ ] "Import Memory" button in settings
- [ ] Accepts .zip or individual .md files
- [ ] Validates file format before applying
- [ ] Preview of what will be imported
- [ ] Option to merge with or replace existing memory
- [ ] Error handling for malformed files (graceful degradation)

**Priority:** High (Critical for local-first approach)
**Estimate:** Medium

---

#### US-012: Backup Reminder

**As a** user who might forget to backup
**I want** to be reminded to export my memory periodically
**So that** I don't lose my preferences if browser data is cleared

**Acceptance Criteria:**
- [ ] Reminder appears if no export in 30+ days (and memory has data)
- [ ] Gentle, non-intrusive notification (not modal)
- [ ] One-click to export from reminder
- [ ] "Remind me later" dismisses for 7 days
- [ ] "Don't remind me" option (can re-enable in settings)
- [ ] Shows last export date in settings

**Priority:** High (Critical for local-first approach)
**Estimate:** Small

---

### Platform Abstraction

#### US-013: Platform-Agnostic Storage Layer

**As a** developer
**I want** a storage abstraction layer
**So that** memory logic works across different storage backends

**Acceptance Criteria:**
- [ ] `MemoryStore` interface abstracts read/write/export/import operations
- [ ] `IndexedDBStore` implementation for web (MVP)
- [ ] `LocalFileStore` implementation for desktop (future)
- [ ] `GoogleDriveStore` implementation for cloud sync (V2)
- [ ] `OneDriveStore` implementation for cloud sync (V2)
- [ ] Markdown parsing/serialization shared across implementations
- [ ] Easy to add new storage backends

**Priority:** High
**Estimate:** Medium

---

### Future: Cloud Sync (V2)

#### US-014: Optional Google Drive Sync

**As a** user who works across multiple devices
**I want** to optionally sync my memory to Google Drive
**So that** my preferences follow me automatically

**Acceptance Criteria:**
- [ ] "Connect Google Drive" option in settings
- [ ] OAuth flow with minimal permissions (app folder only)
- [ ] Creates "Claude Cowork" folder in user's Drive
- [ ] Memory files visible in Drive (user can browse/edit)
- [ ] Automatic sync on changes
- [ ] Works alongside local storage (cloud is backup)
- [ ] Disconnect option removes sync but keeps local data

**Priority:** Low (V2)
**Estimate:** Large

---

#### US-015: Optional OneDrive Sync

**As a** Microsoft/Office 365 user
**I want** to optionally sync my memory to OneDrive
**So that** my preferences integrate with my existing workflow

**Acceptance Criteria:**
- [ ] "Connect OneDrive" option in settings
- [ ] OAuth flow with minimal permissions
- [ ] Creates "Claude Cowork" folder in user's OneDrive
- [ ] Memory files visible in OneDrive
- [ ] Automatic sync on changes
- [ ] Works alongside local storage
- [ ] Disconnect option available

**Priority:** Low (V2)
**Estimate:** Large

---

## Phased Delivery

### MVP (Phase 1)
| ID | Story | Priority |
|----|-------|----------|
| US-001 | Static Welcome Prompts | High |
| US-002 | Record Prompt Usage to Local Storage | High |
| US-003 | Recently Used Prompts | High |
| US-010 | Export Memory Files | High |
| US-011 | Import Memory Files | High |
| US-012 | Backup Reminder | High |
| US-013 | Platform-Agnostic Storage Layer | High |

### Phase 2: Personalization
| ID | Story | Priority |
|----|-------|----------|
| US-004 | Frequently Used Prompts Surface | Medium |
| US-005 | Personalized Suggestions | Medium |
| US-006 | View Memory In-App | High |

### Phase 3: Power Users
| ID | Story | Priority |
|----|-------|----------|
| US-007 | Edit Memory In-App | Medium |
| US-008 | Explain Why This Suggestion | Medium |
| US-009 | Clear/Reset Memory | High |

### Phase 4: Cloud Sync (V2)
| ID | Story | Priority |
|----|-------|----------|
| US-014 | Optional Google Drive Sync | Low |
| US-015 | Optional OneDrive Sync | Low |

---

## File Structure

### In Browser (IndexedDB)

```
Keys stored in IndexedDB:
├── "prompts.md"        → markdown string
├── "preferences.md"    → markdown string
├── "usage-stats.md"    → markdown string
└── "_meta"             → { lastExport, lastReminder, ... }
```

### Export Structure (.zip download)

```
claude-cowork-memory-2025-01-31.zip
├── prompts.md
├── preferences.md
└── usage-stats.md
```

### prompts.md

```markdown
# Prompt Memory

Last updated: 2025-01-31T10:30:00Z

## Recent Prompts

| Prompt | Category | Provider | Used |
|--------|----------|----------|------|
| Summarize this email thread | productivity | anthropic | 2025-01-31T09:15:00Z |
| Draft a response to this client | writing | anthropic | 2025-01-31T08:30:00Z |

## Pinned Prompts

- [x] Weekly report template
- [ ] Meeting notes formatter
```

### preferences.md

```markdown
# User Preferences

Last updated: 2025-01-31T10:30:00Z

## Learned Patterns

- **Primary categories:** productivity, writing
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
| Summarize this email thread | 15 | 2025-01-31 | productivity |
| Help me draft a response | 12 | 2025-01-30 | writing |

## Category Breakdown

- productivity: 45 uses (52%)
- writing: 20 uses (23%)
- analysis: 15 uses (17%)
- creative: 7 uses (8%)
```

---

## Success Metrics

- **Onboarding completion** - % of new users who send first message within 30 seconds
- **Prompt suggestion usage** - % of conversations started via suggested prompt
- **Return user engagement** - Do personalized suggestions increase session frequency?
- **Export adoption** - % of users who export at least once
- **Data safety** - % of users with recent backup (< 30 days)
- **Memory transparency engagement** - % of users who view their memory
- **Trust indicators** - User feedback on understanding/trusting the system

---

## Future Considerations

These are not committed stories but areas we may explore:

- **Account-based memory sync** - Memory tied to user accounts for cross-device sync
- **Memory sharing** - Export/import prompt collections with other users
- **Team memory** - Shared organizational prompts and preferences
- **AI-assisted memory curation** - LLM helps organize and clean up memory files
- **Memory insights dashboard** - Visualizations of usage patterns over time
- **Version history** - Git-like history of memory file changes
- **Auto-backup to cloud** - Automatic periodic backup to connected cloud storage
