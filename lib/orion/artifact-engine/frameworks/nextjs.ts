import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const nextjsFramework: FrameworkDefinition = {
  id: 'nextjs',
  name: 'Next.js',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.includes('next.config'))) score += 0.6;
    if (paths.includes('package.json')) {
      const pkg = content['package.json'];
      if (pkg && pkg.includes('"next"')) score += 0.4;
    }
    if (paths.some(p => p.includes('app/') && p.endsWith('page.tsx'))) score += 0.2;
    if (paths.some(p => p.includes('pages/'))) score += 0.2;
    return Math.min(score, 1);
  },
  canonicalPaths: {
    'page.tsx': 'src/app/page.tsx',
    'page.jsx': 'src/app/page.jsx',
    'layout.tsx': 'src/app/layout.tsx',
    'layout.jsx': 'src/app/layout.jsx',
  },
  entryFile: 'src/app/page.tsx',
  previewable: true,
  requiredFiles: ['next.config.js', 'next.config.ts', 'package.json'],
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
