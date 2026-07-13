import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const reactFramework: FrameworkDefinition = {
  id: 'react',
  name: 'React (CRA)',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.includes('react') || p.endsWith('.tsx') || p.endsWith('.jsx'))) score += 0.4;
    if (paths.includes('package.json')) {
      const pkg = content['package.json'];
      if (pkg && (pkg.includes('"react"') || pkg.includes('"react-dom"'))) score += 0.5;
    }
    if (paths.includes('public/index.html')) score += 0.1;
    if (paths.includes('src/index.js') || paths.includes('src/index.tsx')) score += 0.1;
    if (paths.some(p => p.includes('next.config'))) score -= 0.5;
    if (paths.some(p => p.includes('vite.config'))) score -= 0.3;
    return Math.max(Math.min(score, 1), 0);
  },
  canonicalPaths: {
    'App.tsx': 'src/App.tsx',
    'App.jsx': 'src/App.jsx',
    'App.js': 'src/App.js',
    'index.tsx': 'src/index.tsx',
    'index.jsx': 'src/index.jsx',
    'index.js': 'src/index.js',
  },
  entryFile: 'src/index.tsx',
  previewFile: 'public/index.html',
  previewable: true,
  requiredFiles: ['package.json', 'src/index.tsx'],
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
