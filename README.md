# Claude Cowork Clone

A multi-LLM cowork platform that replicates Claude's cowork functionality while supporting multiple LLM backends.

## Overview

This project aims to create a flexible cowork environment where users can collaborate with AI assistants powered by different LLM providers. The initial focus is on supporting:

- **Anthropic Claude** - Via Anthropic Pro subscription
- **Ollama** - For local LLM inference

## Features (Planned)

- Multi-LLM backend support with a unified interface
- Switchable LLM providers during sessions
- Local-first option with Ollama for privacy-conscious users
- Cowork-style collaborative interface
- Conversation persistence and history
- Context management across sessions

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui, assistant-ui
- **LLM Integration:** Vercel AI SDK v4
- **Storage:** IndexedDB (browser-native, no server database)

## Project Structure

```
claude-cowork-clone/
├── docs/                   # Documentation
│   ├── architecture/       # Architecture Decision Records (ADRs)
│   ├── user-stories/       # Feature requirements
│   └── dev-plans/          # Implementation plans
├── src/
│   ├── app/                # Next.js pages and API routes
│   ├── components/         # React components
│   ├── lib/                # Framework-agnostic business logic
│   ├── hooks/              # React hooks
│   └── types/              # TypeScript definitions
├── tests/                  # Test files
└── README.md
```

## Supported LLM Backends

| Provider | Type | API Key Required |
|----------|------|------------------|
| **Ollama** | Local | No |
| **Anthropic Claude** | Cloud | Yes |

## Local Development

### Prerequisites

- **Node.js 22+**
- **pnpm** (recommended) or npm
- **Ollama** - For local LLM inference

### Quick Start

```bash
# Clone the repository
git clone https://github.com/CrowBe/claude-cowork-clone.git
cd claude-cowork-clone

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start the development server
pnpm dev
```

The app runs at `http://localhost:3000`.

### Setting Up Ollama (Local LLM)

Ollama lets you run LLMs locally without API keys or cloud dependencies.

```bash
# Install Ollama
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows - download from https://ollama.ai

# Start Ollama server
ollama serve

# Pull a model (in a new terminal)
ollama pull llama3.2
```

The app will automatically detect Ollama at `http://localhost:11434`.

### Setting Up Claude (Optional)

To use Anthropic's Claude:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Development Commands

```bash
pnpm dev          # Start dev server with hot reload
pnpm build        # Production build
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm lint         # Lint code
pnpm typecheck    # Type check
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude |
| `OLLAMA_BASE_URL` | No | Ollama URL (default: `http://localhost:11434`) |

## Documentation

See the [docs/](./docs/) directory for:
- User stories
- Development plans
- Architecture decisions
- API specifications

## License

TBD

## Contributing

TBD
