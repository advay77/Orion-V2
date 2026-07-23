# Setup Guide

## Requirements

- Node.js 20+
- OpenRouter API key: https://openrouter.ai/keys

## Install

```bash
npm install
```

Create `.env` in the project root:

```env
OPENROUTER_API_KEY=sk-or-your-key
```

Optional overrides (defaults in `lib/orion/model-config.ts`):

```env
PLANNER_MODEL=deepseek/deepseek-chat-v3.1:free
ENGINEERING_MODEL=qwen/qwen3-coder:free
RESEARCH_MODEL=deepseek/deepseek-r1:free
MARKETING_MODEL=qwen/qwen3.6-plus:free
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `OPENROUTER_API_KEY is not set` | Add the key to `.env` and restart `npm run dev` |
| Model 400 / unavailable | Switch to another free model ID in env, or use `openrouter/auto` |
| Rate limit 429 | Wait ~1 minute; execute endpoint is limited per IP |
| `Cannot find module …/next` | Delete `node_modules` and run `npm install` again |
| Port 3000 in use | Stop the other Next process or use the port Next suggests |

## Architecture notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) and the root [README.md](./README.md).
