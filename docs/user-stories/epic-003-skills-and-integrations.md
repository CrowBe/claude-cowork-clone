# Epic 003: Skills & Integrations

**Status:** Draft
**Created:** 2026-02-02
**Updated:** 2026-02-02
**Related ADR:** [ADR-008: Skills Architecture](../architecture/adr-008-skills-architecture.md)
**Related Plan:** [Skills and Integrations Plan](../dev-plans/skills-and-integrations.md)

## Overview

This epic covers the assistant's ability to take actions beyond generating text responses. Skills are discrete tools the AI can use (calculations, note-taking, code execution), while integrations connect to external services (calendars, GitHub, email). Following our local-first philosophy, **local skills are enabled by default** while network/cloud integrations require explicit opt-in.

Core principles:
- **Privacy by Default** - Local-only skills work without any network access
- **Transparency** - Users see exactly what tools are being used and why
- **User Control** - All tool executions visible; sensitive actions require approval
- **Progressive Enhancement** - Start with core skills, enable advanced features as needed

---

## User Stories

### Core Skills (Local-Only)

#### US-031: Calculator Skill

**As a** user doing quick calculations
**I want** the assistant to perform math operations directly
**So that** I get accurate results without leaving the chat

**Acceptance Criteria:**
- [ ] Assistant can evaluate mathematical expressions
- [ ] Supports basic operations (+, -, *, /, ^, %)
- [ ] Supports functions (sin, cos, sqrt, log, etc.)
- [ ] Supports unit conversions (5 miles to km, 100 F to C)
- [ ] Supports date math ("30 days from today", "days between dates")
- [ ] Results displayed inline with calculation shown
- [ ] Works entirely offline (no network required)
- [ ] Uses math.js for safe expression evaluation (no eval())

**Priority:** High
**Estimate:** Small

---

#### US-032: Note-Taking Skill

**As a** user who wants to save information
**I want** the assistant to create and manage notes for me
**So that** I can build a personal knowledge base through conversation

**Acceptance Criteria:**
- [ ] Assistant can create new notes with title and content
- [ ] Assistant can read existing notes by title or search
- [ ] Assistant can update or append to existing notes
- [ ] Assistant can list all notes with summaries
- [ ] Notes stored in IndexedDB as markdown
- [ ] Notes exportable as .md files
- [ ] Tool shows clear feedback ("Created note: Meeting Notes")
- [ ] Works entirely offline

**Priority:** High
**Estimate:** Medium

---

#### US-033: Task Management Skill

**As a** user managing todos
**I want** the assistant to track tasks and reminders
**So that** I can manage my work through natural conversation

**Acceptance Criteria:**
- [ ] Assistant can add tasks with optional due dates and priorities
- [ ] Assistant can mark tasks complete or incomplete
- [ ] Assistant can list tasks filtered by status/priority/date
- [ ] Assistant can update task details
- [ ] Tasks stored in IndexedDB
- [ ] Task list visible in UI sidebar (optional)
- [ ] Supports recurring task patterns
- [ ] Works entirely offline

**Priority:** High
**Estimate:** Medium

---

#### US-034: Memory Recall Skill

**As a** user with ongoing context
**I want** the assistant to search through past conversations and saved memories
**So that** it can reference relevant information from our history

**Acceptance Criteria:**
- [ ] Assistant can search conversation history by keywords
- [ ] Assistant can retrieve specific saved memories
- [ ] Shows source of recalled information ("From our conversation on Jan 15")
- [ ] Respects context window limits gracefully
- [ ] User can see what was recalled in tool result
- [ ] Works entirely offline

**Priority:** Medium
**Estimate:** Medium

---

### Enhanced Skills (Sandboxed Execution)

#### US-035: Code Execution Skill

**As a** developer or analyst
**I want** the assistant to run code snippets and show results
**So that** I can test ideas and see outputs without leaving the chat

**Acceptance Criteria:**
- [ ] Supports JavaScript execution in sandboxed iframe
- [ ] Supports Python via Pyodide (WebAssembly)
- [ ] Shows execution output (stdout, return values)
- [ ] Handles errors gracefully with clear messages
- [ ] Execution timeout (10 seconds default)
- [ ] Memory limits enforced
- [ ] Code and output displayed in formatted blocks
- [ ] Requires user approval before first execution
- [ ] Option to auto-approve after initial consent

**Priority:** Medium
**Estimate:** Large

---

#### US-036: File Reading Skill

**As a** user working with local files
**I want** the assistant to read files I select
**So that** I can analyze documents, code, or data through conversation

**Acceptance Criteria:**
- [ ] Uses File System Access API (user grants permission)
- [ ] Shows file picker when assistant needs to read a file
- [ ] Supports text files (.txt, .md, .json, .csv, etc.)
- [ ] Supports PDF parsing (pdf.js)
- [ ] Supports DOCX parsing (mammoth.js)
- [ ] File content shown to user before sending to LLM
- [ ] Large files truncated with warning
- [ ] File never uploaded anywhere (local processing only)

**Priority:** Medium
**Estimate:** Medium

---

#### US-037: Diagram Generation Skill

**As a** user explaining complex ideas
**I want** the assistant to generate visual diagrams
**So that** I can communicate architecture, flows, and relationships visually

**Acceptance Criteria:**
- [ ] Supports Mermaid diagram syntax (flowcharts, sequences, etc.)
- [ ] Renders diagrams inline in chat
- [ ] Diagrams are downloadable as PNG/SVG
- [ ] Assistant can iterate on diagrams based on feedback
- [ ] Works entirely offline
- [ ] Syntax errors show helpful messages

**Priority:** Medium
**Estimate:** Small

---

### Skill Management

#### US-038: View Available Skills

**As a** user
**I want** to see what skills the assistant has available
**So that** I know what capabilities I can leverage

**Acceptance Criteria:**
- [ ] Skills panel in settings shows all available skills
- [ ] Skills grouped by tier (Core, Enhanced, Network, Integrations)
- [ ] Each skill shows: name, description, privacy level, enabled status
- [ ] Clear visual distinction between local and network skills
- [ ] Search/filter skills by name or category

**Priority:** High
**Estimate:** Small

---

#### US-039: Enable/Disable Skills

**As a** privacy-conscious user
**I want** to control which skills are active
**So that** I only enable capabilities I trust and need

**Acceptance Criteria:**
- [ ] Toggle switch for each skill
- [ ] Core skills enabled by default
- [ ] Network skills disabled by default
- [ ] Disabling skill immediately prevents LLM from using it
- [ ] Confirmation when enabling network/integration skills
- [ ] Settings persisted in IndexedDB

**Priority:** High
**Estimate:** Small

---

#### US-040: Tool Approval Workflow

**As a** cautious user
**I want** to approve tool usage before execution
**So that** I maintain control over what actions are taken

**Acceptance Criteria:**
- [ ] Approval dialog shows: skill name, parameters, what it will do
- [ ] "Approve" and "Deny" buttons
- [ ] "Don't ask again for this skill" checkbox
- [ ] Denied tool calls return clear message to LLM
- [ ] Approval preferences persisted
- [ ] Can reset approval preferences in settings

**Priority:** High
**Estimate:** Medium

---

#### US-041: Tool Execution Transparency

**As a** user
**I want** to see when and how tools are being used
**So that** I understand what the assistant is doing on my behalf

**Acceptance Criteria:**
- [ ] Tool calls shown in chat with distinct styling
- [ ] Shows: tool name, input parameters, output result
- [ ] Collapsible for complex outputs
- [ ] Execution time shown
- [ ] Error states clearly displayed
- [ ] History of tool calls viewable

**Priority:** High
**Estimate:** Medium

---

### Network Skills (Opt-in)

#### US-042: Web Search Skill

**As a** user needing current information
**I want** the assistant to search the web
**So that** I can get up-to-date information beyond the LLM's training

**Acceptance Criteria:**
- [ ] Disabled by default (explicit opt-in required)
- [ ] Uses privacy-respecting search (SearXNG, Brave Search)
- [ ] Shows search query and source links
- [ ] Results summarized by LLM with citations
- [ ] Rate limited to prevent abuse
- [ ] Search history not stored by default

**Priority:** Medium
**Estimate:** Medium

---

#### US-043: Web Page Fetch Skill

**As a** user referencing online content
**I want** the assistant to read web pages I specify
**So that** we can discuss articles, documentation, or other online content

**Acceptance Criteria:**
- [ ] Disabled by default (explicit opt-in required)
- [ ] User provides URL, assistant fetches and parses content
- [ ] Extracts main content (ignores ads, navigation)
- [ ] Shows fetch status and content preview
- [ ] Respects robots.txt
- [ ] Handles errors gracefully (404, timeouts)
- [ ] Content processed locally after fetch

**Priority:** Medium
**Estimate:** Medium

---

### MCP Integration

#### US-044: Configure MCP Servers

**As a** power user
**I want** to connect custom MCP servers
**So that** I can extend the assistant with specialized tools

**Acceptance Criteria:**
- [ ] "Add MCP Server" button in settings
- [ ] Supports stdio transport (local command)
- [ ] Supports HTTP/WebSocket transport (remote)
- [ ] Server configuration: name, command/URL, environment variables
- [ ] Test connection button with status feedback
- [ ] Enable/disable servers individually
- [ ] Configuration persisted locally

**Priority:** Medium
**Estimate:** Large

---

#### US-045: Discover MCP Tools

**As a** user with MCP servers configured
**I want** to see tools provided by connected servers
**So that** I understand what new capabilities are available

**Acceptance Criteria:**
- [ ] After connecting server, tools automatically discovered
- [ ] MCP tools appear in skills list with server name
- [ ] Tool descriptions and parameters shown
- [ ] Can enable/disable individual MCP tools
- [ ] Tool discovery updates when server reconnects

**Priority:** Medium
**Estimate:** Medium

---

#### US-046: MCP Apps Rendering

**As a** user interacting with MCP tools
**I want** rich tool UIs to render in the chat
**So that** I can interact with complex tool outputs visually

**Acceptance Criteria:**
- [ ] Uses @mcp-ui/client for MCP Apps protocol
- [ ] Tool UIs render in sandboxed iframes
- [ ] Supports interactive elements (forms, buttons)
- [ ] Falls back to text for non-UI tool results
- [ ] Clear visual distinction for MCP App content
- [ ] Security: CSP prevents malicious content

**Priority:** Low
**Estimate:** Large

---

### External Integrations

#### US-047: Integration OAuth Flow

**As a** user connecting external services
**I want** a secure authorization process
**So that** I can safely grant limited access to my accounts

**Acceptance Criteria:**
- [ ] Standard OAuth 2.0 flow for supported services
- [ ] Shows exactly what permissions are being requested
- [ ] Tokens stored securely (encrypted in IndexedDB)
- [ ] Disconnect button revokes access
- [ ] Token refresh handled automatically
- [ ] Works with: Google, GitHub, Microsoft, Notion

**Priority:** Medium
**Estimate:** Large

---

#### US-048: Google Calendar Integration

**As a** user managing my schedule
**I want** the assistant to interact with my Google Calendar
**So that** I can check availability and create events through conversation

**Acceptance Criteria:**
- [ ] Requires explicit OAuth connection
- [ ] Read: list events, check availability, find free time
- [ ] Write: create events, update events (with confirmation)
- [ ] Shows event details clearly in chat
- [ ] Minimal scopes (calendar events only)
- [ ] Can disconnect at any time

**Priority:** Low (V2)
**Estimate:** Large

---

#### US-049: GitHub Integration

**As a** developer
**I want** the assistant to interact with my GitHub repositories
**So that** I can manage issues, PRs, and code through conversation

**Acceptance Criteria:**
- [ ] Supports OAuth or Personal Access Token
- [ ] Read: repos, issues, PRs, code search
- [ ] Write: create issues, comment on PRs (with confirmation)
- [ ] Repository selection to limit scope
- [ ] Shows PR/issue details with links
- [ ] Code snippets formatted properly

**Priority:** Low (V2)
**Estimate:** Large

---

#### US-050: Notion Integration

**As a** Notion user
**I want** the assistant to access my Notion workspace
**So that** I can search, read, and create content through conversation

**Acceptance Criteria:**
- [ ] OAuth connection with Notion
- [ ] Read: search pages, read page content
- [ ] Write: create pages, update content (with confirmation)
- [ ] Shows Notion blocks rendered appropriately
- [ ] Workspace/page selection for scope
- [ ] Handles Notion's rate limits

**Priority:** Low (V2)
**Estimate:** Large

---

## Phased Delivery

### Phase 1: Core Skills Foundation
| ID | Story | Priority |
|----|-------|----------|
| US-031 | Calculator Skill | High |
| US-032 | Note-Taking Skill | High |
| US-033 | Task Management Skill | High |
| US-038 | View Available Skills | High |
| US-039 | Enable/Disable Skills | High |
| US-041 | Tool Execution Transparency | High |

### Phase 2: Enhanced Skills
| ID | Story | Priority |
|----|-------|----------|
| US-034 | Memory Recall Skill | Medium |
| US-035 | Code Execution Skill | Medium |
| US-036 | File Reading Skill | Medium |
| US-037 | Diagram Generation Skill | Medium |
| US-040 | Tool Approval Workflow | High |

### Phase 3: Network Skills & MCP
| ID | Story | Priority |
|----|-------|----------|
| US-042 | Web Search Skill | Medium |
| US-043 | Web Page Fetch Skill | Medium |
| US-044 | Configure MCP Servers | Medium |
| US-045 | Discover MCP Tools | Medium |

### Phase 4: MCP Apps & Integrations (V2)
| ID | Story | Priority |
|----|-------|----------|
| US-046 | MCP Apps Rendering | Low |
| US-047 | Integration OAuth Flow | Medium |
| US-048 | Google Calendar Integration | Low |
| US-049 | GitHub Integration | Low |
| US-050 | Notion Integration | Low |

---

## Technical Implementation

### Skill Definition Structure

```typescript
// src/lib/skills/types.ts
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  tier: 'core' | 'enhanced' | 'network' | 'integration';
  icon: string;
  requiresApproval: boolean;
  requiresNetwork: boolean;
  defaultEnabled: boolean;
  tool: CoreTool;  // Vercel AI SDK tool definition
}
```

### Skill Registry Usage

```typescript
// src/lib/skills/registry.ts
const skillRegistry = new SkillRegistry();

// Register core skills
skillRegistry.register(calculatorSkill);
skillRegistry.register(noteSkill);
skillRegistry.register(taskSkill);

// Get tools for LLM
const tools = skillRegistry.getToolsForProvider('ollama');
```

### API Route Integration

```typescript
// src/app/api/chat/route.ts
import { skillRegistry } from '@/lib/skills';

export async function POST(req: Request) {
  const tools = skillRegistry.getEnabledTools();

  return streamText({
    model: provider,
    messages,
    tools,  // Skills passed as tools
  });
}
```

---

## Success Metrics

- **Skill Adoption Rate** - % of users who use at least one skill
- **Core Skill Usage** - Average skill invocations per session
- **Approval Acceptance Rate** - % of tool executions approved vs denied
- **Network Skill Opt-in** - % of users enabling network skills
- **MCP Server Adoption** - % of users connecting custom MCP servers
- **Integration Connections** - Number of external services connected
- **Error Rate** - % of tool executions that fail

---

## Security Considerations

### Sandboxing Requirements

| Skill Type | Sandbox Method |
|------------|----------------|
| Calculator | Expression parser (no eval) |
| Code Execution | Isolated iframe + WebAssembly |
| File Access | File System Access API |
| MCP Apps | Sandboxed iframe with CSP |
| Network Skills | Server-side proxy |

### Data Privacy

1. Local skills never send data to any server
2. Network skills require explicit opt-in
3. Integration tokens encrypted at rest
4. Tool execution logs stored locally only
5. User can clear all skill-related data

---

## Future Considerations

These are not committed stories but areas we may explore:

- **Custom Skill Builder** - Users create simple skills via configuration
- **Skill Marketplace** - Discover and install community skills
- **Team Skills** - Shared skills within an organization
- **Skill Analytics** - Dashboard showing skill usage patterns
- **Voice-triggered Skills** - Activate skills via voice commands
- **Scheduled Skill Execution** - Run skills on schedule (daily summaries)
- **Skill Chaining** - Compose multiple skills into workflows
