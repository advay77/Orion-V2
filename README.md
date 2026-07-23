# Orion

Multi-agent orchestration console for planning an objective, running specialized LLM agents in parallel waves, streaming progress over SSE, and turning model output into a previewable project workspace (VFS → ZIP).

Not an operating system — an agent console with an artifact IDE.

## Stack

- **Next.js** (App Router) + React + TypeScript
- **OpenRouter** for open-weight models
- Orchestrator, planning engine, shared in-request memory
- Artifact engine: parse → detect framework → validate → preview
- Monaco editor + live iframe preview

## Quick start

```bash
# .env
OPENROUTER_API_KEY=sk-or-...

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter an objective, choose a priority (`balanced` / `quality` / `speed` / `cost`), and run.

Optional model overrides:

```env
PLANNER_MODEL=deepseek/deepseek-chat-v3.1:free
ENGINEERING_MODEL=qwen/qwen3-coder:free
RESEARCH_MODEL=deepseek/deepseek-r1:free
MARKETING_MODEL=qwen/qwen3.6-plus:free
```

## How it works

```
Objective
  → Planner agent (task graph)
  → Orchestrator (dependency waves, retries)
  → Engineering / Research / Marketing agents
  → Artifact engine (files + validation)
  → SSE stream → console UI (agents + workspace)
```

Defaults live in [`lib/orion/model-config.ts`](lib/orion/model-config.ts). Runtime routing / ranking lives in [`lib/orion/model-router.ts`](lib/orion/model-router.ts).

## API

| Route | Purpose |
|-------|---------|
| `POST /api/orion/execute` | Run plan; SSE events (`planning`, `plan_created`, `task_*`, `result`, …) |
| `GET/POST /api/orion/plan` | Plan helpers |
| `GET /api/orion/state` | Execution snapshot |

Execute is rate-limited (see [`proxy.ts`](proxy.ts)).

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — component layout
- [`SETUP_GUIDE.md`](SETUP_GUIDE.md) — troubleshooting

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
```
