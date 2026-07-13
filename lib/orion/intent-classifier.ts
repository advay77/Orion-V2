export type IntentType = 
  | 'UI_CLONE'
  | 'FULL_STACK_APP'
  | 'FRONTEND_ONLY'
  | 'BACKEND_ONLY'
  | 'DOCUMENTATION'
  | 'RESEARCH'
  | 'MARKETING';

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  framework: string | null; // e.g. 'React + Vite', 'Next.js', 'HTML/CSS/JS'
  target: string | null; // e.g. URL, design reference
  goal: string | null; // e.g. 'Recreate the UI and layout'
}

export class IntentClassifier {
  private keywordPatterns: Record<IntentType, string[]> = {
    UI_CLONE: [
      'clone website',
      'copy this website',
      'recreate',
      'make html page',
      'figma',
      'dribbble',
      'url',
      'landing page',
      'replicate',
      'duplicate',
      'mockup',
      'design',
      'layout',
      'frontend clone',
      'copy design',
      'recreate design',
      'make it look like',
      'similar to',
      'based on this design',
    ],
    FULL_STACK_APP: [
      'full stack',
      'full-stack',
      'web application',
      'web app',
      'api',
      'database',
      'authentication',
      'auth',
      'backend',
      'frontend and backend',
      'complete app',
      'end to end',
      'e2e',
      'user system',
      'login system',
      'signup',
      'payment',
      'stripe',
      'crud',
    ],
    FRONTEND_ONLY: [
      'frontend',
      'react',
      'vue',
      'angular',
      'nextjs',
      'nuxt',
      'ui component',
      'interface',
      'dashboard',
      'admin panel',
      'client side',
      'static site',
      'portfolio',
      'blog',
    ],
    BACKEND_ONLY: [
      'backend only',
      'api only',
      'server',
      'microservice',
      'database schema',
      'api endpoint',
      'rest api',
      'graphql',
      'serverless',
      'lambda',
      'function',
    ],
    DOCUMENTATION: [
      'documentation',
      'docs',
      'readme',
      'guide',
      'tutorial',
      'explain',
      'how to',
      'documentation for',
      'write docs',
      'api documentation',
    ],
    RESEARCH: [
      'research',
      'investigate',
      'analyze',
      'study',
      'find out',
      'explore',
      'compare',
      'evaluate',
      'look into',
      'survey',
    ],
    MARKETING: [
      'marketing',
      'marketing copy',
      'sales copy',
      'ad copy',
      'landing page copy',
      'product description',
      'seo',
      'content strategy',
      'social media',
      'campaign',
    ],
  };

  classify(prompt: string): IntentClassification {
    const lowerPrompt = prompt.toLowerCase();
    const scores: Record<IntentType, number> = {
      UI_CLONE: 0,
      FULL_STACK_APP: 0,
      FRONTEND_ONLY: 0,
      BACKEND_ONLY: 0,
      DOCUMENTATION: 0,
      RESEARCH: 0,
      MARKETING: 0,
    };

    // Step 1: Extract framework
    let framework: string | null = null;
    const frameworkMap: Record<string, string> = {
      'react': 'React + Vite',
      'next.js': 'Next.js',
      'nextjs': 'Next.js',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
    };
    for (const [keyword, name] of Object.entries(frameworkMap)) {
      if (lowerPrompt.includes(keyword)) {
        framework = name;
        break;
      }
    }

    // Step 2: Extract target URL
    let target: string | null = null;
    const urlMatch = prompt.match(/https?:\/\/[^\s`'"]+/);
    if (urlMatch) {
      target = urlMatch[0];
    }

    // Step3: Extract goal
    let goal: string | null = null;
    const cloneKeywords = ['clone', 'recreate', 'copy', 'similar to', 'like', 'based on'];
    if (cloneKeywords.some(k => lowerPrompt.includes(k))) {
      goal = 'Recreate the UI and layout';
    }

    const hasFrontendFramework = !!framework;

    // Check for backend keywords to see if it's full stack
    const backendKeywords = ['api', 'database', 'auth', 'authentication', 'backend', 'server'];
    let hasBackend = false;
    for (const keyword of backendKeywords) {
      if (lowerPrompt.includes(keyword)) {
        hasBackend = true;
        scores.FULL_STACK_APP += 5;
        scores.BACKEND_ONLY += 2;
        break;
      }
    }

    // Score each intent based on keyword matches
    for (const [intent, keywords] of Object.entries(this.keywordPatterns)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          scores[intent as IntentType] += 1;
        }
      }
    }

    // Prioritize frontend framework scores
    if (hasFrontendFramework) {
      scores.FRONTEND_ONLY += 10;
      if (hasBackend) {
        scores.FULL_STACK_APP += 10;
      }
    }

    // Find the highest scoring intent
    let bestIntent: IntentType = 'FULL_STACK_APP'; // Default fallback
    let bestScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as IntentType;
      }
    }

    // If we have frontend framework and no backend, force FRONTEND_ONLY
    if (hasFrontendFramework && !hasBackend) {
      bestIntent = 'FRONTEND_ONLY';
    }
    // If we have frontend framework and backend, force FULL_STACK_APP
    if (hasFrontendFramework && hasBackend) {
      bestIntent = 'FULL_STACK_APP';
    }
    // If we have target URL and framework, still use FRONTEND_ONLY/FULL_STACK_APP, not UI_CLONE
    if (target && hasFrontendFramework) {
      if (hasBackend) {
        bestIntent = 'FULL_STACK_APP';
      } else {
        bestIntent = 'FRONTEND_ONLY';
      }
    }

    // Calculate confidence based on score
    const maxPossibleScore = Math.max(...Object.values(scores));
    const confidence = maxPossibleScore > 0 ? bestScore / maxPossibleScore : 0.5;

    // Special handling for UI_CLONE with URL (only if no framework keywords)
    if ((lowerPrompt.includes('http://') || lowerPrompt.includes('https://')) && !hasFrontendFramework) {
      return {
        intent: 'UI_CLONE',
        confidence: 0.95,
        reasoning: 'URL detected in prompt, indicating UI clone intent',
        framework: 'HTML/CSS/JS',
        target,
        goal,
      };
    }

    return {
      intent: bestIntent,
      confidence,
      reasoning: `Detected ${bestScore} keyword matches for ${bestIntent}`,
      framework,
      target,
      goal,
    };
  }
}
