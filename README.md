# Spec Engine

AI-powered software architect that transforms your app ideas into production-ready technical specifications through an adaptive interview.

## Features

- **Adaptive Interview** — AI asks targeted questions to understand your project deeply
- **6 Spec Documents** — PRD, Architecture, Database, API, Task Checklist, Project Memory
- **Multi-Provider** — OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama (local), and Custom (OpenAI-compatible)
- **BYOK & Custom Endpoint** — Bring Your Own Key, connect to DeepSeek, vLLM, LM Studio, Together AI, or any custom endpoint/reverse proxy
- **Streaming** — Real-time spec generation with live preview
- **Export** — Download all specs as ZIP

## Quick Start

```bash
# Install dependencies
npm install

# Add your API key(s) to .env.local
# Edit .env.local and set ACTIVE_PROVIDER + the matching API key

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Go to **Settings** (⚙️) and configure your LLM provider + API key
2. Click **New Project**
3. Describe your app idea
4. Answer the adaptive interview questions (5-8 questions)
5. Watch as 6 spec documents are generated in sequence
6. **Download ZIP** to get all specs

## Generated Documents

| File | Contents |
|------|----------|
| `01_PRD.md` | Product requirements, personas, user stories, feature scope |
| `02_ARCHITECTURE.md` | Tech stack, folder structure, system components |
| `03_DATABASE.md` | Entity schemas, relationships, constraints, indexes |
| `04_API_SPECS.md` | REST/GraphQL endpoints, auth, request/response contracts |
| `05_TASKS_CHECKLIST.md` | Step-by-step build plan optimized for AI coding agents |
| `PROJECT_MEMORY.md` | Context file for session continuity |

## Providers

| Provider | Key Required | Notes |
|----------|-------------|-------|
| OpenAI | Yes | GPT-4o recommended |
| Anthropic | Yes | Claude Sonnet 4 recommended |
| Google Gemini | Yes | Free tier available |
| Groq | Yes | Fast inference, free tier |
| OpenRouter | Yes | Access to many models |
| Ollama | No | Local models, no API key needed |

## License

Personal use. Built with ❤️
