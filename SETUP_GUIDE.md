# Orion OS - Quick Start Setup Guide

Welcome to Orion OS, an AI Operating System powered entirely by open-source models.

## What You Have

A complete, production-ready system with:

### ✓ Three Specialized Agents
- **Engineering Agent** (Qwen 3 Coder 235B) - Architecture, code, technical strategy
- **Research Agent** (GLM-5.2) - Market analysis, competitive research, trends
- **Marketing Agent** (DeepSeek V4 Pro) - Brand strategy, campaigns, growth

### ✓ Intelligent Planning System
- **Planner Agent** (DeepSeek V4 Pro) - Breaks objectives into executable tasks
- Prioritizes by dependency and importance
- Assigns tasks to appropriate agents
- Provides structured reasoning

### ✓ Real-Time Dashboard
- Live task progress tracking
- Agent execution lanes
- Shared memory inspector
- Execution statistics

### ✓ Modern API
- `POST /api/orion/plan` - Create and execute plans
- `GET /api/orion/plan` - Retrieve current plan
- `GET /api/orion/state` - Get execution state

### ✓ Open-Source Models
- All models are open-source
- Served through OpenRouter
- Easy to swap or customize
- No vendor lock-in

## Getting Started

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local

# Add your OpenRouter API key
# Get it from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk_or_your_key_here
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 4. Test the System

#### Via Dashboard
1. Open http://localhost:3000
2. Enter an objective: "Build a mobile app for meal planning"
3. Click "Execute Plan"
4. Watch real-time execution in the dashboard

#### Via API
```bash
# Create and execute a plan
curl -X POST http://localhost:3000/api/orion/plan \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Build a mobile app for meal planning"
  }'

# Get execution state
curl http://localhost:3000/api/orion/state
```

## File Structure

```
lib/orion/
├── types.ts                 # Core type definitions
├── shared-memory.ts         # Global context system
├── openrouter-client.ts     # OpenRouter API client
├── base-agent.ts            # Abstract agent class
├── model-config.ts          # Model assignments (NEW)
├── planning-engine.ts       # Plan generation & tracking
├── orchestrator.ts          # Agent coordinator
├── index.ts                 # System initialization
└── agents/
    ├── planner.ts           # Planning agent
    ├── engineering.ts       # Engineering agent
    ├── research.ts          # Research agent
    └── marketing.ts         # Marketing agent

app/
├── api/orion/
│   ├── plan/route.ts        # Plan creation endpoint
│   └── state/route.ts       # State retrieval endpoint
├── page.tsx                 # Main dashboard page
└── globals.css              # Styling

components/
└── orion-dashboard.tsx      # Real-time dashboard UI

Documentation/
├── ORION_README.md          # System overview
├── MODELS_GUIDE.md          # Model configuration (NEW)
├── ARCHITECTURE.md          # Architecture details (NEW)
└── SETUP_GUIDE.md           # This file
```

## Model Configuration

### Default Models (Optimized)
```
Planner    → DeepSeek V4 Pro          (Advanced reasoning)
Engineering → Qwen 3 Coder (235B)     (Code & technical)
Research   → GLM-5.2                  (Analysis & insights)
Marketing  → DeepSeek V4 Pro          (Strategy & reasoning)
```

### Customize Models

Edit `lib/orion/model-config.ts`:

```typescript
export const AGENT_MODELS = {
  planner: 'deepseek/deepseek-chat',           // Your model
  engineering: 'qwen/qwen-3-coder-235b',       // Your model
  research: 'glm-5-2',                         // Your model
  marketing: 'deepseek/deepseek-chat',         // Your model
};
```

Or use environment variables:

```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-5-2
MARKETING_MODEL=deepseek/deepseek-chat
```

## Available Models

| Model | Use Case | Best For |
|-------|----------|----------|
| DeepSeek V4 Pro | Reasoning, planning | Planner, Marketing |
| DeepSeek R1 | Expert reasoning | High-quality tasks |
| Qwen 3 Coder (235B) | Code, technical | Engineering |
| GLM-5.2 | Analysis, research | Research, insights |
| Kimi K2.7 | General purpose | Any role |
| MiniMax M3 | Fast, efficient | Cost optimization |

See `MODELS_GUIDE.md` for detailed information.

## Example Usage

### TypeScript
```typescript
import { getOrionSystem } from '@/lib/orion';

const orion = getOrionSystem();

// Execute a plan
const plan = await orion.executePlan(
  'Build a SaaS product for project management'
);

// Listen to updates
orion.onExecutionUpdate((status, data) => {
  console.log(`Status: ${status}`, data);
});

// Get current state
const state = orion.getExecutionState();
const summary = orion.getPlanSummary();
```

### React Component
```typescript
const OrionDashboard = () => {
  const [state, setState] = useState(null);
  const [objective, setObjective] = useState('');

  const handleExecute = async () => {
    const response = await fetch('/api/orion/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective })
    });
    const data = await response.json();
    setState(data.state);
  };

  return (
    <div>
      <input
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Enter objective..."
      />
      <button onClick={handleExecute}>Execute Plan</button>
      {state && <pre>{JSON.stringify(state, null, 2)}</pre>}
    </div>
  );
};
```

## Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Add `OPENROUTER_API_KEY` to your Vercel project:
```bash
vercel env add OPENROUTER_API_KEY
# Paste your OpenRouter API key when prompted
```

### Docker
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

RUN pnpm install
RUN pnpm build

ENV OPENROUTER_API_KEY=your_key_here

CMD ["pnpm", "start"]
```

## Troubleshooting

### API Key Error
**Error**: `OPENROUTER_API_KEY environment variable not set`

**Solution**:
1. Get API key from https://openrouter.ai/keys
2. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk_or_xxx...
   ```
3. Restart dev server

### Model Not Found
**Error**: `The requested model does not exist`

**Solution**:
- Verify model ID in `model-config.ts`
- Check OpenRouter has the model available
- Use a different model from `MODELS_GUIDE.md`

### Rate Limiting
**Error**: OpenRouter rate limit exceeded

**Solution**:
- Use faster models (MiniMax M3)
- Add delays between requests
- Use environment variable to specify cheaper model

### Build Errors
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

## Documentation

- **ORION_README.md** - Complete system overview
- **MODELS_GUIDE.md** - Model configuration and selection
- **ARCHITECTURE.md** - System architecture details
- **SETUP_GUIDE.md** - This file

## Key Concepts

### Shared Memory
- Global context accessible to all agents
- Stores task results and reasoning
- Enables cross-agent knowledge sharing
- Persists throughout plan execution

### Agent Specialization
- Each agent optimized for its role
- Uses role-specific model
- Unique system prompt for expertise
- Contributes to plan execution

### Plan Execution
- Objectives broken into tasks
- Tasks assigned to appropriate agents
- Sequential execution with memory sharing
- Results aggregated into summary

### Real-Time Monitoring
- Dashboard polls for updates
- Execution state stored server-side
- Shared memory accessible via API
- Task results visible in real-time

## Advanced Topics

### Custom Agents
See `ARCHITECTURE.md` "Extension Points" for adding new agents.

### Custom Models
Add new models to `model-config.ts` and assign to agents.

### Integration
Use the API endpoints to integrate Orion into external systems.

### Performance Tuning
Use `MODELS_GUIDE.md` recommendations for your use case.

## Support

### Documentation
- Check `ORION_README.md` for comprehensive guide
- See `MODELS_GUIDE.md` for model selection help
- Review `ARCHITECTURE.md` for technical details

### Issues
1. Check troubleshooting section above
2. Review console logs in terminal
3. Check OpenRouter API status
4. Verify environment variables are set

## Next Steps

1. ✓ Set up environment with API key
2. ✓ Run development server
3. ✓ Test dashboard with sample objective
4. ✓ Customize models if desired
5. ✓ Deploy to production
6. ✓ Integrate into your application

## Resources

- **OpenRouter**: https://openrouter.ai
- **OpenRouter Models**: https://openrouter.ai/models
- **OpenRouter API Docs**: https://openrouter.ai/docs
- **Next.js Docs**: https://nextjs.org/docs

## Summary

Orion OS is a complete, open-source AI operating system ready to use. The system is:

- ✓ **Open Source** - All models are open source
- ✓ **Production Ready** - Built with modern best practices
- ✓ **Extensible** - Easy to add custom agents and models
- ✓ **Observable** - Real-time monitoring and debugging
- ✓ **Scalable** - Designed for production deployment

Get started now with your first objective!
