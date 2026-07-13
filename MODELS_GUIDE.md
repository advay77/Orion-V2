# Orion Open Source Models Guide

This guide explains how Orion uses open-source models through OpenRouter and how to customize model assignments for different agents.

## Overview

Orion uses exclusively open-source models served through OpenRouter. Each agent has been assigned a model optimized for its specific role:

```
Planner Agent        → DeepSeek V4 Pro (advanced planning)
Engineering Agent    → Qwen 3 Coder 235B (code/technical)
Research Agent       → GLM-5.2 (analysis/research)
Marketing Agent      → DeepSeek V4 Pro (strategy/reasoning)
```

## Model Specifications

### DeepSeek V4 Pro
- **Provider**: DeepSeek
- **Model ID**: `deepseek/deepseek-chat`
- **Strengths**: Advanced reasoning, complex planning, multi-step problem solving
- **Best for**: Planner and Marketing agents
- **Context window**: Large (supports extensive conversations)

### DeepSeek R1
- **Provider**: DeepSeek
- **Model ID**: `deepseek/deepseek-r1`
- **Strengths**: Specialized reasoning, step-by-step analysis
- **Best for**: Complex R&D tasks, detailed technical analysis
- **Context window**: Large

### Qwen 3 Coder (235B)
- **Provider**: Alibaba Qwen
- **Model ID**: `qwen/qwen-3-coder-235b`
- **Strengths**: Code generation, technical architecture, implementation details
- **Best for**: Engineering agent (primary)
- **Specialization**: 235B parameter model trained on code and technical documentation
- **Context window**: Very large

### GLM-5.2
- **Provider**: Zhipu (Cleartext)
- **Model ID**: `glm-5-2`
- **Strengths**: Complex analysis, research, multi-lingual support
- **Best for**: Research agent (primary)
- **Context window**: Large

### Kimi K2.7
- **Provider**: Moonshot
- **Model ID**: `kimi/kimi-k2.7`
- **Strengths**: General purpose, balanced performance
- **Best for**: Fallback or alternative for any agent
- **Context window**: Very large (supports long documents)

### MiniMax M3
- **Provider**: MiniMax
- **Model ID**: `minimax/minimax-m3`
- **Strengths**: Efficient inference, balanced quality/speed
- **Best for**: High-throughput scenarios or cost optimization
- **Context window**: Large

## Configuration

### Default Configuration

Models are configured in `lib/orion/model-config.ts`:

```typescript
export const AGENT_MODELS = {
  planner: 'deepseek/deepseek-chat',
  engineering: 'qwen/qwen-3-coder-235b',
  research: 'glm-5-2',
  marketing: 'deepseek/deepseek-chat',
};
```

### Environment Variable Overrides

Override individual model assignments:

```env
# .env.local
OPENROUTER_API_KEY=sk_or_xxx...

# Optional: Override specific agents
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-5-2
MARKETING_MODEL=deepseek/deepseek-chat
```

### Programmatic Configuration

```typescript
import { getOrionSystem } from '@/lib/orion';

// The system reads environment variables for model overrides
// If not set, uses defaults from model-config.ts
const orion = getOrionSystem();
```

## Model Selection Guide

### For Planning Tasks
**Recommended**: DeepSeek V4 Pro
- Superior reasoning for breaking down complex objectives
- Excellent at task prioritization and dependency analysis
- Strong planning and structuring capabilities

**Alternative**: DeepSeek R1
- Even stronger reasoning, slightly slower
- Best for extremely complex planning scenarios

### For Engineering/Technical Tasks
**Recommended**: Qwen 3 Coder (235B)
- Specialized training on code and technical documentation
- Best code generation and architecture design
- 235B size provides excellent quality

**Alternative**: DeepSeek V4 Pro
- Good for non-code technical analysis
- Better for system design discussions

### For Research/Analysis Tasks
**Recommended**: GLM-5.2
- Excellent analytical capabilities
- Strong on complex reasoning and synthesis
- Good multi-lingual support

**Alternative**: Kimi K2.7
- Excellent for long documents and context
- Balanced performance across domains

### For Marketing/Strategy Tasks
**Recommended**: DeepSeek V4 Pro
- Strong strategic reasoning
- Excellent at messaging and positioning
- Good creative capability

**Alternative**: Kimi K2.7
- Balanced creative and analytical capabilities

## Cost Optimization

If cost is a priority, consider:

1. **Use MiniMax M3 for all agents**
   - Most efficient inference
   - Still strong quality/performance ratio
   - Lowest cost tier

2. **Mix models by priority**
   ```env
   PLANNER_MODEL=minimax/minimax-m3          # Fast planning
   ENGINEERING_MODEL=qwen/qwen-3-coder-235b  # Specialized
   RESEARCH_MODEL=minimax/minimax-m3         # Fast research
   MARKETING_MODEL=minimax/minimax-m3        # Fast marketing
   ```

3. **Use Kimi K2.7**
   - Good balance of cost and quality
   - Slightly cheaper than DeepSeek V4 Pro
   - Still high performance

## Performance Characteristics

| Model | Speed | Quality | Code | Analysis | Strategy | Cost |
|-------|-------|---------|------|----------|----------|------|
| DeepSeek V4 Pro | Medium | Excellent | Good | Excellent | Excellent | $$ |
| DeepSeek R1 | Slow | Expert | Good | Expert | Excellent | $$$ |
| Qwen Coder 235B | Medium | Excellent | Expert | Good | Good | $$ |
| GLM-5.2 | Medium | Excellent | Good | Excellent | Good | $$ |
| Kimi K2.7 | Fast | Very Good | Good | Very Good | Very Good | $ |
| MiniMax M3 | Very Fast | Good | Fair | Good | Good | $ |

## How Models Are Used

### Agent Execution Flow

1. **Initialization** (`lib/orion/index.ts`)
   - Reads OPENROUTER_API_KEY from environment
   - Reads model overrides from environment variables
   - Falls back to defaults from model-config.ts
   - Creates agent instances with assigned models

2. **Task Execution** (`lib/orion/base-agent.ts`)
   ```typescript
   async execute(context: AgentContext): Promise<AgentResponse> {
     const response = await this.openRouterClient.chat(
       this.model,  // Uses agent's assigned model
       [userMessage],
       systemPrompt
     );
   }
   ```

3. **OpenRouter API Call** (`lib/orion/openrouter-client.ts`)
   ```typescript
   const response = await this.client.messages.create({
     model,  // e.g., 'deepseek/deepseek-chat'
     max_tokens: 2048,
     messages: allMessages,
   });
   ```

### Streaming Support

All models support streaming for real-time responses:

```typescript
const stream = await openRouterClient.stream(
  model,
  messages,
  systemPrompt
);

for await (const chunk of stream) {
  console.log(chunk); // Incrementally process response
}
```

## Monitoring Model Usage

Check which models are active via the API:

```bash
curl http://localhost:3000/api/orion/state
```

The response includes execution state showing which agents are running.

## Advanced: Custom Model Provisioning

### Using a Different OpenRouter Provider

All models are served through OpenRouter. No custom provisioning needed - just set your API key:

```env
OPENROUTER_API_KEY=sk_or_xxx...
```

### Using Local Models with OpenRouter

If running local models through OpenRouter, use the model ID provided by your setup:

```env
ENGINEERING_MODEL=local/your-local-model-id
```

## Troubleshooting

### Model Not Found
**Error**: `"The requested model does not exist"`

**Solution**: 
- Verify model ID in model-config.ts
- Check OpenRouter API key is valid
- Confirm model is available on OpenRouter

### Rate Limiting
**Error**: OpenRouter rate limit exceeded

**Solution**:
- Use more efficient models (MiniMax M3)
- Add delays between requests
- Contact OpenRouter for higher limits

### Timeout
**Error**: Request timeout from model

**Solution**:
- Increase timeout in openrouter-client.ts
- Use faster models (MiniMax M3, Kimi K2.7)
- Reduce max_tokens setting

## Model Selection Recommendations

**Start Here (Recommended)**
```env
OPENROUTER_API_KEY=sk_or_xxx...
# Uses defaults: DeepSeek Pro, Qwen Coder, GLM, DeepSeek Pro
```

**For Cost Optimization**
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=kimi/kimi-k2.7
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=kimi/kimi-k2.7
MARKETING_MODEL=kimi/kimi-k2.7
```

**For Maximum Quality**
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-5-2
MARKETING_MODEL=deepseek/deepseek-r1
```

**For High Throughput**
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=minimax/minimax-m3
ENGINEERING_MODEL=minimax/minimax-m3
RESEARCH_MODEL=minimax/minimax-m3
MARKETING_MODEL=minimax/minimax-m3
```

## API Documentation

For complete OpenRouter API documentation, visit:
https://openrouter.ai/docs/api/introduction

For model-specific details:
https://openrouter.ai/models

## Conclusion

Orion provides flexibility in choosing models for each agent role. The default configuration balances quality, specialization, and performance. Experiment with different combinations to find the best fit for your use case.
