# ThreatForge — Full Project Audit

**Date:** 2026-06-24  
**Auditor:** OpenClaw  
**Verdict:** 🔶 NEEDS_WORK — Solid MVP foundation, several security issues, missing features, and improvements needed

---

## 🔴 CRITICAL — Security Issues

### 1. No Authentication / Authorization (API is wide open)
**All routes** (`/api/projects`, `/api/config`, `/api/analyze`) have zero auth. Anyone with network access can:
- Read all projects and threat models (potential intelligence leak)
- Delete all projects
- Read/write API keys (the PUT `/api/config` endpoint stores full plaintext keys)
- Trigger LLM calls (spend your money)

**Fix:** Add at minimum:
- API key / bearer token auth middleware for all `/api/*` routes
- Consider a simple env-var-based admin password for single-user use
- Rate limiting on `/api/analyze` to prevent cost abuse

### 2. API Keys Stored in Plaintext JSON
`server/data/settings.json` stores `openai_api_key` and `anthropic_api_key` in plaintext on disk. Combined with no auth, this means anyone who accesses the API can read your keys.

**Fix:** 
- Encrypt API keys at rest (even simple AES with a derived key from a master secret)
- Or use OS keyring / env vars only (don't persist keys to disk)
- At minimum, ensure the `data/` directory has restricted file permissions

### 3. No Rate Limiting on LLM Endpoints
The `/api/analyze` routes call paid LLM APIs with no rate limiting. An attacker could drain your OpenAI/Anthropic credits.

**Fix:** Add `express-rate-limit` on analysis endpoints (e.g., 10 req/hour for unauthenticated).

### 4. SSRF via `openai_base_url` and `ollama_base_url`
The config endpoint accepts arbitrary base URLs. Combined with no auth, someone can set `openai_base_url` to an internal service URL and use your server as a proxy (SSRF).

**Fix:** Validate that base URLs match allowed patterns (`api.openai.com`, `*.anthropic.com`, `localhost:11434`, etc.)

### 5. `express.json({ limit: '5mb' })` — Unbounded Architecture Objects
5MB body limit is generous for what's essentially a form. Combined with no auth, this is a minor DoS vector.

**Fix:** 100KB-500KB is plenty for architecture descriptions. Lower the limit.

---

## 🟠 HIGH — Bugs & Issues

### 6. Race Condition on JSON File Writes
`saveProjects()` and `saveSettings()` use synchronous `fs.writeFileSync` with no locking. If two requests hit simultaneously (e.g., concurrent analyses), one write will overwrite the other. With in-memory arrays, this causes data loss.

**Fix:** Use a write queue/mutex pattern, or switch to a proper database (SQLite via `better-sqlite3` would be perfect — it was mentioned in README but the code uses JSON files).

### 7. `dotenv` Is a Dependency but Never Used
`server/package.json` lists `dotenv` but `server/src/index.js` never calls `require('dotenv').config()`. The `.env.example` suggests env-var-based config, but the app actually reads from `settings.json`.

**Fix:** Either remove `dotenv` or add env-var fallback for initial bootstrapping (e.g., use env vars if `settings.json` doesn't exist).

### 8. `handlebars` Is a Dependency but Never Used
`handlebars@^4.7.8` is in `server/package.json` but never imported anywhere. Dead dependency.

**Fix:** Remove it.

### 9. README Says "better-sqlite3" But Code Uses JSON Files
README: `"Backend: Node.js + Express + better-sqlite3"`  
Reality: Uses JSON file storage (`init.js`)

**Fix:** Fix the README to say "JSON file storage" or migrate to SQLite.

### 10. Severity Scoring Bug — Double-Counting
In `threatEngine.js`, severity is clamped at 1-25:
```js
severity: clamp(
  threat.severity || (threat.likelihood || 3) * (threat.impact || 3),
  1, 25
),
```
But `analyze.js` defines severity bands as:
- Critical: ≥15
- High: 10-14
- Medium: 5-9
- Low: <5

If the LLM returns `likelihood: 3, impact: 3` but no `severity` field, the computed severity is 9 (medium). But if it also returns `severity: 20`, that's used directly. The LLM might return inconsistent values where `severity` doesn't match `likelihood × impact`.

**Fix:** Always compute severity from `likelihood × impact` and ignore the LLM's severity field. Or document that severity is the product.

### 11. `client/dist/` Committed to Git
The built frontend (`client/dist/`) with 230KB of JS is in the repo. This bloats the git history and causes merge conflicts.

**Fix:** Add `client/dist/` to `.gitignore`, remove it from tracking. Users build locally or via Docker.

---

## 🟡 MEDIUM — Missing Features & UX

### 12. No Input Validation on Architecture Data
`analyze.js` checks that `architecture.components` exists and has length > 0, but doesn't validate the shape. Malformed data (missing fields, wrong types) will just produce empty/weak analysis.

**Fix:** Add schema validation with `zod` or `joi` at the route level.

### 13. No Error Toasts/Notifications on Frontend
Error messages appear as inline banners that disappear on navigation. No global toast system.

**Fix:** Add a toast/notification component (or use `sonner`, `react-hot-toast`).

### 14. No Loading State During Re-Analysis
The "Re-analyze" button has a spinner, but the threat list still shows old data during analysis. User might think it's done.

**Fix:** Show a loading overlay or skeleton on the threat list during re-analysis.

### 15. No Confirmation Before Re-Analysis
Re-analyzing replaces all threats with no confirmation and no undo. If the LLM returns worse results, you can't get the old ones back.

**Fix:** Add a confirmation dialog, or version threats (keep last N analyses).

### 16. Architecture Not Editable After Creation
Once you create a project, you can't modify the architecture. If you made a typo or want to add a component, you have to create a new project.

**Fix:** Add an "Edit Architecture" button that opens the form pre-filled.

### 17. No PDF/HTML Export
Only JSON export. A security professional would want a formatted report to share with stakeholders.

**Fix:** Add HTML report generation (or PDF via `puppeteer`/`jsPDF`). Could be a nice "Pro" feature.

### 18. No Project Search/Sort
Projects page shows all projects sorted by date. No search or sort options.

**Fix:** Add search by name, sort by date/threat count/severity.

### 19. Docker Image Has No `.dockerignore`
No `.dockerignore` file. `node_modules` from the host could leak into the Docker build context.

**Fix:** Add `.dockerignore` excluding `node_modules/`, `data/`, `.env`, `.git/`.

---

## 🔵 LOW — Code Quality & Polish

### 20. No Tests
Zero test files anywhere. No unit tests, no integration tests, no E2E.

**Fix (priority order):**
- Unit tests for `threatEngine.js` (parse normalization, severity scoring)
- Unit tests for `db/init.js` (CRUD operations)
- Integration tests for API routes
- Consider `vitest` for frontend, `jest` or `vitest` for backend

### 21. No Logging / Structured Logs
Only `console.error` in catch blocks. No request logging, no audit trail.

**Fix:** Add `morgan` or `pino` for HTTP request logging. Log who called what (once auth exists).

### 22. No 404 Handler
Unknown API routes fall through to the React SPA catch-all, returning HTML for API requests.

**Fix:** Add a `404` JSON handler before the SPA fallback:
```js
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
```

### 23. Hardcoded GitHub URL in Layout
`Layout.jsx` has `https://github.com/aiymfine/threatforge` hardcoded.

**Fix:** Minor — but could read from an env var or config for forks.

### 24. Unused `devDependencies` in Root `package.json`
Only `concurrently` is listed. `dotenv` and `handlebars` are in server deps but unused (see #7, #8).

### 25. `cors()` With No Options
`app.use(cors())` allows all origins. Fine for local dev, dangerous for deployment.

**Fix:** Configure CORS to allow specific origins, or at least document that it's wide-open.

### 26. Frontend `index.css` Has Minimal Styles
Only Tailwind directives + a scrollbar style. No custom animations or transitions beyond what Tailwind provides. The UI works but could use more polish.

### 27. No Favicon / PWA Manifest
No favicon, no `manifest.json`, no app icons. Looks bare in browser tabs.

**Fix:** Add a shield icon favicon (you can generate one from the emoji).

### 28. `uuid` Package Can Be Replaced
The `uuid` package is deprecated for new projects. Node.js 20 (which is the Docker base) has built-in `crypto.randomUUID()`.

**Fix:** Replace `const { v4: uuid } = require('uuid')` with `crypto.randomUUID()` — zero dependencies.

---

## 🟢 GOOD — What's Working Well

- Clean React SPA with good dark theme UI
- STRIDE prompt engineering is solid — detailed system prompt with good guidelines
- Multi-provider LLM support with clean abstraction
- JSON fallback parsing in threatEngine (tries regex extraction if direct parse fails)
- Severity scoring with CWE/OWASP references
- Category badges with color coding and progress bars
- Docker setup is clean and simple
- Project management CRUD works correctly
- Filter/search on threat results is smooth

---

## 🚀 Feature Ideas (Beyond Fixes)

| Feature | Effort | Impact |
|---------|--------|--------|
| **Architecture diagram** — visual representation of components + flows | High | Very High |
| **STRIDE + DREAD combo** — add DREAD scoring alongside | Low | Medium |
| **Compare analyses** — diff two threat models for the same project | Medium | High |
| **Threat history** — keep past analyses, track mitigation progress | Medium | High |
| **Import/export architecture** — YAML/JSON template sharing | Low | Medium |
| **LLM streaming** — show threats as they're generated | Medium | High (UX) |
| **Multi-language UI** — i18n support | Medium | Low (niche) |
| **SSO/API key auth** — proper auth for team use | Medium | Critical |
| **Report generation** — HTML/PDF reports for compliance | Medium | High |
| **Architecture templates** — pre-built templates for common patterns (e-commerce, SaaS, etc.) | Low | High |
| **CWE/OWASP link enrichment** — clickable links to CWE/OWASP details | Low | Medium |

---

## Recommended Fix Priority

1. **🔴 Add auth + rate limiting** (security, blocks #1-5)
2. **🔴 Fix data race condition** (use SQLite or write mutex, #6)
3. **🟠 Remove dead deps + fix README** (#7, #8, #9)
4. **🟠 Remove `client/dist/` from git** (#11)
5. **🟡 Add `.dockerignore`** (#19)
6. **🟡 Add input validation** (#12)
7. **🟡 Add edit architecture feature** (#16)
8. **🔵 Add 404 handler + restrict CORS** (#22, #25)
9. **🔵 Replace `uuid` with `crypto.randomUUID()`** (#28)
10. **🔵 Add basic tests** (#20)
