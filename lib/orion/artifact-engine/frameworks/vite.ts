import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const viteFramework: FrameworkDefinition = {
  id: 'vite',
  name: 'Vite',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.includes('vite.config'))) score += 0.6;
    if (paths.includes('package.json')) {
      const pkg = content['package.json'];
      if (pkg && pkg.includes('"vite"')) score += 0.4;
    }
    return Math.min(score, 1);
  },
  canonicalPaths: {
    'index.html': 'index.html',
    'main.ts': 'src/main.ts',
    'main.tsx': 'src/main.tsx',
    'main.js': 'src/main.js',
    'App.tsx': 'src/App.tsx',
    'App.jsx': 'src/App.jsx',
  },
  entryFile: 'src/main.tsx',
  previewFile: 'index.html',
  previewable: true,
  requiredFiles: ['vite.config.ts', 'package.json'],
  validateStructure(vfs: VFSMap): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },
};
