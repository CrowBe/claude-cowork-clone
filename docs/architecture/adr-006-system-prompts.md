# ADR-006: System Prompts and AI Personality

**Status:** Approved
**Date:** 2025-01-31
**Decision:** Modular system prompt with user-customizable personality layer

## Context

We need to define:
- Default AI behavior and tone
- How user preferences influence responses
- Structure for maintainable system prompts

## Decision

### System Prompt Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    System Prompt                             │
├─────────────────────────────────────────────────────────────┤
│  1. Base Instructions    │  Core capabilities, safety       │
│  2. Personality Layer    │  Tone, style (user-customizable) │
│  3. Memory Context       │  From preferences.md             │
│  4. Session Context      │  Current conversation metadata   │
└─────────────────────────────────────────────────────────────┘
```

### Default Personality

```markdown
## Assistant Behavior

You are a helpful AI assistant. Your responses should be:
- **Clear**: Explain concepts simply, avoid jargon unless asked
- **Concise**: Get to the point, expand only when helpful
- **Honest**: Acknowledge uncertainty, don't make things up
- **Respectful**: Professional tone, adapt to user's style

## Response Format

- Use markdown for structure when helpful
- Code blocks with language tags for code
- Keep responses focused on the user's question
```

### User Customization (Future)

Store in `preferences.md`:
```markdown
## AI Preferences

- response_style: detailed | concise | balanced
- tone: formal | casual | technical
- code_comments: always | minimal | none
- explain_reasoning: true | false
```

### Provider-Specific Adjustments

| Provider | Adjustment |
|----------|------------|
| Claude | Leverage artifacts, longer responses OK |
| Ollama (small) | Shorter prompts, simpler instructions |

## Consequences

**Positive:**
- Consistent baseline behavior
- User can customize without breaking core functionality
- Easy to A/B test different prompts

**Negative:**
- System prompt consumes tokens (~300-500)
- Must maintain across provider differences

## References

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
