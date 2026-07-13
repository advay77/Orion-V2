import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const nodeFramework: FrameworkDefinition = {
  id: 'node',
  name: 'Node.js / Express',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.includes('package.json')) {
      const pkg = content['package.json'];
      if (pkg) {
        if (pkg.includes('"express"')) score += 0.5;
        score += 0.3;
      }
    }
    if (paths.includes('server.js') || paths.includes('server.ts') || paths.includes('index.js') || paths.includes('index.ts')) {
      score += 0.2;
    }
    if (paths.some(p => p.includes('next.config'))) score -= 0.5;
    if (paths.some(p => p.includes('vite.config'))) score -= 0.3;
    return Math.max(Math.min(score, 1), 0);
  },
  canonicalPaths: {},
  entryFile: 'index.js',
  previewable: false,
  requiredFiles: ['package.json'],
  validateStructure(vfs: VFSMap): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    if (!vfs.has('package.json')) {
      errors.push('Missing package.json');
    }
    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },
};
