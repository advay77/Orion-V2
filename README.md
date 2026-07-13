# Orion OS - AI Operating System

**100% Open-Source AI Operating System powered by DeepSeek, Qwen, and GLM**

Orion orchestrates three specialized AI agents (Engineering, Research, Marketing) to plan and execute complex objectives using only open-source models.

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Set your OpenRouter API key
export OPENROUTER_API_KEY=sk_or_your_key_from_https://openrouter.ai/keys

# 2. Install and run
pnpm install
pnpm dev

# 3. Open dashboard
open http://localhost:3000
```

Enter an objective and watch the system execute it in real-time!

## 📚 Documentation

### Getting Started
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Quick start, configuration, troubleshooting

### Understanding the System
- **[ORION_README.md](./ORION_README.md)** - Complete system overview and usage
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design

### Models & Configuration  
- **[MODELS_GUIDE.md](./MODELS_GUIDE.md)** - Model selection and configuration
- **[OPEN_SOURCE_MODELS.md](./OPEN_SOURCE_MODELS.md)** - Complete model reference

### Current Status
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - What's been built and ready to deploy

## 🤖 Open-Source Models

| Agent | Model | Provider | Strength |
|-------|-------|----------|----------|
| **Planner** | DeepSeek V4 Pro | DeepSeek | Advanced reasoning |
| **Engineering** | Qwen 3 Coder (235B) | Alibaba | Code expertise |
| **Research** | GLM-5.2 | Zhipu | Analysis & insights |
| **Marketing** | DeepSeek V4 Pro | DeepSeek | Strategic reasoning |

All models served through OpenRouter with a single API key.

## ✨ Key Features

- ✅ **100% Open Source** - No proprietary AI services
- ✅ **Real-time Dashboard** - Monitor execution as it happens
- ✅ **RESTful API** - Integrate into external systems
- ✅ **Extensible** - Add custom agents and models
- ✅ **Production Ready** - Error handling, logging, monitoring
- ✅ **Type Safe** - Full TypeScript implementation

## 🎯 System Architecture

```
Objective
    ↓
[Orchestrator]
    ↓
[Planning Engine] → [Planner Agent] (DeepSeek V4 Pro)
    ↓
Task Assignment
    ↓
┌─────────────────────────────────────────┐
│  [Engineering Agent]                    │
│  Model: Qwen 3 Coder (235B)             │
│  Tasks: Architecture, Code, Technical   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Research Agent]                       │
│  Model: GLM-5.2                         │
│  Tasks: Analysis, Market, Trends        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Marketing Agent]                      │
│  Model: DeepSeek V4 Pro                 │
│  Tasks: Strategy, Messaging, Growth     │
└─────────────────────────────────────────┘
    ↓
[Shared Memory] - Cross-agent context
    ↓
[Dashboard] - Real-time monitoring
    ↓
Results & Insights
```

## 🔧 API Endpoints

```bash
# Create and execute a plan
POST /api/orion/plan
{
  "objective": "Build a mobile app for meal planning"
}

# Get current plan
GET /api/orion/plan

# Get execution state
GET /api/orion/state
```

## 📊 Real-time Dashboard

- **Task Progress** - Real-time updates on task execution
- **Agent Status** - See which agents are active
- **Shared Memory** - Inspect cross-agent context
- **Results** - View task results and reasoning
- **Statistics** - Completion metrics and performance

## 🎨 Customize Models

### Default Configuration
Edit `lib/orion/model-config.ts`:
```typescript
export const AGENT_MODELS = {
  planner: 'deepseek/deepseek-chat',
  engineering: 'qwen/qwen-3-coder-235b',
  research: 'glm-5-2',
  marketing: 'deepseek/deepseek-chat',
};
```

### Via Environment Variables
```env
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-5-2
MARKETING_MODEL=deepseek/deepseek-chat
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel deploy
# Add OPENROUTER_API_KEY to environment variables
```

### Docker
```bash
docker build -t orion .
docker run -e OPENROUTER_API_KEY=sk_or_xxx -p 3000:3000 orion
```

### Any Node.js Host
```bash
pnpm install
pnpm build
pnpm start
```

## 📁 Project Structure

```
lib/orion/
├── types.ts                 # Core type definitions
├── shared-memory.ts         # Global context system
├── openrouter-client.ts     # OpenRouter API client
├── base-agent.ts            # Abstract agent class
├── model-config.ts          # Model assignments
├── planning-engine.ts       # Plan generation
├── orchestrator.ts          # Agent coordinator
├── index.ts                 # System initialization
└── agents/
    ├── planner.ts
    ├── engineering.ts
    ├── research.ts
    └── marketing.ts

app/api/orion/
├── plan/route.ts            # Plan creation
└── state/route.ts           # State retrieval

components/
└── orion-dashboard.tsx      # Real-time UI
```

## 💡 Example Usage

### Via Dashboard
1. Open http://localhost:3000
2. Enter objective: "Build a SaaS app for project management"
3. Click "Execute Plan"
4. Watch real-time execution

### Via API
```bash
curl -X POST http://localhost:3000/api/orion/plan \
  -H "Content-Type: application/json" \
  -d '{"objective": "Build a mobile app"}'
```

### Via TypeScript
```typescript
import { getOrionSystem } from '@/lib/orion';

const orion = getOrionSystem();
const plan = await orion.executePlan('Your objective');
```

## 🔐 Security

- API keys stored in environment variables (not in code)
- All communication through OpenRouter
- No direct external API calls from agents
- Server-side execution isolation

## 📈 Performance

| Aspect | Details |
|--------|---------|
| Speed | 20-100 tokens/second (varies by model) |
| Quality | Excellent (all premier open-source models) |
| Cost | $$-$$$ depending on model selection |
| Throughput | Sequential task execution (one at a time) |
| Monitoring | Real-time dashboard with 2-second polling |

## 🛠️ Extending Orion

### Add Custom Agent
1. Create `lib/orion/agents/your-agent.ts`
2. Extend `BaseAgent`
3. Implement `getSystemPrompt()`
4. Register in Orchestrator
5. Add to `model-config.ts`

### Use Different Models
Just update model IDs in `model-config.ts` - no code changes needed!

## 🐛 Troubleshooting

### API Key Error
```
Error: OPENROUTER_API_KEY environment variable not set
Solution: Add to .env.local or set environment variable
```

### Model Not Found
```
Error: The requested model does not exist
Solution: Check model ID on https://openrouter.ai/models
```

### Rate Limiting
```
Solution: Use faster models (MiniMax M3) or Kimi K2.7
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting.

## 📖 Documentation Guide

**First Time?** Read in this order:
1. This README (overview)
2. [SETUP_GUIDE.md](./SETUP_GUIDE.md) (5-minute setup)
3. [MODELS_GUIDE.md](./MODELS_GUIDE.md) (customize models)

**Understand the System?** Read:
- [ARCHITECTURE.md](./ARCHITECTURE.md) (technical details)
- [ORION_README.md](./ORION_README.md) (comprehensive guide)

**Need Model Info?** Read:
- [MODELS_GUIDE.md](./MODELS_GUIDE.md) (model selection)
- [OPEN_SOURCE_MODELS.md](./OPEN_SOURCE_MODELS.md) (complete reference)

**Deployment?** Read:
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) (deployment options)

## 🌟 Key Capabilities

### Planning
- Analyzes complex objectives
- Breaks into executable tasks
- Prioritizes by dependency
- Assigns to appropriate agents

### Execution
- Sequential task execution
- Real-time progress tracking
- Cross-agent knowledge sharing
- Automatic error handling

### Monitoring
- Live dashboard
- REST API access
- Shared memory inspection
- Execution metrics

## 🚀 Next Steps

1. ✅ Add `OPENROUTER_API_KEY` to environment
2. ✅ Run `pnpm dev` and open http://localhost:3000
3. ✅ Test with sample objective
4. ✅ Review [MODELS_GUIDE.md](./MODELS_GUIDE.md) for customization
5. ✅ Deploy to production

## 📞 Support

### Documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Troubleshooting
- [MODELS_GUIDE.md](./MODELS_GUIDE.md) - Model help
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical questions

### External Resources
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

This project is built with open-source technologies and uses open-source AI models.

## 🎉 Summary

Orion is a production-ready AI Operating System that:

- ✅ Uses 100% open-source models
- ✅ Provides intelligent planning and execution
- ✅ Offers real-time monitoring
- ✅ Scales from prototyping to production
- ✅ Supports customization and extension

**Get started in 5 minutes - no vendor lock-in, full transparency, complete control.**

---

**Ready to orchestrate your AI workflow?**

```bash
pnpm dev
# Open http://localhost:3000
```

**Happy orchestrating! 🎯**
