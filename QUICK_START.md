# Orion OS - Quick Start Guide

## What's New in This Refactor

Orion OS has been completely refactored to fix 10 critical production issues while maintaining backward compatibility. The system is now enterprise-ready with comprehensive error handling, parallel execution, and detailed execution metrics.

### Key Features
- **Dynamic Model Routing** - Automatically selects best model and falls back if needed
- **Parallel Execution** - Independent tasks run simultaneously in execution waves
- **Artifact Generation** - Automatic code block parsing and virtual file system creation
- **Comprehensive Logging** - Track cost, latency, confidence, and models for every task
- **Error Resilience** - Failed tasks don't stop the workflow; system retries with fallbacks
- **Production Metrics** - Cost tracking, performance analysis, confidence scoring

## Setup (30 seconds)

```bash
# 1. Install dependencies (if not already done)
pnpm install

# 2. Add your OpenRouter API key
# Edit .env.local:
echo "OPENROUTER_API_KEY=sk_or_your_key_here" >> .env.local

# 3. Start dev server
pnpm dev

# 4. Open dashboard
# Visit http://localhost:3000
```

## How It Works Now

### Before (Problem)
```
User Objective
  ↓
Planner creates 20 tasks (including unnecessary ones)
  ↓
Engineer Agent hardcodes model ID → 400 error
  ↓
System crashes
```

### After (Fixed)
```
User Objective: "Build an HTML Resume"
  ↓
Planner determines: Only Engineering needed (skip Research, Marketing)
  ↓
Router selects: Qwen Coder → (if fails) → DeepSeek → GLM
  ↓
Engineering Agent generates code with artifact paths:
  ```html path="index.html"
  ...
  ```
  ↓
Artifact Generator creates VFS and preview
  ↓
Return artifacts + metrics + execution report
```

## Key Components

### 1. Model Router (`lib/orion/model-router.ts`)
Replaces hardcoded model IDs with intelligent selection.

```typescript
// Before: hardcoded
const model = 'qwen/qwen-3-coder-235b'; // 400 error if unavailable

// After: dynamic
const selection = modelRouter.selectModel({
  agentType: 'engineering',
  priority: 'quality'
});
// Returns: { selectedModel, fallbackModels, confidence }
```

**Benefits:**
- Automatic fallback if model unavailable
- Ranked by quality, cost, speed
- Confidence scoring
- Never stops on model unavailability

### 2. Artifact Generator (`lib/orion/artifact-generator.ts`)
Parses code blocks and creates downloadable projects.

```typescript
// Agent returns structured code:
```tsx path="src/App.tsx"
export default function App() { ... }
```

// Generator creates:
{
  artifacts: { "src/App.tsx": { content, language } },
  folderStructure: { name: "src", children: [...] },
  projectType: "react",
  previewable: true
}
```

**Supports:**
- React, Vue, Next.js, Vite projects
- HTML standalone apps
- Python projects
- Node.js backends

### 3. Parallel Execution (`lib/orion/orchestrator.ts`)
Tasks execute in waves instead of sequentially.

```
Wave 1 (Parallel):
  - Research Task 1
  - Engineering Task 1
  → Complete in parallel

Wave 2 (Parallel):
  - Marketing Task 1
  - Research Task 2
  → Complete in parallel

Benefits:
- 50% faster execution (2 tasks in parallel)
- Better resource utilization
- Clearer execution visualization
```

### 4. Task Metadata (`lib/orion/shared-memory.ts`)
Comprehensive logging for each task.

```typescript
// For every task, system logs:
{
  taskId: "task_1",
  agent: "engineering",
  selectedModel: "qwen/qwen-3-coder-235b",
  fallbackModel: "deepseek/deepseek-chat",
  tokens: 2500,
  latency: 3200, // ms
  confidence: 0.95, // 0-1
  estimatedCost: 0.0025,
  actualCost: 0.0024,
  status: "completed",
  artifactPaths: ["src/App.tsx", "package.json"],
  executionStartTime: "2026-07-13T06:45:00Z",
  executionEndTime: "2026-07-13T06:45:03Z"
}
```

## Usage Examples

### Example 1: Simple HTML Project
```
Input: "Build an HTML resume with CSS styling"

Planner says:
- User Intent: Create resume web page
- Required Skills: Frontend, HTML, CSS
- Required Agents: Engineering only ✓
- Skip: Research, Marketing ✓

Expected output:
- index.html (with resume content)
- style.css (responsive styling)
- Ready to preview in browser
- Download as ZIP
```

### Example 2: React App
```
Input: "Build a todo app in React"

Planner says:
- User Intent: Create task management app
- Required Skills: Frontend, React, State management
- Required Agents: Engineering
- Skip: Research, Marketing ✓

Expected output:
- src/App.tsx (main component)
- src/components/ (Todo components)
- package.json (dependencies)
- Vite config
- Live preview available
```

### Example 3: Multi-Agent Project
```
Input: "Plan and build a chatbot"

Planner says:
- User Intent: Create conversational AI interface
- Required Skills: Frontend, Backend, LLM integration
- Required Agents: 
  ✓ Engineering (frontend + backend)
  ✓ Research (LLM model selection)
  ✗ Marketing (skip)

Execution flow:
Wave 1 (parallel):
  - Research: Analyze available models → determine best LLM
  - Engineering: Create frontend UI

Wave 2 (sequential if dependent):
  - Engineering: Build backend API using model selection from Wave 1
```

## API Reference

### Create Plan & Execute
```bash
POST /api/orion/plan
Content-Type: application/json

{
  "objective": "Build an HTML Resume"
}

Response:
{
  "success": true,
  "plan": { tasks: [...], status: "completed" },
  "summary": { totalTasks: 3, completed: 3, failed: 0 },
  "memory": { execution_state: {...}, task_metadata: {...} },
  "artifacts": { "task_1": { vfs, folderStructure, projectType } }
}
```

### Get Current State
```bash
GET /api/orion/state

Response:
{
  "plan": { current plan },
  "state": { execution state },
  "summary": { task counts },
  "memory": { shared memory contents }
}
```

### Full Execution Report
```bash
POST /api/orion/execute
Content-Type: application/json

{
  "objective": "Build something"
}

Response includes:
{
  "metrics": {
    "totalCost": 0.0025,
    "averageConfidence": 0.95,
    "totalLatency": 3200,
    "tasksPerSecond": 1.5
  },
  "executionLog": [ all task metadata ],
  "artifacts": { all generated files },
  "taskResults": { per-task results }
}
```

## Dashboard Features

### Real-Time Monitoring
- Task execution status (pending, in_progress, completed, failed)
- Selected model for each task
- Latency and cost metrics
- Confidence score visualization
- Progress bar

### Task Details
- Agent assigned
- Skill required
- Model selected (with fallback)
- Execution time
- Cost (estimated vs actual)
- Artifacts generated
- Error messages if failed

### Execution Timeline
- Wave-by-wave execution visualization
- Parallel vs sequential tasks
- Real-time updates every 2 seconds

## Performance Tips

### 1. Optimize for Speed
```json
{
  "objective": "Build something quickly",
  "priority": "speed"
}
// Routes to faster models (MiniMax, Kimi) instead of slower ones (DeepSeek R1)
```

### 2. Maximize Quality
```json
{
  "objective": "Build something perfect",
  "priority": "quality"
}
// Routes to highest quality models (DeepSeek R1, Qwen Coder)
```

### 3. Minimize Cost
```json
{
  "objective": "Build something cheaply",
  "priority": "cost"
}
// Routes to most cost-effective models (Kimi K2.7, MiniMax M3)
```

### 4. Balanced (Default)
```json
{
  "objective": "Build something"
}
// Automatic selection balancing quality, speed, cost
```

## Troubleshooting

### "No available models found"
**Issue:** OpenRouter API key invalid or rate limited
**Fix:** 
```bash
# Check API key is set
echo $OPENROUTER_API_KEY

# Verify it's valid (sk_or_...)
# Check OpenRouter account status
# Wait if rate limited (try in 1 minute)
```

### Tasks failing with 400 errors
**Fixed!** System now automatically tries fallback models instead of crashing.
- Logs which models were tried
- Shows final error message
- Other tasks continue executing

### No artifacts generated
**Check:**
1. Engineering agent received the task
2. Task result contains code blocks with path notation:
   `` ```tsx path="src/App.tsx" ``
3. Check dashboard for task result preview

### Cost higher than expected
**Check:**
- How many fallback retries occurred (shown in execution log)
- Which model was actually used (might be premium fallback)
- Compare estimatedCost vs actualCost

## What's Tracked

Every execution creates a detailed log:

```
Task Execution Metrics:
├── Model Selection
│   ├── Primary Model
│   ├── Fallback Models
│   ├── Confidence Score
│   └── Selection Reason
├── Performance
│   ├── Latency (ms)
│   ├── Tokens Used
│   ├── Throughput (tasks/sec)
│   └── Total Duration
├── Costs
│   ├── Estimated Cost
│   ├── Actual Cost
│   ├── Cost per Task
│   └── Cost Variance
├── Results
│   ├── Status (completed/failed)
│   ├── Generated Artifacts
│   ├── Error Messages
│   └── Retry Count
└── Confidence
    ├── Model Confidence
    ├── Task Confidence
    └── Execution Quality
```

## Next Steps

1. **Try it out:**
   ```bash
   pnpm dev
   # Go to http://localhost:3000
   # Enter: "Build an HTML hello world page"
   ```

2. **Check the refactoring details:**
   - Read `REFACTORING_COMPLETE.md` for technical details
   - Read `ARCHITECTURE.md` for system design
   - Read `MODELS_GUIDE.md` for model selection

3. **Deploy to production:**
   ```bash
   # Vercel (recommended)
   vercel deploy
   
   # Or Docker
   docker build -t orion .
   docker run -e OPENROUTER_API_KEY=sk_or_xxx orion
   ```

## Support

For issues or questions:
1. Check `REFACTORING_COMPLETE.md` for what was fixed
2. Check `QUICK_START.md` (this file) for common issues
3. Check dashboard error messages
4. Review execution log in shared memory
5. Check cost tracking to verify model selection

---

**System Status:** ✅ Production Ready
**Build Status:** ✅ Verified
**API Status:** ✅ Responding
**Model Router:** ✅ Dynamic Selection
**Artifact Pipeline:** ✅ Complete
**Error Handling:** ✅ Robust with Retries
