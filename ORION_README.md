# Orion OS - AI Operating System

Orion is an advanced AI Operating System that orchestrates three specialized open-source agents (Engineering, R&D, and Marketing) through a powerful planning and execution framework. Built exclusively on cutting-edge open-source models (DeepSeek, Qwen, GLM) served through OpenRouter, it features a modern real-time execution dashboard with full transparency and control.

## Open Source Models

All agents are powered by state-of-the-art open-source models:

- **Planner Agent**: DeepSeek V4 Pro - Advanced reasoning for breaking down complex objectives
- **Engineering Agent**: Qwen 3 Coder (235B) - Specialized code and technical architecture expertise
- **Research Agent**: GLM-5.2 - Superior analysis and R&D capabilities  
- **Marketing Agent**: DeepSeek V4 Pro - Strategic reasoning for marketing planning

Additional models available: DeepSeek R1, Kimi K2.7, MiniMax M3

## Architecture Overview

### Core Components

#### 1. **Shared Memory System** (`lib/orion/shared-memory.ts`)
- Global context accessible to all agents
- Tracks task results, reasoning, and intermediate data
- Maintains execution history with timestamps
- Enables cross-agent knowledge sharing

#### 2. **OpenRouter Client** (`lib/orion/openrouter-client.ts`)
- Unified interface to OpenRouter API
- Supports multiple LLM models
- Handles streaming and non-streaming responses
- Configurable base URL and headers

#### 3. **Base Agent** (`lib/orion/base-agent.ts`)
- Abstract foundation for all specialized agents
- Implements common execution lifecycle
- Handles prompt engineering and response parsing
- Manages task context and memory updates

#### 4. **Planner Agent** (`lib/orion/agents/planner.ts`)
- Breaks down objectives into executable tasks
- Assigns tasks to appropriate specialized agents
- Prioritizes by dependency and importance
- Returns structured plan with reasoning

#### 5. **Specialized Agents**

**Engineering Agent** (`lib/orion/agents/engineering.ts`)
- Technical architecture and design expertise
- Implementation planning and code strategy
- Performance optimization recommendations
- Systems integration guidance

**Research Agent** (`lib/orion/agents/research.ts`)
- Market and competitive analysis
- Technology trend research
- Data-driven insights generation
- Evidence-based recommendations

**Marketing Agent** (`lib/orion/agents/marketing.ts`)
- Brand strategy and positioning
- Campaign planning and messaging
- Customer segmentation insights
- Growth and conversion optimization

#### 6. **Planning Engine** (`lib/orion/planning-engine.ts`)
- Orchestrates plan generation and execution
- Tracks execution state and task progress
- Manages agent lifecycle
- Computes execution metrics and summaries

#### 7. **Orchestrator** (`lib/orion/orchestrator.ts`)
- Coordinates all agents and systems
- Executes plans sequentially with feedback
- Handles errors and retries
- Provides real-time execution updates

### API Routes

#### `POST /api/orion/plan`
Creates and executes a plan from an objective.

**Request:**
```json
{
  "objective": "Build a new SaaS product for team collaboration"
}
```

**Response:**
```json
{
  "success": true,
  "plan": { /* Plan object */ },
  "state": { /* Execution state */ },
  "summary": { /* Task summary */ }
}
```

#### `GET /api/orion/plan`
Retrieves the current plan and execution status.

#### `GET /api/orion/state`
Gets real-time execution state and shared memory.

### Frontend Dashboard

The execution dashboard (`components/orion-dashboard.tsx`) provides:

- **Real-time progress tracking** - Live task status updates
- **Agent lanes** - Visual separation of tasks by agent
- **Shared memory inspector** - Debug execution context
- **Statistics** - Task completion metrics
- **Execution history** - All plan and task details

## Usage

### Basic Usage

```typescript
import { getOrionSystem } from '@/lib/orion';

const orion = getOrionSystem();

// Execute a plan
const plan = await orion.executePlan(
  'Build a mobile app for tracking fitness goals'
);

// Monitor execution
const state = orion.getExecutionState();
const summary = orion.getPlanSummary();
```

### With Callbacks

```typescript
const orion = getOrionSystem();

// Listen to execution updates
orion.onExecutionUpdate((status, data) => {
  console.log(`Status: ${status}`, data);
});

// Execute
await orion.executePlan('Your objective here');
```

## Configuration

### Environment Variables

Set these in `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Model Configuration

Models are configured in `lib/orion/model-config.ts`:

```typescript
// Default model assignments (can be overridden via env vars)
AGENT_MODELS = {
  planner: 'deepseek/deepseek-chat',        // DeepSeek V4 Pro
  engineering: 'qwen/qwen-3-coder-235b',    // Qwen 3 Coder (235B)
  research: 'glm-5-2',                      // GLM-5.2
  marketing: 'deepseek/deepseek-chat',      // DeepSeek V4 Pro
}
```

### Override Models

To use different models, set environment variables:

```env
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-5-2
MARKETING_MODEL=deepseek/deepseek-chat
```

### Available Open Source Models

| Model | Provider | Use Case |
|-------|----------|----------|
| DeepSeek V4 Pro | DeepSeek | Advanced reasoning, planning, strategy |
| DeepSeek R1 | DeepSeek | Specialized reasoning tasks |
| Qwen 3 Coder (235B) | Alibaba | Code, engineering, technical tasks |
| GLM-5.2 | Zhipu | Analysis, research, complex reasoning |
| Kimi K2.7 | Moonshot | High-quality general purpose |
| MiniMax M3 | MiniMax | Efficient inference |

All models are served through OpenRouter with no direct API keys required per model.

## System Flow

1. **Input**: User provides objective
2. **Planning**: Planner Agent breaks down objective into tasks
3. **Execution**: Orchestrator runs tasks through appropriate agents
4. **Feedback**: Results stored in shared memory
5. **Completion**: Summary generated with metrics

## Task Structure

Each task includes:
- `id`: Unique identifier
- `description`: Task objective
- `priority`: high, medium, or low
- `assignedTo`: engineering, research, or marketing
- `status`: pending, in_progress, completed, or failed
- `result`: Task output/solution
- `reasoning`: Agent's reasoning process

## Agent Capabilities

### Engineering Agent
- System design and architecture
- Implementation strategies
- Code quality and best practices
- Performance optimization
- Risk analysis and mitigation

### Research Agent
- Competitive landscape analysis
- Market research and trends
- Technology evaluations
- Data-driven insights
- Hypothesis validation

### Marketing Agent
- Brand positioning and messaging
- Campaign strategy and tactics
- Customer segmentation
- Conversion optimization
- Growth hacking strategies

## Error Handling

- Tasks that fail are marked with error details
- System continues with remaining tasks
- Failed tasks stored in execution state
- Error messages included in task results

## Performance

- Parallel agent support (multiple agents active simultaneously)
- Streaming response support for long-running tasks
- Efficient memory management with shared context
- Real-time dashboard updates (2-second polling)

## Extending Orion

### Adding New Agents

1. Create agent class extending `BaseAgent`
2. Implement `getSystemPrompt()` method
3. Add to orchestrator initialization
4. Register in agent map

### Adding New Task Types

1. Extend `Task` interface in types
2. Update Planner to assign new task types
3. Create corresponding agent method
4. Update dashboard UI for new task type

## Dashboard Features

- **Objective Input**: Enter new objectives to execute
- **Real-time Progress**: Live task status updates
- **Agent Status**: See which agents are currently active
- **Task Details**: View task descriptions, results, and reasoning
- **Memory Inspector**: Debug shared context between agents
- **Metrics**: Track completion rates and efficiency

## Security

- API key stored securely in environment variables
- All agent communications through OpenRouter
- No external API calls from agents directly
- Client-side execution state isolation

## Future Enhancements

- Task dependency management
- Parallel task execution
- Agent-to-agent communication protocols
- Long-term memory and knowledge base
- Custom agent templates
- Task retry and recovery mechanisms
- Advanced analytics and reporting
