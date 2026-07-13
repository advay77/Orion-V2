# Open Source Models Reference

This is a comprehensive reference of all open-source models available in Orion OS via OpenRouter.

## Default Configuration

```typescript
// lib/orion/model-config.ts
export const AGENT_MODELS = {
  planner: 'deepseek/deepseek-chat',           // DeepSeek V4 Pro
  engineering: 'qwen/qwen-3-coder-235b',       // Qwen 3 Coder (235B)
  research: 'glm-5-2',                         // GLM-5.2
  marketing: 'deepseek/deepseek-chat',         // DeepSeek V4 Pro
};
```

## DeepSeek Models

### DeepSeek V4 Pro (Recommended for Planner & Marketing)
- **Model ID**: `deepseek/deepseek-chat`
- **Provider**: DeepSeek
- **Type**: General Purpose
- **Specialization**: Advanced reasoning, planning, multi-step problems
- **Parameters**: ~671B
- **Context Window**: 4096 tokens (expandable)
- **Performance**: Excellent quality, medium speed
- **Cost**: $$
- **Best For**: 
  - Planning complex objectives
  - Strategic reasoning
  - Multi-step problem solving
  - Marketing strategy

**Why It's Chosen for Planner**:
- Superior ability to break down complex problems
- Excellent task prioritization
- Strong reasoning for dependency analysis

**Why It's Chosen for Marketing**:
- Strong strategic reasoning
- Good creative problem solving
- Excellent at positioning and messaging

---

### DeepSeek R1
- **Model ID**: `deepseek/deepseek-r1`
- **Provider**: DeepSeek
- **Type**: Reasoning Specialist
- **Specialization**: Expert-level reasoning, step-by-step analysis
- **Parameters**: ~671B
- **Context Window**: 8000 tokens
- **Performance**: Expert quality, slower
- **Cost**: $$$
- **Best For**:
  - Complex research analysis
  - Detailed technical evaluation
  - Scientific problem solving
  - High-stakes decisions

**Alternative Use**:
```env
PLANNER_MODEL=deepseek/deepseek-r1    # For maximum quality
```

---

## Qwen Models

### Qwen 3 Coder (235B) - Recommended for Engineering
- **Model ID**: `qwen/qwen-3-coder-235b`
- **Provider**: Alibaba Qwen
- **Type**: Code & Technical Specialist
- **Specialization**: Code generation, architecture, technical tasks
- **Parameters**: 235B (specialized)
- **Context Window**: 32k tokens
- **Performance**: Excellent code quality, fast
- **Cost**: $$
- **Best For**:
  - Code generation
  - System architecture
  - Technical implementation
  - API design
  - Bug fixing

**Why It's Chosen for Engineering**:
- Specialized training on code and technical docs
- 235B parameters optimized for technical tasks
- Superior code quality vs general models
- Excellent architecture suggestions

**Other Qwen Models Available**:
- `qwen/qwen-3-225b` - General purpose (225B)
- `qwen/qwen-2-7b` - Lightweight alternative

---

## GLM Models

### GLM-5.2 - Recommended for Research
- **Model ID**: `glm-5-2`
- **Provider**: Zhipu (Cleartext AI)
- **Type**: Analysis & Research Specialist
- **Specialization**: Complex analysis, research, multi-lingual
- **Parameters**: ~10B-100B (varies by version)
- **Context Window**: 128k tokens
- **Performance**: Excellent analysis quality, medium speed
- **Cost**: $$
- **Best For**:
  - Market analysis
  - Competitive research
  - Trend analysis
  - Data insights
  - Technical evaluation

**Why It's Chosen for Research**:
- Superior analytical capabilities
- Excellent at synthesizing information
- Strong on competitive landscape analysis
- Good multi-lingual support

**Other GLM Models Available**:
- `glm-4` - Earlier version
- `glm-3.5-turbo` - Faster alternative

---

## Kimi Models

### Kimi K2.7
- **Model ID**: `kimi/kimi-k2.7`
- **Provider**: Moonshot AI
- **Type**: General Purpose
- **Specialization**: Long context, balanced performance
- **Parameters**: ~180B
- **Context Window**: 200k+ tokens
- **Performance**: Very good quality, fast
- **Cost**: $
- **Best For**:
  - Any general task
  - Long document processing
  - Cost-conscious deployments
  - High-throughput scenarios

**Alternative Use**:
```env
# Cost optimization - use Kimi K2.7 for all agents
PLANNER_MODEL=kimi/kimi-k2.7
ENGINEERING_MODEL=kimi/kimi-k2.7
RESEARCH_MODEL=kimi/kimi-k2.7
MARKETING_MODEL=kimi/kimi-k2.7
```

---

## MiniMax Models

### MiniMax M3
- **Model ID**: `minimax/minimax-m3`
- **Provider**: MiniMax
- **Type**: Efficient General Purpose
- **Specialization**: Fast inference, good quality at lower cost
- **Parameters**: ~100B
- **Context Window**: 4096 tokens
- **Performance**: Good quality, very fast
- **Cost**: $
- **Best For**:
  - High-throughput scenarios
  - Cost optimization
  - Real-time applications
  - Rapid prototyping

**Use for Maximum Throughput**:
```env
# High-throughput configuration
PLANNER_MODEL=minimax/minimax-m3
ENGINEERING_MODEL=minimax/minimax-m3
RESEARCH_MODEL=minimax/minimax-m3
MARKETING_MODEL=minimax/minimax-m3
```

---

## Complete Model Comparison Table

| Model | Provider | Type | Parameters | Context | Speed | Quality | Cost | Specialization |
|-------|----------|------|------------|---------|-------|---------|------|---|
| DeepSeek V4 Pro | DeepSeek | General | 671B | 4k | Medium | Excellent | $$ | Reasoning, Planning |
| DeepSeek R1 | DeepSeek | Reasoning | 671B | 8k | Slow | Expert | $$$ | Deep Analysis |
| Qwen 3 Coder 235B | Alibaba | Code | 235B | 32k | Fast | Excellent | $$ | Code/Technical |
| Qwen 3 225B | Alibaba | General | 225B | 16k | Fast | Very Good | $ | General Purpose |
| GLM-5.2 | Zhipu | Analysis | Varies | 128k | Medium | Excellent | $$ | Analysis/Research |
| GLM-4 | Zhipu | General | Varies | 128k | Slow | Excellent | $$$ | General Purpose |
| Kimi K2.7 | Moonshot | General | 180B | 200k | Fast | Very Good | $ | Long Context |
| MiniMax M3 | MiniMax | Efficient | 100B | 4k | Very Fast | Good | $ | Cost Optimization |

---

## Selection Recommendations by Scenario

### Scenario 1: Maximum Quality (Default - Recommended)
```env
OPENROUTER_API_KEY=sk_or_xxx...
# Uses defaults:
# Planner: DeepSeek V4 Pro
# Engineering: Qwen 3 Coder 235B
# Research: GLM-5.2
# Marketing: DeepSeek V4 Pro
```

### Scenario 2: Cost Optimization
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=kimi/kimi-k2.7
ENGINEERING_MODEL=qwen/qwen-3-225b        # Lighter weight Qwen
RESEARCH_MODEL=kimi/kimi-k2.7
MARKETING_MODEL=kimi/kimi-k2.7
```

### Scenario 3: Maximum Expert Quality
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=deepseek/deepseek-r1
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
RESEARCH_MODEL=glm-4
MARKETING_MODEL=deepseek/deepseek-r1
```

### Scenario 4: High Throughput
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=minimax/minimax-m3
ENGINEERING_MODEL=minimax/minimax-m3
RESEARCH_MODEL=minimax/minimax-m3
MARKETING_MODEL=minimax/minimax-m3
```

### Scenario 5: Specialist Per Role (Balanced)
```env
OPENROUTER_API_KEY=sk_or_xxx...
PLANNER_MODEL=deepseek/deepseek-chat     # Best for planning
ENGINEERING_MODEL=qwen/qwen-3-coder-235b # Best for code
RESEARCH_MODEL=glm-5-2                   # Best for analysis
MARKETING_MODEL=kimi/kimi-k2.7           # Cost-effective for strategy
```

---

## Model API Endpoints

All models are accessed through OpenRouter:

```typescript
// lib/orion/openrouter-client.ts
const response = await this.client.messages.create({
  model: 'deepseek/deepseek-chat',  // Any model ID from this guide
  max_tokens: 2048,
  messages: [
    { role: 'user', content: 'Your prompt' }
  ]
});
```

---

## Performance Benchmarks

### Speed (tokens/second)
- **Very Fast**: MiniMax M3, Kimi K2.7 (50-100 t/s)
- **Fast**: Qwen 3 Coder, DeepSeek V4 Pro (20-50 t/s)
- **Medium**: GLM-5.2 (15-30 t/s)
- **Slow**: DeepSeek R1, GLM-4 (5-15 t/s)

### Quality (subjective)
- **Expert**: DeepSeek R1, GLM-4
- **Excellent**: DeepSeek V4 Pro, Qwen 3 Coder, GLM-5.2
- **Very Good**: Qwen 3 225B, Kimi K2.7
- **Good**: MiniMax M3

### Cost per 1M tokens (approximate)
- **$**: MiniMax M3, Kimi K2.7
- **$$**: DeepSeek V4 Pro, Qwen 3 Coder, GLM-5.2
- **$$$**: DeepSeek R1, GLM-4

---

## Migration Guide

### From GPT to DeepSeek
```env
# Before
PLANNER_MODEL=gpt-4
ENGINEERING_MODEL=gpt-4

# After
PLANNER_MODEL=deepseek/deepseek-chat
ENGINEERING_MODEL=qwen/qwen-3-coder-235b
```

No code changes needed - just update model IDs!

### From Closed to Open Source
All models in this guide are completely open-source. No proprietary models are used.

---

## Troubleshooting Models

### Model not found error
```
Error: "The requested model does not exist"

Solution:
1. Check model ID spelling in model-config.ts
2. Verify on https://openrouter.ai/models
3. Try alternative from this guide
```

### Model too slow
```
Solution:
1. Switch to faster model: MiniMax M3 or Kimi K2.7
2. Reduce max_tokens setting
3. Use concurrent requests
```

### Insufficient context
```
Solution:
1. Use model with larger context: Kimi K2.7 (200k)
2. Use GLM-5.2 (128k context)
3. Split tasks into smaller chunks
```

### Poor quality responses
```
Solution:
1. Use expert model: DeepSeek R1 or GLM-4
2. Improve prompt engineering
3. Use specialized model: Qwen for code, GLM for analysis
```

---

## Resources

- **OpenRouter Models List**: https://openrouter.ai/models
- **DeepSeek Documentation**: https://deepseek.com/docs
- **Qwen Documentation**: https://github.com/QwenLM/Qwen
- **OpenRouter API Docs**: https://openrouter.ai/docs
- **Model Cards**: Available on Hugging Face

---

## Summary

Orion OS uses carefully selected open-source models optimized for each agent's role:

- **Planner**: DeepSeek V4 Pro (expert reasoning for planning)
- **Engineering**: Qwen 3 Coder (specialized code expertise)
- **Research**: GLM-5.2 (advanced analysis capabilities)
- **Marketing**: DeepSeek V4 Pro (strategic reasoning)

All models are:
- ✓ Open source
- ✓ Transparent
- ✓ No vendor lock-in
- ✓ Easy to customize
- ✓ Production-ready

Choose the configuration that best fits your needs!
