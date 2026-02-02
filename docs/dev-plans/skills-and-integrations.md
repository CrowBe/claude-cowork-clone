# Skills and Integrations Plan

**Status:** Draft
**Date:** 2026-02-02
**Related:** ADR-008 (Skills Architecture), ADR-003 (Chat UI Library), ADR-001 (LLM SDK Selection)

## Overview

This document outlines the skills (tools) and integrations strategy for the Claude Cowork clone. Skills are discrete capabilities the AI assistant can use to take actions or retrieve information. Integrations connect the assistant to external services and data sources.

### Design Principles

Following the project's local-first philosophy:

1. **Local-First Skills** - Prioritize tools that work entirely on-device without cloud dependencies
2. **Privacy by Default** - No data leaves the device unless explicitly enabled by user
3. **Progressive Enhancement** - Start with basic skills, add complexity as needed
4. **User Control** - All tool executions require transparency; sensitive actions need approval
5. **MCP Extensibility** - Leverage MCP protocol for third-party tool ecosystem
6. **Context Efficiency** - Minimize token usage through lazy-loading tool discovery

---

## Lazy-Loading Tool Discovery

### Problem

Sending all tool definitions with every LLM request wastes context tokens. With 20+ skills, tool schemas alone consume ~3000 tokens per request—even for conversations that never use tools.

### Solution: Discovery-Based Loading

By default, only a `discover_skills` meta-tool is included in the context. Skills are loaded on-demand as the conversation requires them.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Initial Context (~200 tokens)                 │
│                                                                  │
│   Tools: [ discover_skills ]                                    │
│                                                                  │
│   System prompt includes:                                       │
│   "Use discover_skills when you need to perform actions like    │
│   calculations, saving notes, web search, or other tasks."      │
└─────────────────────────────────────────────────────────────────┘
```

### Discovery Flow

```
User: "Can you help me calculate compound interest?"

Turn 1:
├─ LLM sees: [ discover_skills ]
├─ LLM calls: discover_skills({ query: "calculation math" })
└─ Result: { skills: [calculator], message: "Found 1 skill. Now available." }

Turn 2:
├─ LLM sees: [ discover_skills, calculator ]  ◄── Injected
├─ LLM calls: calculator({ expression: "1000 * (1 + 0.05)^10" })
└─ Result: { result: "1628.89" }

Turn 3+:
├─ LLM sees: [ discover_skills, calculator ]  ◄── Persists
└─ Calculator remains available for rest of conversation
```

### Context Efficiency

| Scenario | All Tools Upfront | Discovery Pattern |
|----------|-------------------|-------------------|
| Initial request | ~3000 tokens | ~200 tokens |
| Conversation using 0 tools | ~3000 tokens | ~200 tokens |
| Conversation using 3 tools | ~3000 tokens | ~650 tokens |
| 50+ skills installed | ~7500+ tokens | ~200 tokens (initial) |

### Frequently-Used Tools (Future)

Once we collect usage analytics, commonly-used tools may be pre-loaded:

```typescript
// Data-driven default tools (future implementation)
async function getDefaultTools(): Promise<string[]> {
  const analytics = await getSkillUsageAnalytics();

  // Include tools used in 30%+ of conversations
  return analytics
    .filter(s => s.conversationUsageRate >= 0.30)
    .map(s => s.skillId);
}
```

This ensures we only add tools to the default context when actual usage justifies the token cost. Initially, we start with discovery-only and let data guide which tools (if any) deserve default inclusion.

---

## Skill Categories

### Tier 1: Core Skills (Local-Only, No Network)

These skills work entirely offline and form the foundation of the assistant's capabilities.

| Skill | Description | Privacy Level | Implementation |
|-------|-------------|---------------|----------------|
| **Calculator** | Math expressions, unit conversions, date calculations | Safe | Built-in |
| **Note Taker** | Create, read, update notes stored in IndexedDB | Safe | Built-in |
| **Task Manager** | Todo lists, task tracking, reminders | Safe | Built-in |
| **Memory Recall** | Search through conversation history and saved memories | Safe | Built-in |
| **Code Formatter** | Format/lint code snippets | Safe | Built-in |
| **JSON/YAML Parser** | Parse and transform structured data | Safe | Built-in |

### Tier 2: Enhanced Skills (Local with Sandboxing)

Skills that require sandboxed execution for safety.

| Skill | Description | Privacy Level | Implementation |
|-------|-------------|---------------|----------------|
| **Code Executor** | Run code snippets in sandboxed environment (JS, Python via Pyodide) | Sandboxed | WebAssembly sandbox |
| **File Reader** | Read user-selected files from local filesystem | User-approved | File System Access API |
| **Document Parser** | Extract text from PDFs, DOCX, images (OCR) | Local | pdf.js, mammoth.js |
| **Diagram Generator** | Create diagrams from text (Mermaid, PlantUML) | Safe | Built-in renderers |

### Tier 3: Network Skills (Opt-in, Cloud-Connected)

Skills requiring network access. Disabled by default; user must explicitly enable.

| Skill | Description | Privacy Level | Implementation |
|-------|-------------|---------------|----------------|
| **Web Search** | Search the web via privacy-respecting APIs | Opt-in | SearXNG, Brave Search API |
| **Web Fetch** | Fetch and parse web pages | Opt-in | Server-side proxy |
| **Image Generation** | Generate images via Stable Diffusion or DALL-E | Opt-in | Local SD or API |
| **Translation** | Translate text between languages | Opt-in | Local model or API |

### Tier 4: Integrations (External Service Connections)

Deep integrations with external platforms. Each requires explicit authorization.

| Integration | Description | Auth Method | Data Handling |
|-------------|-------------|-------------|---------------|
| **Google Calendar** | Read/write calendar events | OAuth 2.0 | API only, no storage |
| **Google Drive** | Sync memories/notes to cloud | OAuth 2.0 | User-controlled sync |
| **GitHub** | Repository management, PR reviews | OAuth/PAT | API only |
| **Linear/Jira** | Project management integration | OAuth/API key | API only |
| **Notion** | Sync notes and documents | OAuth | Bidirectional sync |
| **Slack** | Send messages, read channels | OAuth | API only |
| **Email (IMAP)** | Read and send emails | OAuth/credentials | Local processing |

---

## Architecture

### Skill Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Message                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         LLM Provider                                 │
│                   (Ollama / Claude API)                             │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Tool/Function Calling Layer                     │   │
│   │         Vercel AI SDK tool() definitions                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                          Tool Call Request
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Skill Router                                    │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│   │  Permission  │  │   Approval   │  │   Execution  │             │
│   │    Check     │──▶│   Gateway    │──▶│   Handler   │             │
│   └──────────────┘  └──────────────┘  └──────────────┘             │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│   Is skill enabled?  Needs approval?   Execute skill                │
│   Has permission?    Show confirmation  Return result               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Skill Implementations                           │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Built-in  │  │  Sandboxed  │  │   Network   │  │    MCP    │  │
│  │   Skills    │  │   Skills    │  │   Skills    │  │  Servers  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### MCP Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Claude Cowork Clone                               │
│                    (MCP Apps Host)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   MCP Client Manager                          │   │
│  │                                                                │   │
│  │  - Discovers available MCP servers                           │   │
│  │  - Manages server connections (stdio, HTTP, WebSocket)       │   │
│  │  - Handles tool discovery and capability negotiation         │   │
│  │  - Routes tool calls to appropriate server                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│           ┌──────────────────┼──────────────────┐                   │
│           ▼                  ▼                  ▼                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │  Built-in MCP   │ │  Local MCP      │ │  Remote MCP     │       │
│  │  Server         │ │  Servers        │ │  Servers        │       │
│  │                 │ │                 │ │                 │       │
│  │  - calculator   │ │  - filesystem   │ │  - web-search   │       │
│  │  - notes        │ │  - git          │ │  - calendar     │       │
│  │  - tasks        │ │  - code-runner  │ │  - email        │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Discovery Tool (Always Available)

```typescript
// src/lib/skills/discover.ts
import { tool } from 'ai';
import { z } from 'zod';
import { skillRegistry } from './registry';

export const discoverSkillsTool = tool({
  description: `Search for available skills to help with a task. Use this when you need
    capabilities like: calculations, note-taking, task management, web search, file reading,
    diagram generation, code execution, or other actions beyond conversation.`,
  parameters: z.object({
    query: z.string().describe('What capability you need (e.g., "math", "save notes", "search web")'),
    category: z.enum(['all', 'productivity', 'developer', 'network', 'integrations'])
      .optional()
      .default('all')
      .describe('Filter by category'),
  }),
  execute: async ({ query, category }) => {
    const matches = skillRegistry.search(query, {
      category: category === 'all' ? undefined : category,
      enabledOnly: true,
    });

    // Track discovery for analytics (future)
    await trackSkillDiscovery(query, matches.map(s => s.id));

    return {
      skills: matches.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        tier: s.tier,
      })),
      message: matches.length > 0
        ? `Found ${matches.length} skill(s). They are now available for use.`
        : `No matching skills found. Try: productivity, developer, network, or integrations.`,
    };
  },
});
```

### Conversation Tool State

```typescript
// src/lib/skills/conversation-state.ts
export interface ConversationToolState {
  conversationId: string;
  loadedSkills: Set<string>;
  discoveryHistory: Array<{ query: string; results: string[]; timestamp: Date }>;
}

export class ConversationToolManager {
  private state: ConversationToolState;

  constructor(conversationId: string) {
    this.state = {
      conversationId,
      loadedSkills: new Set(),
      discoveryHistory: [],
    };
  }

  // Called when discover_skills returns results
  onSkillsDiscovered(query: string, skillIds: string[]) {
    for (const id of skillIds) {
      this.state.loadedSkills.add(id);
    }
    this.state.discoveryHistory.push({
      query,
      results: skillIds,
      timestamp: new Date(),
    });
  }

  // Build tools array for each LLM request
  getToolsForRequest(): CoreTool[] {
    const tools: CoreTool[] = [discoverSkillsTool];

    // Add all skills discovered in this conversation
    for (const skillId of this.state.loadedSkills) {
      const skill = skillRegistry.get(skillId);
      if (skill?.enabled && skill.tool) {
        tools.push(skill.tool);
      }
    }

    return tools;
  }

  // Get list of loaded skill names (for UI display)
  getLoadedSkillNames(): string[] {
    return Array.from(this.state.loadedSkills)
      .map(id => skillRegistry.get(id)?.name)
      .filter(Boolean) as string[];
  }

  // Reset when conversation ends
  reset() {
    this.state.loadedSkills.clear();
    this.state.discoveryHistory = [];
  }
}
```

### Built-in Skills (Vercel AI SDK)

```typescript
// src/lib/skills/index.ts
import { tool } from 'ai';
import { z } from 'zod';

export const calculatorSkill = tool({
  description: 'Perform mathematical calculations, unit conversions, and date math',
  parameters: z.object({
    expression: z.string().describe('The mathematical expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    // Safe math evaluation using mathjs
    const result = evaluate(expression);
    return { result, expression };
  },
});

export const noteSkill = tool({
  description: 'Create, read, update, or search notes stored locally',
  parameters: z.object({
    action: z.enum(['create', 'read', 'update', 'delete', 'search']),
    noteId: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    query: z.string().optional(),
  }),
  execute: async (params) => {
    // Interact with IndexedDB storage
    return await noteStore.handleAction(params);
  },
});

export const taskSkill = tool({
  description: 'Manage tasks and todo items',
  parameters: z.object({
    action: z.enum(['add', 'complete', 'list', 'delete', 'update']),
    taskId: z.string().optional(),
    title: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  execute: async (params) => {
    return await taskStore.handleAction(params);
  },
});
```

### Skill Registry

```typescript
// src/lib/skills/registry.ts
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  keywords: string[];  // For search matching
  tier: 'core' | 'enhanced' | 'network' | 'integration';
  category: 'productivity' | 'developer' | 'network' | 'integrations';
  requiresApproval: boolean;
  requiresNetwork: boolean;
  enabled: boolean;
  tool: CoreTool;
}

interface SearchOptions {
  category?: string;
  tier?: string;
  enabledOnly?: boolean;
}

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  register(skill: SkillDefinition) {
    this.skills.set(skill.id, skill);
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  // Search skills by query string and optional filters
  search(query: string, options: SearchOptions = {}): SkillDefinition[] {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    return Array.from(this.skills.values())
      .filter(skill => {
        // Apply filters
        if (options.enabledOnly && !skill.enabled) return false;
        if (options.category && skill.category !== options.category) return false;
        if (options.tier && skill.tier !== options.tier) return false;

        // Match against name, description, and keywords
        const searchText = [
          skill.name,
          skill.description,
          ...skill.keywords,
        ].join(' ').toLowerCase();

        // All query terms must match somewhere
        return queryTerms.every(term => searchText.includes(term));
      })
      .slice(0, 10);  // Limit results to prevent context bloat
  }

  getEnabledSkills(): SkillDefinition[] {
    return Array.from(this.skills.values())
      .filter(s => s.enabled);
  }

  // List all skills for settings UI
  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }
}
```

### Permission System

```typescript
// src/lib/skills/permissions.ts
export interface SkillPermission {
  skillId: string;
  enabled: boolean;
  autoApprove: boolean;  // Skip confirmation for this skill
  lastUsed?: Date;
  usageCount: number;
}

export class PermissionManager {
  private permissions: Map<string, SkillPermission>;

  async checkPermission(skillId: string): Promise<{
    allowed: boolean;
    requiresApproval: boolean;
  }> {
    const permission = this.permissions.get(skillId);
    if (!permission?.enabled) {
      return { allowed: false, requiresApproval: false };
    }
    return {
      allowed: true,
      requiresApproval: !permission.autoApprove,
    };
  }

  async requestApproval(
    skillId: string,
    params: unknown
  ): Promise<boolean> {
    // Show UI to user for approval
    return await showApprovalDialog(skillId, params);
  }
}
```

---

## MCP Server Integration

### Configuration

```typescript
// src/lib/mcp/config.ts
export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http' | 'websocket';
  command?: string;       // For stdio
  args?: string[];        // For stdio
  url?: string;           // For http/websocket
  enabled: boolean;
  autoStart: boolean;
}

export const defaultMCPServers: MCPServerConfig[] = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    transport: 'stdio',
    command: 'npx',
    args: ['@anthropic/mcp-server-filesystem', '/home/user'],
    enabled: false,  // Opt-in
    autoStart: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    transport: 'stdio',
    command: 'npx',
    args: ['@anthropic/mcp-server-github'],
    enabled: false,
    autoStart: false,
  },
];
```

### MCP Client Implementation

```typescript
// src/lib/mcp/client.ts
import { Client } from '@modelcontextprotocol/sdk/client';

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connect(config: MCPServerConfig): Promise<void> {
    const client = new Client({
      name: 'claude-cowork-clone',
      version: '1.0.0',
    });

    // Connect based on transport type
    if (config.transport === 'stdio') {
      await client.connect(new StdioClientTransport({
        command: config.command!,
        args: config.args,
      }));
    }

    this.clients.set(config.id, client);
  }

  async discoverTools(): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];
    for (const [id, client] of this.clients) {
      const serverTools = await client.listTools();
      tools.push(...serverTools.map(t => ({ ...t, serverId: id })));
    }
    return tools;
  }

  async callTool(serverId: string, toolName: string, args: unknown) {
    const client = this.clients.get(serverId);
    return await client?.callTool({ name: toolName, arguments: args });
  }
}
```

---

## UI Components

### Skill Settings Panel

```typescript
// src/components/SkillSettings.tsx
export function SkillSettings() {
  const { skills, toggleSkill, updatePermission } = useSkillRegistry();

  return (
    <div className="skill-settings">
      <h2>Skills & Integrations</h2>

      {['core', 'enhanced', 'network', 'integration'].map(tier => (
        <section key={tier}>
          <h3>{tierLabels[tier]}</h3>
          {skills.filter(s => s.tier === tier).map(skill => (
            <SkillToggle
              key={skill.id}
              skill={skill}
              onToggle={() => toggleSkill(skill.id)}
              onUpdatePermission={updatePermission}
            />
          ))}
        </section>
      ))}

      <section>
        <h3>MCP Servers</h3>
        <MCPServerList />
        <button onClick={addMCPServer}>Add Custom MCP Server</button>
      </section>
    </div>
  );
}
```

### Tool Approval Dialog

```typescript
// src/components/ToolApproval.tsx
export function ToolApprovalDialog({
  skill,
  params,
  onApprove,
  onDeny
}: ToolApprovalProps) {
  return (
    <Dialog>
      <DialogTitle>Approve Tool Use</DialogTitle>
      <DialogContent>
        <p>The assistant wants to use <strong>{skill.name}</strong></p>
        <pre>{JSON.stringify(params, null, 2)}</pre>

        <label>
          <input type="checkbox" /> Don't ask again for this tool
        </label>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDeny}>Deny</Button>
        <Button onClick={onApprove} variant="primary">Approve</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## Implementation Phases

### Phase 1: Core Skills Foundation
- [ ] Implement SkillRegistry with search functionality
- [ ] Implement discover_skills meta-tool
- [ ] Implement ConversationToolManager for lazy-loading
- [ ] Create calculator skill (math.js integration)
- [ ] Create note-taking skill (IndexedDB storage)
- [ ] Create task management skill
- [ ] Integrate with chat API route (tools per conversation)
- [ ] Basic tool result rendering in chat
- [ ] PermissionManager for skill enable/disable

### Phase 2: Enhanced Skills
- [ ] Sandboxed code execution (JavaScript via iframe)
- [ ] File System Access API integration
- [ ] PDF/document parsing
- [ ] Diagram generation (Mermaid)
- [ ] Tool approval workflow UI

### Phase 3: Network Skills
- [ ] Web search integration (SearXNG or Brave)
- [ ] Web page fetching and parsing
- [ ] Settings UI for network skill opt-in
- [ ] Rate limiting and caching

### Phase 4: MCP Integration
- [ ] MCP Client SDK integration
- [ ] MCP server configuration UI
- [ ] MCP tool discovery (auto-register with SkillRegistry)
- [ ] MCP Apps rendering (@mcp-ui/client)

### Phase 5: External Integrations
- [ ] OAuth flow infrastructure
- [ ] Google Calendar integration
- [ ] GitHub integration
- [ ] Notion/Linear integrations

### Phase 6: Analytics & Optimization
- [ ] Track skill discovery queries and results
- [ ] Track skill usage per conversation
- [ ] Implement usage analytics storage
- [ ] Data-driven default tools (based on usage threshold)
- [ ] Skill recommendation improvements

---

## Security Considerations

### Sandboxing Strategy

| Skill Type | Sandboxing Approach |
|------------|---------------------|
| Calculator | Expression parser (no eval) |
| Code Executor | WebAssembly sandbox / isolated iframe |
| File Access | File System Access API (user-granted) |
| Network | Server-side proxy with rate limiting |
| MCP Apps | Sandboxed iframe (CSP enforced) |

### Data Privacy

1. **No Implicit Data Sharing** - Network skills are disabled by default
2. **Explicit Consent** - OAuth flows show exactly what data is accessed
3. **Local Processing** - Use local models for sensitive operations when possible
4. **Audit Trail** - Log all tool executions for user review
5. **Data Minimization** - Only request scopes that are necessary

### Permission Model

```typescript
// Permission levels
export enum PermissionLevel {
  BLOCKED = 0,      // User explicitly blocked
  DISABLED = 1,     // Default disabled, can enable
  ENABLED = 2,      // Enabled, requires approval each time
  AUTO_APPROVE = 3, // Enabled, auto-approved
}
```

---

## Success Metrics

### Discovery Efficiency
- **Discovery Rate**: % of conversations that use discover_skills
- **Discovery Success**: % of discoveries that lead to tool usage
- **Context Savings**: Average tokens saved vs all-tools-upfront approach
- **Discovery-to-Use Latency**: Turns between discovery and first tool use

### Skill Adoption
- **Skill Adoption**: % of users enabling each skill tier
- **Conversation Usage Rate**: % of conversations using each skill (for default tool analysis)
- **Approval Rate**: Tool approval vs denial ratio
- **Completion Rate**: Successful tool executions / total attempts

### Privacy & Platform
- **Privacy Preference**: % of users using local-only vs network skills
- **MCP Adoption**: Number of custom MCP servers configured
- **Default Tool Candidates**: Skills exceeding 30% conversation usage (future)

---

## References

- [Vercel AI SDK Tools Documentation](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [MCP Apps Specification](https://modelcontextprotocol.io/docs/extensions/apps)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Pyodide (Python in WASM)](https://pyodide.org)
