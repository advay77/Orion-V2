import type { DetectionResult, RawArtifact, FrameworkDefinition } from './types';
import { getAllFrameworks } from './frameworks';

export class ProjectDetector {
  detect(artifacts: RawArtifact[]): DetectionResult {
    const paths = artifacts.map(a => a.path);
    const contentMap: Record<string, string> = {};
    artifacts.forEach(a => {
      contentMap[a.path] = a.content;
    });

    const frameworks = getAllFrameworks();
    let best: { framework: FrameworkDefinition; confidence: number; signals: string[] } | null = null;

    for (const fw of frameworks) {
      const confidence = fw.detect(paths, contentMap);
      const signals = this.extractSignals(fw.id, paths, contentMap);
      if (!best || confidence > best.confidence) {
        best = { framework: fw, confidence, signals };
      }
    }

    if (!best) {
      const generic = frameworks.find(f => f.id === 'generic')!;
      best = { framework: generic, confidence: 0.1, signals: ['Fallback to generic'] };
    }

    return best;
  }

  private extractSignals(frameworkId: string, paths: string[], content: Record<string, string>): string[] {
    const signals: string[] = [];

    switch (frameworkId) {
      case 'nextjs':
        if (paths.some(p => p.includes('next.config'))) signals.push('Found next.config');
        if (paths.some(p => p.includes('app/'))) signals.push('Found app/ directory');
        break;
      case 'vite':
        if (paths.some(p => p.includes('vite.config'))) signals.push('Found vite.config');
        break;
      case 'react':
        if (paths.some(p => p.endsWith('.tsx') || p.endsWith('.jsx'))) signals.push('Found React component files');
        break;
      case 'html':
        if (paths.includes('index.html')) signals.push('Found index.html');
        break;
      case 'rust':
        if (paths.includes('Cargo.toml')) signals.push('Found Cargo.toml');
        break;
    }

    return signals;
  }
}
