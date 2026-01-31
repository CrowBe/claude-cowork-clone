# ADR-002: Markdown-Based Memory Storage

**Status:** Approved
**Date:** 2025-01-31
**Updated:** 2025-01-31
**Decision:** Use IndexedDB with markdown format, with prominent export/import for portability

## Context

We are building a suggested prompts feature that learns from user behavior over time. This requires storing:

- Recent prompt history
- Usage frequency statistics
- Learned user preferences
- Pinned/favorite prompts

We need a storage solution that:

1. Works in web browsers without requiring user accounts
2. Aligns with our transparency-first design philosophy
3. Is portable and user-controllable (no lock-in)
4. Supports future cloud sync without major rewrites
5. Uses human-readable markdown format for transparency

### Target Audience

Our users are individuals and small businesses looking to optimize day-to-day actions. They are:

- **Not developers** (no git, no technical file management)
- **Google/Microsoft users** (familiar with Drive, OneDrive, Docs, Sheets)
- **Productivity-focused** (want tools that "just work")

This influences our storage strategy toward simplicity with optional cloud integration.

## Design Principle: Transparency First

A core principle of this project is that users should always understand what the system knows about them. We want users to be able to:

- **See** exactly what's being remembered
- **Understand** why they're getting specific suggestions
- **Edit** their preferences directly if desired
- **Export** their data trivially (download as files)
- **Trust** the system because nothing is hidden

## Browser Storage Landscape

### Storage Limits

| Storage Type | Limit | Eviction Risk |
|-------------|-------|---------------|
| localStorage | 5-10 MB | High (cleared with site data) |
| IndexedDB | 50% of disk (Chrome), 2GB (Firefox) | Medium (can request persistence) |
| OPFS | Same as IndexedDB | Medium (newer API) |

### Key Insight: Size Is Not the Constraint

Our memory files are small (~300KB after a year of heavy use). The real risks are:

1. **Browser eviction** - Data can disappear without warning
2. **User clears browsing data** - Common action
3. **Switching browsers/devices** - No automatic sync

This is why **export/import and backup reminders are critical**, not optional.

## Options Considered

### Option 1: IndexedDB + Markdown Export (Selected)

**Pros:**
- Works immediately (no account setup)
- Large storage capacity
- Markdown format preserved for transparency
- Export gives users real .md files they can inspect/edit
- No infrastructure costs for MVP
- Path to cloud sync later

**Cons:**
- Risk of data loss if browser clears storage
- No automatic sync between devices
- Requires user discipline for backups

### Option 2: Cloud-First (Google Drive / OneDrive)

**Pros:**
- Automatic sync across devices
- Users own their data in familiar location
- No eviction risk

**Cons:**
- Requires OAuth setup (complexity)
- Requires account (friction)
- API costs at scale
- Network dependency

### Option 3: localStorage Only

**Pros:**
- Simplest implementation
- Synchronous API

**Cons:**
- 5-10MB limit
- Highest eviction risk
- No good path to scale

### Option 4: Server-Side Storage

**Pros:**
- Full control
- Easy sync

**Cons:**
- Requires user accounts
- Infrastructure costs
- Less transparent to users

## Decision

**We will use IndexedDB as primary storage with markdown as the data format, with prominent export/import functionality and backup reminders.**

### Phased Approach

```
MVP (Phase 1):
├── IndexedDB stores markdown strings
├── "Download Memory" → .zip of .md files
├── "Import Memory" → upload .md files
├── Request persistent storage on first use
└── Backup reminder after 7+ days without export

V2 (Phase 2):
├── Optional Google Drive sync
├── Optional OneDrive sync
└── "Connect cloud storage" in settings
```

### Storage Format

Data is stored in IndexedDB but formatted as markdown strings:

```typescript
// IndexedDB structure
{
  "prompts.md": "# Prompt Memory\n\n| Prompt | Category |...",
  "preferences.md": "# User Preferences\n\n...",
  "usage-stats.md": "# Usage Statistics\n\n..."
}
```

When user exports, they get actual `.md` files they can open in any text editor.

### Storage Abstraction

```typescript
interface MemoryStore {
  read(filename: string): Promise<string>;
  write(filename: string, content: string): Promise<void>;
  exists(filename: string): Promise<boolean>;
  list(): Promise<string[]>;
  exportAll(): Promise<Blob>;  // Returns .zip
  importAll(file: File): Promise<void>;
}

// MVP implementation
class IndexedDBStore implements MemoryStore {
  private db: IDBDatabase;
  // Stores markdown strings keyed by filename
}

// Future implementations
class GoogleDriveStore implements MemoryStore { /* OAuth + Drive API */ }
class OneDriveStore implements MemoryStore { /* OAuth + Graph API */ }
class LocalFileStore implements MemoryStore { /* Desktop app */ }
```

### Persistence Strategy

```typescript
// On first use, request persistent storage
async function requestPersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    if (granted) {
      console.log("Storage will not be cleared except by explicit user action");
    }
    return granted;
  }
  return false;
}
```

### Backup Reminder Logic

```typescript
interface BackupStatus {
  lastExport: Date | null;
  lastReminder: Date | null;
  reminderDismissed: boolean;
}

function shouldShowBackupReminder(status: BackupStatus): boolean {
  const daysSinceExport = status.lastExport
    ? daysBetween(status.lastExport, new Date())
    : Infinity;

  const daysSinceReminder = status.lastReminder
    ? daysBetween(status.lastReminder, new Date())
    : Infinity;

  // Show reminder if:
  // - Never exported and used for 7+ days, OR
  // - Last export was 30+ days ago
  // - And we haven't reminded in the last 7 days
  return (daysSinceExport > 30 || (daysSinceExport === Infinity && daysSinceReminder > 7))
    && daysSinceReminder > 7
    && !status.reminderDismissed;
}
```

## File Structure

### Logical Structure (In IndexedDB)

```
memory/
├── prompts.md          # Recent and pinned prompts
├── preferences.md      # User settings and learned patterns
├── usage-stats.md      # Frequency data and analytics
└── _meta.json          # Last export date, backup status
```

### Export Structure (Downloaded .zip)

```
claude-cowork-memory-2025-01-31.zip
├── prompts.md
├── preferences.md
└── usage-stats.md
```

## Rationale

1. **Zero friction start** - Works immediately, no accounts or setup
2. **Transparency preserved** - Markdown format, viewable in-app, editable when exported
3. **User ownership** - Download anytime, take your data anywhere
4. **No lock-in** - Standard .md files work with any tool
5. **Progressive enhancement** - Add cloud sync later without changing core logic
6. **Cost effective** - No server infrastructure for MVP
7. **Appropriate for audience** - Non-technical users get simple backup/restore

## Consequences

### Positive

- Users can start immediately without accounts
- Export gives complete data ownership
- Markdown format enables in-app transparency features
- Cloud sync can be added as optional enhancement
- No infrastructure costs for MVP

### Negative

- Users must remember to export (mitigated by reminders)
- Data loss possible if browser clears storage (mitigated by persistence API + reminders)
- No automatic multi-device sync in MVP

### Mitigations

| Risk | Mitigation |
|------|------------|
| Browser eviction | Request persistent storage, show backup reminders |
| User forgets to export | Periodic reminders, easy one-click export |
| Data loss | Auto-export to Downloads on significant changes (optional setting) |
| Multi-device need | V2 cloud sync with Google Drive / OneDrive |

## Future: Cloud Sync (V2)

When we add cloud sync, users will see:

```
┌─────────────────────────────────────────┐
│         Storage Settings                │
├─────────────────────────────────────────┤
│ Current: Browser storage (local)        │
│ Last backup: 3 days ago                 │
│                                         │
│ [Download Backup]  [Import Backup]      │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Sync to cloud (optional):               │
│                                         │
│ [G] Connect Google Drive                │
│ [M] Connect OneDrive                    │
│                                         │
│ Your memory files will appear in a      │
│ "Claude Cowork" folder you can access   │
│ anytime.                                │
└─────────────────────────────────────────┘
```

## Related Decisions

- [ADR-001: LLM SDK Selection](./adr-001-llm-sdk-selection.md) - Vercel AI SDK
- [Epic 001: Suggested Prompts](../user-stories/epic-001-suggested-prompts.md) - User stories for this feature

## References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API - persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [Microsoft Graph API - OneDrive](https://docs.microsoft.com/en-us/onedrive/developer/)
