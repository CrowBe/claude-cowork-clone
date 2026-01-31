# ADR-002: Markdown-Based Memory Storage

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Use markdown files as the storage format for user memory and preferences

## Context

We are building a suggested prompts feature that learns from user behavior over time. This requires storing:

- Recent prompt history
- Usage frequency statistics
- Learned user preferences
- Pinned/favorite prompts

We need a storage solution that:

1. Works across desktop (local filesystem) and web (cloud storage) deployments
2. Aligns with our transparency-first design philosophy
3. Is portable and user-controllable
4. Supports future account-based sync without major rewrites
5. Leverages the tool's inherent document capabilities

## Design Principle: Transparency First

A core principle of this project is that users should always understand what the system knows about them. Traditional approaches (localStorage, IndexedDB, SQLite) store data in formats that are opaque to users. We want users to be able to:

- **See** exactly what's being remembered
- **Understand** why they're getting specific suggestions
- **Edit** their preferences directly if desired
- **Export** their data trivially (it's just files)
- **Trust** the system because nothing is hidden

## Options Considered

### Option 1: Markdown Files

**Pros:**
- Human-readable and editable
- Works with any text editor
- Portable across platforms and devices
- Git-friendly (can version control memory)
- Natural fit for in-app viewing/editing features
- No database dependencies
- Trivial export (just copy files)
- Aligns with "cowork" philosophy of transparent tooling

**Cons:**
- Parsing overhead for structured data
- Potential for user edits to break format
- No built-in querying (must load full file)
- Concurrent write handling needed

### Option 2: localStorage / IndexedDB

**Pros:**
- Built into browsers
- Fast read/write
- Structured data support (IndexedDB)
- No file system access needed

**Cons:**
- Browser-only (no desktop filesystem equivalent)
- Opaque to users (hidden in dev tools)
- Not portable between browsers
- Storage limits apply
- No transparency for users

### Option 3: SQLite

**Pros:**
- Full database capabilities
- Efficient querying
- Works on desktop (file-based)
- Single file storage

**Cons:**
- Binary format (not human-readable)
- Requires SQLite bindings
- Overkill for simple key-value/list data
- Users can't inspect without tools
- Web deployment requires WASM overhead

### Option 4: JSON Files

**Pros:**
- Structured and parseable
- Widely supported
- Portable

**Cons:**
- Less human-readable than markdown
- Harder to edit by hand without breaking
- No natural document structure for in-app viewing
- Doesn't leverage markdown tooling

## Decision

**We will use markdown files** as the primary storage format for user memory and preferences.

### File Structure

```
{memory-root}/
├── prompts.md          # Recent and pinned prompts
├── preferences.md      # User settings and learned patterns
└── usage-stats.md      # Frequency data and analytics
```

Where `{memory-root}` is:
- Desktop: `~/.claude-cowork/memory/`
- Web: Cloud storage path (e.g., `s3://bucket/{user-id}/memory/`)

### Format Conventions

1. **Tables** for structured lists (recent prompts, frequency data)
2. **YAML frontmatter** for metadata (last updated, version)
3. **Checkboxes** for pinned/favorite items
4. **Headers** for logical sections
5. **ISO timestamps** for all dates

### Storage Abstraction

```typescript
interface MemoryStore {
  read(filename: string): Promise<string>;
  write(filename: string, content: string): Promise<void>;
  exists(filename: string): Promise<boolean>;
  list(): Promise<string[]>;
}

class LocalFileStore implements MemoryStore { /* filesystem */ }
class CloudFileStore implements MemoryStore { /* S3, etc. */ }
```

### Markdown Parsing

We will use a lightweight markdown parser that:
- Extracts tables into structured data
- Preserves unknown sections during round-trips
- Validates format on read and warns (not fails) on issues

## Rationale

1. **Transparency** - Users can open files in any text editor and see exactly what's stored
2. **Portability** - Copy files to new device, done
3. **In-app editing** - Markdown renders beautifully and is easy to edit
4. **Developer experience** - Debug by reading files, not querying databases
5. **Future-proof** - Easy path to git-based sync, account storage, or other backends
6. **Trust** - No black box; users understand the system
7. **Alignment** - Leverages the tool's natural markdown capabilities

## Consequences

### Positive

- Users can view, edit, backup, and share their memory files
- In-app memory viewer/editor is straightforward to build
- No database dependencies or migrations
- Works identically on desktop and web (just different storage backends)
- Enables future features: version history, memory sharing, team prompts

### Negative

- Must handle malformed markdown gracefully (user edits)
- Parsing tables is more work than reading JSON
- Large history may become slow to parse (mitigate with archival)
- Concurrent writes need careful handling

### Mitigations

- **Malformed files**: Validate on read, preserve unknown sections, warn user
- **Performance**: Archive old entries to separate files, lazy load
- **Concurrency**: File locking on desktop, optimistic locking on web
- **User errors**: Provide "reset to default" option, backup before user edits

## Related Decisions

- [ADR-001: LLM SDK Selection](./adr-001-llm-sdk-selection.md) - Vercel AI SDK
- [Epic 001: Suggested Prompts](../user-stories/epic-001-suggested-prompts.md) - User stories for this feature

## References

- [Markdown Tables Spec](https://github.github.com/gfm/#tables-extension-)
- [YAML Frontmatter](https://jekyllrb.com/docs/front-matter/)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (for web)
