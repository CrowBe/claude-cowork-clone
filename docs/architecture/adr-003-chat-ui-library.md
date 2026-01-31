# ADR-003: Chat UI Library Selection

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Use assistant-ui with @mcp-ui/client for MCP Apps Host support

## Context

We need a React component library for building the chat interface. The library must:
- Integrate with Vercel AI SDK (our chosen LLM abstraction - see ADR-001)
- Handle streaming responses, auto-scrolling, and real-time updates
- Support tool call rendering for AI agents
- Provide accessible, production-ready components
- Optionally support MCP Apps protocol for rendering interactive tool UIs

## Options Considered

### Option 1: assistant-ui + @mcp-ui/client

**Pros:**
- First-class Vercel AI SDK integration via `@assistant-ui/react-ai-sdk`
- 50k+ monthly downloads, production-proven (LangChain, Stack AI)
- Composable Radix-style primitives for custom UX
- shadcn/ui theming (matches our likely design system)
- Handles streaming, auto-scroll, markdown, code highlighting out-of-box
- Active development (111+ contributors, YC-backed)
- @mcp-ui/client adds MCP Apps Host capability for interactive tool UIs

**Cons:**
- Two packages to maintain (assistant-ui + mcp-ui)
- MCP Apps is relatively new standard (January 2026)
- Not Vercel's official solution

### Option 2: AI Elements (Vercel)

**Pros:**
- Official Vercel library, guaranteed AI SDK compatibility
- 30+ purpose-built components (chat, workflow, artifacts)
- Built on shadcn/ui
- Includes workflow/canvas components for visual builders

**Cons:**
- Newer library (released 2025), smaller community
- Less composable than assistant-ui (more opinionated)
- No MCP Apps support
- Tighter coupling to Next.js

### Option 3: Build Custom Components

**Pros:**
- Full control over every aspect
- No external dependencies
- Exactly what we need, nothing more

**Cons:**
- Significant development time
- Must handle streaming, auto-scroll, accessibility ourselves
- Reinventing solved problems
- Ongoing maintenance burden

### Option 4: shadcn/ui Chat Components Only

**Pros:**
- Lightweight, copy-paste components
- Full ownership of code
- No runtime dependencies

**Cons:**
- No AI-specific features (streaming, tool rendering)
- Must build AI SDK integration ourselves
- Limited to basic chat patterns

## Decision

**We will use assistant-ui as the primary chat UI library, with @mcp-ui/client for MCP Apps Host support.**

### Packages

| Package | Purpose | Version |
|---------|---------|---------|
| `@assistant-ui/react` | Core chat UI components | ^0.11.x |
| `@assistant-ui/react-ai-sdk` | Vercel AI SDK integration | ^0.11.x |
| `@mcp-ui/client` | MCP Apps rendering (optional) | ^1.x |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              @assistant-ui/react                         │    │
│  │  - Thread (message list)                                │    │
│  │  - Composer (input area)                                │    │
│  │  - AssistantMessage / UserMessage                       │    │
│  │  - ToolUI (custom tool renderers)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           @assistant-ui/react-ai-sdk                     │    │
│  │  - useChatRuntime (bridges to AI SDK)                   │    │
│  │  - AssistantChatTransport                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              @mcp-ui/client (Optional)                   │    │
│  │  - AppRenderer (sandboxed iframe for MCP Apps)          │    │
│  │  - Tool UI resource rendering                           │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                    Vercel AI SDK (ADR-001)                       │
│              streamText, useChat, tool definitions               │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Pattern

```typescript
// Runtime setup with AI SDK integration
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider, Thread } from "@assistant-ui/react";

function ChatPage() {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}

// MCP Apps rendering (when tool returns UI resource)
import { AppRenderer } from "@mcp-ui/client";

function MCPToolUI({ toolName, toolResult, mcpClient }) {
  return (
    <AppRenderer
      client={mcpClient}
      toolName={toolName}
      toolResult={toolResult}
      sandbox="allow-scripts"
    />
  );
}
```

### Rationale

1. **AI SDK Compatibility** - Dedicated `@assistant-ui/react-ai-sdk` package ensures seamless integration with our existing AI SDK choice
2. **Production-Proven** - 50k+ monthly downloads, used by LangChain, Stack AI, Athena Intelligence
3. **Composable Architecture** - Radix-style primitives allow custom UX while handling complex streaming logic
4. **MCP Apps Future-Proofing** - @mcp-ui/client enables us to become an MCP Apps Host, rendering interactive tool UIs from MCP servers
5. **Theming Consistency** - shadcn/ui base matches modern React design patterns
6. **Active Maintenance** - YC-backed with 111+ contributors

## Consequences

### Positive
- Fast time-to-working-chat-UI
- Streaming, accessibility, and auto-scroll handled automatically
- Can render MCP Apps from any compatible MCP server
- Customizable without forking
- Strong TypeScript support

### Negative
- Dependency on external library for core UI
- MCP Apps adds complexity if we don't use it
- Must track assistant-ui releases for breaking changes

### Mitigations
- Pin versions to known-good releases
- MCP Apps integration is optional/progressive (add when needed)
- Components are copy-paste style, can eject if needed
- Active community means issues get resolved quickly

## MCP Apps Host Capability

By including @mcp-ui/client, our application becomes an **MCP Apps Host**, meaning:

1. **Tool UIs** - MCP servers can return interactive HTML interfaces that render in our chat
2. **Sandboxed Execution** - All MCP App content runs in sandboxed iframes
3. **Ecosystem Compatibility** - Works with MCP Apps from any compliant server
4. **Progressive Enhancement** - Falls back to text if no UI resource provided

This positions us alongside Claude Desktop, VS Code, and Goose as MCP Apps-compatible hosts.

## References

- [assistant-ui Documentation](https://www.assistant-ui.com/docs)
- [assistant-ui AI SDK Integration](https://www.assistant-ui.com/docs/runtimes/ai-sdk/use-chat)
- [@assistant-ui/react-ai-sdk](https://www.npmjs.com/package/@assistant-ui/react-ai-sdk)
- [MCP-UI GitHub](https://github.com/MCP-UI-Org/mcp-ui)
- [MCP Apps Specification](https://modelcontextprotocol.io/docs/extensions/apps)
- [AI Elements (Alternative)](https://github.com/vercel/ai-elements)
