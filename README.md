<p align="center">
  <h1 align="center">🛡️ ThreatForge</h1>
  <p align="center"><strong>AI-Powered Threat Modeling</strong></p>
  <p align="center">Automatically identify vulnerabilities in your system architecture using the STRIDE methodology.</p>
</p>

---

## What is ThreatForge?

ThreatForge takes a description of your system architecture and uses AI to generate a comprehensive threat model. It identifies potential attacks across all six STRIDE categories — **S**poofing, **T**ampering, **R**epudiation, **I**nformation Disclosure, **D**enial of Service, **E**levation of Privilege — and provides actionable mitigations for each.

No more whiteboard sessions that never get documented. No more guessing what you might have missed. Feed ThreatForge your architecture, get a professional threat model in seconds.

## Features

- 🤖 **AI-Powered Analysis** — Uses LLMs to reason about threats like a real security architect
- 🔍 **STRIDE Methodology** — Industry-standard threat classification framework
- 📊 **Severity Scoring** — Likelihood × Impact with Critical/High/Medium/Low ratings
- 🏷️ **CWE & OWASP References** — Links to established vulnerability classifications
- 🔎 **Filterable Results** — Search, filter by category or severity, expand for details
- 💾 **Project Management** — Save, reload, and re-analyze threat models
- 📤 **Export** — Download threat models as JSON
- 🆓 **BYOK** — Bring Your Own Key: use OpenAI, Anthropic, or Ollama (free, local)
- 🐳 **Docker** — One-command deployment
- 🌙 **Dark Theme** — Because security people work at night

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/aiymfine/threatforge.git
cd threatforge
cp .env.example .env   # Edit with your API key
docker compose up -d
```

Open http://localhost:3100

### Option 2: Node.js

```bash
git clone https://github.com/aiymfine/threatforge.git
cd threatforge
npm run setup          # Install both server + client dependencies
cp .env.example .env   # Edit with your API key
npm run dev            # Start both server and client
```

Open http://localhost:5173 (dev) or http://localhost:3100 (production)

## Configuration

### Security

ThreatForge supports optional API authentication via `TF_ADMIN_KEY`:

```bash
# In .env
TF_ADMIN_KEY=your-secret-key-here
```

When set, all API routes require `Authorization: Bearer <key>`. The frontend will prompt for the key on first access. The health check endpoint (`/api/health`) remains accessible without auth for monitoring.

**Additional security features:**
- Rate limiting on analysis endpoints (30 requests/hour)
- SSRF protection on LLM base URLs (blocks internal/private IPs)
- Input validation with size limits
- CORS configurable via `CORS_ORIGIN` env var

### LLM Provider

ThreatForge supports three providers:

| Provider | Cost | Quality | Setup |
|----------|------|---------|-------|
| **OpenAI** | ~$0.01/analysis | ⭐⭐⭐⭐⭐ | Set `OPENAI_API_KEY` in `.env` |
| **Anthropic** | ~$0.02/analysis | ⭐⭐⭐⭐⭐ | Set `ANTHROPIC_API_KEY` in `.env` |
| **Ollama** | Free | ⭐⭐⭐⭐ | Install [Ollama](https://ollama.ai), run `ollama pull llama3.1` |

OpenAI-compatible APIs (Together AI, Groq, DeepInfra, etc.) are supported by changing `OPENAI_BASE_URL`.

### Environment Variables

See [.env.example](.env.example) for all options.

## How It Works

1. **Describe your architecture** — Add components, data flows, trust boundaries, and external dependencies
2. **ThreatForge analyzes** — The AI applies STRIDE methodology to every component and data flow
3. **Review results** — Browse threats by category, severity, or search for specific concerns
4. **Act on mitigations** — Each threat includes specific, actionable remediation steps

## Tech Stack

- **Backend:** Node.js + Express + JSON file storage
- **Frontend:** React + Vite + Tailwind CSS
- **AI:** OpenAI / Anthropic / Ollama
- **Containerization:** Docker + Docker Compose

## Example Output

A typical analysis of a web application + API + database architecture identifies:
- 20-30 unique threats across all STRIDE categories
- Severity-ranked with likelihood and impact scores
- Specific mitigations with implementation details
- CWE and OWASP Top 10 references where applicable
- Real-world attack scenarios for each threat

## License

MIT

---

<p align="center">
  Built with 🔴 by security people, for security people.
</p>
