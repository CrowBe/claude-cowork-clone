# ADR-008: Skills Architecture

**Status:** Approved
**Date:** 2026-02-02
**Decision:** Tiered skill system with Vercel AI SDK tools, MCP protocol support, and permission-based execution

## Context

The Claude Cowork clone needs to provide meaningful capabilities beyond text generation. Users expect AI assistants to take actions: perform calculations, manage tasks, read files, search the web, and integrate with external services. However, following our local-first philosophy, we must balance capability with privacy and user control.

Key requirements:
1. **Local-first skills** that work entirely offline
2. **Progressive enhancement** from basic to advanced capabilities
3. **Explicit consent** for network-connected or sensitive operations
4. **Extensibility** through the MCP protocol ecosystem
5. **Transparent execution** so users understand what's happening

## Options Considered

### Option 1: Custom Tool Implementation

**Approach:** Build a custom tool execution system from scratch.

**Pros:**
- Complete control over every aspect
- No external dependencies
- Tailored exactly to our needs

**Cons:**
- Significant development effort
- Must handle streaming, errors, cancellation ourselves
- No ecosystem compatibility
- Reinventing solved problems

### Option 2: Vercel AI SDK Tools Only

**Approach:** Use only Vercel AI SDK's built-in tool() function for all skills.

**Pros:**
- Native integration with our LLM layer (ADR-001)
- Well-documented, battle-tested
- Handles streaming tool calls automatically
- TypeScript-first with Zod validation

**Cons:**
- No built-in permission system
- No MCP ecosystem compatibility
- Limited to what AI SDK provides

### Option 3: MCP-Only Architecture

**Approach:** Implement all skills as MCP servers.

**Pros:**
- Ecosystem compatibility (works with Claude Desktop, VS Code, etc.)
- Standardized protocol for tool discovery and execution
- Supports rich UI through MCP Apps
- Community tools immediately usable

**Cons:**
- Overhead for simple built-in tools
- Requires running MCP servers (complexity for local skills)
- Browser-based MCP client support still evolving

### Option 4: Hybrid Approach (AI SDK + MCP)

**Approach:** Use Vercel AI SDK tools for built-in skills, MCP for extensibility.

**Pros:**
- Best of both worlds: simple built-in tools + ecosystem extensibility
- Native streaming with AI SDK
- MCP for advanced/external integrations
- Progressive adoption (start simple, add MCP later)
- Matches our phased development approach

**Cons:**
- Two tool systems to maintain
- Need to unify tool discovery UI
- Slightly more complex architecture

## Decision

**We will implement a hybrid tiered skill architecture:**

1. **Built-in Skills** - Implemented as Vercel AI SDK tools for core functionality
2. **MCP Skills** - Support MCP servers for extensibility and ecosystem compatibility
3. **Permission Layer** - Custom middleware for consent and approval workflows
4. **Unified Registry** - Single interface for all skills regardless of implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Skill Registry                                │
│                   (Unified skill management)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────┐              │
│  │   Built-in Skills    │    │     MCP Skills       │              │
│  │  (Vercel AI SDK)     │    │   (MCP Protocol)     │              │
│  │                      │    │                      │              │
│  │  • Calculator        │    │  • MCP Servers       │              │
│  │  • Notes             │    │  • Custom Tools      │              │
│  │  • Tasks             │    │  • MCP Apps UI       │              │
│  │  • Memory Recall     │    │                      │              │
│  │  • Code Execution    │    │                      │              │
│  │  • File Reading      │    │                      │              │
│  │  • Web Search        │    │                      │              │
│  └──────────────────────┘    └──────────────────────┘              │
│            │                           │                            │
│            └───────────┬───────────────┘                            │
│                        ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Permission Layer                            │  │
│  │                                                                │  │
│  │  • Check if skill enabled                                    │  │
│  │  • Determine if approval required                            │  │
│  │  • Show approval dialog if needed                            │  │
│  │  • Log execution for transparency                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                        │                                            │
│                        ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Execution Layer                             │  │
│  │                                                                │  │
│  │  • Built-in: Direct function execution                       │  │
│  │  • Sandboxed: Iframe/WASM execution                          │  │
│  │  • Network: Server-side proxy                                │  │
│  │  • MCP: Protocol-based RPC                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Skill Tiers

| Tier | Description | Default | Network | Examples |
|------|-------------|---------|---------|----------|
| **Core** | Safe, local-only skills | Enabled | No | Calculator, Notes, Tasks |
| **Enhanced** | Local with sandboxing | Enabled | No | Code Execution, File Reading |
| **Network** | Requires internet access | Disabled | Yes | Web Search, Web Fetch |
| **Integration** | External service connection | Disabled | Yes | Calendar, GitHub, Notion |

### Implementation Details

#### Skill Definition Interface

```typescript
interface SkillDefinition {
  // Identity
  id: string;
  name: string;
  description: string;
  icon: string;

  // Classification
  tier: 'core' | 'enhanced' | 'network' | 'integration';

  // Permissions
  requiresApproval: boolean;
  requiresNetwork: boolean;
  defaultEnabled: boolean;

  // Implementation
  type: 'builtin' | 'mcp';
  tool?: CoreTool;           // For builtin (AI SDK tool)
  mcpServer?: string;        // For MCP (server ID)
  mcpToolName?: string;      // For MCP (tool name on server)
}
```

#### Built-in Skill Example

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import * as mathjs from 'mathjs';

export const calculatorSkill: SkillDefinition = {
  id: 'calculator',
  name: 'Calculator',
  description: 'Perform math, unit conversions, and date calculations',
  icon: 'calculator',
  tier: 'core',
  requiresApproval: false,
  requiresNetwork: false,
  defaultEnabled: true,
  type: 'builtin',
  tool: tool({
    description: 'Evaluate mathematical expressions safely',
    parameters: z.object({
      expression: z.string().describe('Math expression to evaluate'),
    }),
    execute: async ({ expression }) => {
      const result = mathjs.evaluate(expression);
      return { expression, result: String(result) };
    },
  }),
};
```

#### Permission Middleware

```typescript
class PermissionMiddleware {
  async checkAndExecute(
    skillId: string,
    params: unknown,
    execute: () => Promise<unknown>
  ): Promise<ToolResult> {
    const skill = registry.get(skillId);
    const permission = await this.getPermission(skillId);

    // Check if enabled
    if (!permission.enabled) {
      return { error: `Skill "${skill.name}" is disabled` };
    }

    // Check if approval needed
    if (skill.requiresApproval && !permission.autoApprove) {
      const approved = await this.requestApproval(skill, params);
      if (!approved) {
        return { error: 'User denied tool execution' };
      }
    }

    // Execute and log
    const startTime = Date.now();
    try {
      const result = await execute();
      await this.logExecution(skillId, params, result, Date.now() - startTime);
      return { success: true, result };
    } catch (error) {
      await this.logExecution(skillId, params, { error }, Date.now() - startTime);
      return { error: error.message };
    }
  }
}
```

#### MCP Integration

```typescript
class MCPSkillAdapter {
  private mcpClient: MCPClientManager;

  async registerMCPTools(serverId: string): Promise<SkillDefinition[]> {
    const serverTools = await this.mcpClient.discoverTools(serverId);

    return serverTools.map(tool => ({
      id: `mcp:${serverId}:${tool.name}`,
      name: tool.name,
      description: tool.description,
      icon: 'puzzle',
      tier: 'network',  // MCP tools assumed to need network
      requiresApproval: true,
      requiresNetwork: true,
      defaultEnabled: false,
      type: 'mcp',
      mcpServer: serverId,
      mcpToolName: tool.name,
    }));
  }

  async executeMCPTool(skill: SkillDefinition, params: unknown) {
    return this.mcpClient.callTool(
      skill.mcpServer!,
      skill.mcpToolName!,
      params
    );
  }
}
```

### Sandboxing Strategy

| Skill Type | Approach | Rationale |
|------------|----------|-----------|
| Calculator | Expression parser (mathjs) | Never uses eval(), safe by design |
| Code Execution | Isolated iframe + WebWorker | JavaScript sandboxed from main context |
| Python | Pyodide (WASM) | Runs in WebAssembly, no system access |
| File Access | File System Access API | Browser-mediated, user grants permission |
| Network | Server-side proxy | Rate limiting, logging, URL validation |
| MCP Apps | Sandboxed iframe + CSP | Content Security Policy enforced |

### UI Components

1. **Skill Settings Panel** - View, enable/disable skills by tier
2. **Tool Approval Dialog** - Confirm sensitive tool executions
3. **Tool Result Display** - Show tool inputs/outputs in chat
4. **MCP Server Config** - Add and manage MCP servers

### Lazy-Loading Tool Discovery

To avoid context bloat from sending all tool definitions with every request, we implement a **discovery-based pattern** where tools are loaded on-demand during conversations.

#### Problem

Sending 20+ tool schemas with every LLM request wastes context tokens on capabilities that may never be used. As the skill library grows, this becomes increasingly inefficient.

#### Solution: Discovery Tool

By default, only a `discover_skills` meta-tool is included in the system context. The LLM uses this to find and load relevant tools as needed.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Default Context (Minimal)                     │
│                                                                  │
│   Tools: [ discover_skills ]                                    │
│                                                                  │
│   System: "Use discover_skills to find capabilities when you    │
│   need to perform actions like calculations, saving notes,      │
│   searching the web, or other tasks."                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  User: "What's 15% of 847?"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│   LLM calls: discover_skills({ query: "math calculation" })     │
│                                                                  │
│   Result: {                                                     │
│     skills: [{ id: "calculator", name: "Calculator", ... }],    │
│     message: "Found 1 skill. It's now available for use."       │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  Tool injected into conversation
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next Turn Context                             │
│                                                                  │
│   Tools: [ discover_skills, calculator ]  ◄── Now available    │
│                                                                  │
│   LLM calls: calculator({ expression: "847 * 0.15" })           │
│   Result: { result: "127.05" }                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Discovery Tool Implementation

```typescript
const discoverSkillsTool = tool({
  description: `Search for available skills to help with a task. Use this when
    you need capabilities like: calculations, note-taking, task management,
    web search, file reading, diagram generation, or other actions.`,
  parameters: z.object({
    query: z.string().describe('What capability you need'),
    category: z.enum(['all', 'productivity', 'developer', 'network', 'integrations'])
      .optional()
      .describe('Filter by category'),
  }),
  execute: async ({ query, category }) => {
    const matches = skillRegistry.search(query, { category, enabledOnly: true });
    return {
      skills: matches.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        tier: s.tier,
      })),
      message: matches.length > 0
        ? `Found ${matches.length} skill(s). They are now available for use.`
        : `No matching skills found. Available categories: productivity, developer, network, integrations.`,
    };
  },
});
```

#### Conversation State Management

```typescript
interface ConversationToolState {
  loadedSkills: Set<string>;  // Skills discovered in this conversation
}

class ConversationToolManager {
  private state: ConversationToolState = { loadedSkills: new Set() };

  // Called when discover_skills returns results
  onSkillsDiscovered(skillIds: string[]) {
    for (const id of skillIds) {
      this.state.loadedSkills.add(id);
    }
  }

  // Build tools array for each LLM request
  getToolsForRequest(): CoreTool[] {
    const tools: CoreTool[] = [discoverSkillsTool];

    // Add all discovered skills for this conversation
    for (const skillId of this.state.loadedSkills) {
      const skill = skillRegistry.get(skillId);
      if (skill?.tool) {
        tools.push(skill.tool);
      }
    }

    return tools;
  }

  // Reset when conversation ends
  reset() {
    this.state.loadedSkills.clear();
  }
}
```

#### Context Size Benefits

| Scenario | All Tools Upfront | Discovery Pattern |
|----------|-------------------|-------------------|
| Initial request | ~3000 tokens | ~200 tokens |
| After using 3 tools | ~3000 tokens | ~650 tokens |
| Conversation needing no tools | ~3000 tokens | ~200 tokens |
| 50+ skills available | ~7500+ tokens | ~200 tokens (initial) |

#### Future: Frequently-Used Tools

Once we have usage analytics, commonly-used tools may be included by default to reduce discovery overhead:

```typescript
// Future implementation after gathering usage data
const FREQUENTLY_USED_THRESHOLD = 0.3;  // Used in 30%+ of conversations

async function getDefaultTools(): Promise<string[]> {
  const analytics = await getSkillUsageAnalytics();
  return analytics
    .filter(s => s.usageRate >= FREQUENTLY_USED_THRESHOLD)
    .map(s => s.skillId);
}
```

This data-driven approach ensures we only add tools to the default context when their usage justifies the token cost.

## Consequences

### Positive

- **Privacy-first** - Local skills work without any network
- **Progressive capability** - Users opt-in to more powerful features
- **Ecosystem compatibility** - MCP support enables third-party tools
- **Transparent execution** - Users see exactly what tools do
- **Developer-friendly** - AI SDK tools are simple to create
- **Future-proof** - MCP Apps support enables rich tool UIs

### Negative

- **Two systems** - Must maintain both AI SDK and MCP paths
- **Permission complexity** - Approval workflows add UX friction
- **MCP overhead** - Running MCP servers adds complexity
- **Sandboxing limits** - Some capabilities constrained by browser security

### Mitigations

- Unified SkillRegistry abstracts implementation differences
- Smart approval defaults (auto-approve for safe operations)
- Built-in MCP servers for common use cases
- Clear documentation of sandbox limitations

## Implementation Phases

1. **Phase 1** - Core built-in skills (calculator, notes, tasks)
2. **Phase 2** - Enhanced skills with sandboxing (code, files)
3. **Phase 3** - Network skills with opt-in (search, fetch)
4. **Phase 4** - MCP integration and external services

## References

- [Vercel AI SDK Tools](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](https://modelcontextprotocol.io/docs/extensions/apps)
- [Pyodide](https://pyodide.org) - Python in WebAssembly
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- ADR-001: LLM SDK Selection
- ADR-003: Chat UI Library Selection
