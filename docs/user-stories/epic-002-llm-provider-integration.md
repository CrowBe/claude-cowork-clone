# Epic 002: LLM Provider Integration

**Status:** Draft
**Created:** 2025-01-31
**Dev Plan:** [LLM Provider Integration](../dev-plans/llm-provider-integration.md)

## Overview

Enable users to choose between multiple LLM providers (Claude Pro subscription or local Ollama) for AI-powered features, with a focus on privacy-first local inference as the default.

## Goals

1. Support both cloud (Claude) and local (Ollama) LLM providers
2. Make local-first the default for privacy
3. Zero-friction start with Ollama (no API keys required)
4. Easy provider switching without losing context
5. Clear status indicators and helpful error messages

---

## User Stories

### Phase 1: Core Provider Support

#### US-020: Select LLM Provider

**As a** user
**I want** to choose between different LLM providers
**So that** I can use my preferred AI service (local or cloud)

**Acceptance Criteria:**
- [ ] Settings page shows available providers (Ollama, Claude)
- [ ] Each provider shows its connection status (connected, unavailable, unconfigured)
- [ ] User can select active provider with a single click
- [ ] Selection persists across browser sessions
- [ ] Provider description explains trade-offs (privacy vs capability)

**Technical Notes:**
- Store preference in `preferences.md` via MemoryStore
- Use Vercel AI SDK provider abstraction

---

#### US-021: Configure Ollama (Local)

**As a** privacy-conscious user
**I want** to use Ollama for local AI inference
**So that** my data never leaves my computer

**Acceptance Criteria:**
- [ ] App auto-detects running Ollama instance on localhost:11434
- [ ] Shows list of available models from Ollama
- [ ] User can select which model to use
- [ ] Optional: Allow custom Ollama base URL for non-default setups
- [ ] Shows clear "Connected" status when Ollama is running

**Technical Notes:**
- Query Ollama API: `GET /api/tags` for model list
- Default to `llama3.2` if available

---

#### US-022: Ollama Setup Guide

**As a** new user without Ollama installed
**I want** clear instructions to set up Ollama
**So that** I can get started with local AI quickly

**Acceptance Criteria:**
- [ ] When Ollama not detected, show friendly setup instructions
- [ ] Instructions cover macOS, Linux, and Windows installation
- [ ] Include commands to pull recommended models
- [ ] "Refresh" button to re-check Ollama connection
- [ ] Link to official Ollama documentation

**Technical Notes:**
- Display in settings panel and/or first-run modal
- Check connection every 5 seconds while setup guide is visible

---

#### US-023: Configure Claude API Key

**As a** user with a Claude Pro subscription
**I want** to connect my Anthropic API key
**So that** I can use Claude's advanced capabilities

**Acceptance Criteria:**
- [ ] Secure input field for API key (masked by default)
- [ ] "Show/Hide" toggle for API key visibility
- [ ] "Test Connection" button validates the key
- [ ] Clear success/error feedback after testing
- [ ] Key stored securely (encrypted at rest)
- [ ] Option to remove/clear stored API key

**Technical Notes:**
- Use Web Crypto API for encryption
- Store encrypted key in IndexedDB (separate from preferences.md)
- Test with minimal API call (e.g., list models)

---

#### US-024: Select Claude Model

**As a** Claude user
**I want** to choose which Claude model to use
**So that** I can balance speed, cost, and capability

**Acceptance Criteria:**
- [ ] Dropdown shows available Claude models (Sonnet, Opus, Haiku)
- [ ] Each model shows brief description of use case
- [ ] Selection persists in settings
- [ ] Default to Claude 3.5 Sonnet (best general-purpose)

**Technical Notes:**
- Models: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307
- Consider showing estimated cost/speed indicators

---

### Phase 2: Chat Integration

#### US-025: Chat with Active Provider

**As a** user
**I want** to chat using my selected LLM provider
**So that** I can have AI-assisted conversations

**Acceptance Criteria:**
- [ ] Chat input sends messages to active provider
- [ ] Responses stream in real-time (not all at once)
- [ ] Chat header shows which provider/model is active
- [ ] Works with both Ollama and Claude providers
- [ ] Conversation history maintained during session

**Technical Notes:**
- Use Vercel AI SDK `useChat` hook
- Create `/api/chat` route handler
- Stream responses via `streamText()`

---

#### US-026: Provider Status in Chat

**As a** user in a chat session
**I want** to see which provider I'm using
**So that** I know where my messages are being processed

**Acceptance Criteria:**
- [ ] Small indicator in chat header shows active provider
- [ ] Indicator shows provider name and model (e.g., "Ollama - llama3.2")
- [ ] Click on indicator opens provider settings
- [ ] Status updates if provider becomes unavailable

**Technical Notes:**
- Could be a subtle badge or dropdown trigger
- Consider showing latency indicator

---

#### US-027: Handle Provider Errors Gracefully

**As a** user
**I want** clear feedback when the LLM provider fails
**So that** I understand what went wrong and how to fix it

**Acceptance Criteria:**
- [ ] Connection errors show user-friendly message (not stack trace)
- [ ] Rate limit errors explain wait time
- [ ] Invalid API key errors link to settings
- [ ] Ollama not running errors show setup guide link
- [ ] Network errors offer retry button

**Error Messages:**
| Error | User Message |
|-------|--------------|
| Ollama not running | "Ollama is not running. [Start Ollama] or [Switch to Claude]" |
| Invalid API key | "Your Claude API key is invalid. [Update in Settings]" |
| Rate limited | "Rate limit reached. Please wait a moment and try again." |
| Network error | "Connection failed. Check your internet. [Retry]" |

---

### Phase 3: Advanced Features

#### US-028: Switch Provider Mid-Conversation

**As a** user
**I want** to switch providers during a chat session
**So that** I can compare responses or work around issues

**Acceptance Criteria:**
- [ ] Quick-switch button accessible from chat interface
- [ ] Conversation context preserved when switching
- [ ] Visual indicator shows which messages used which provider
- [ ] Warn user that context may differ between providers

**Technical Notes:**
- May need to re-send context to new provider
- Consider showing provider badge per message

---

#### US-029: Test Provider Connection

**As a** user configuring providers
**I want** to test that my configuration works
**So that** I'm confident chat will work before I need it

**Acceptance Criteria:**
- [ ] "Test Connection" button for each provider
- [ ] Shows connection latency on success
- [ ] Shows specific error on failure
- [ ] For Ollama, shows number of available models
- [ ] For Claude, validates API key permissions

**Technical Notes:**
- Ollama: `GET /api/tags`
- Claude: Simple completion request with minimal tokens

---

#### US-030: Default Provider Recommendation

**As a** new user
**I want** the app to recommend a provider
**So that** I can get started quickly without research

**Acceptance Criteria:**
- [ ] First-run experience recommends Ollama for privacy
- [ ] If Ollama detected, auto-select it as default
- [ ] If Ollama not found, show setup guide prominently
- [ ] Explain trade-offs: "Local = private, Cloud = powerful"
- [ ] Allow user to skip and configure later

**Technical Notes:**
- Check Ollama on app startup
- Store "has completed setup" flag

---

## Non-Functional Requirements

### Performance
- Provider switching should complete in <500ms
- Connection tests should timeout after 5 seconds
- Chat streaming should start within 1 second

### Security
- API keys encrypted at rest using Web Crypto API
- No API keys in URL parameters or logs
- Clear API key from memory after use

### Accessibility
- All provider settings keyboard navigable
- Status indicators have text alternatives
- Error messages readable by screen readers

---

## Out of Scope (Future)

- OpenAI GPT integration
- Google Gemini integration
- Custom OpenAI-compatible endpoints
- Provider cost tracking
- Model fine-tuning
- Multi-provider comparison mode

---

## Related Documentation

- [Dev Plan: LLM Provider Integration](../dev-plans/llm-provider-integration.md)
- [ADR-001: LLM SDK Selection](../architecture/adr-001-llm-sdk-selection.md)
- [API Documentation](../api/README.md)
