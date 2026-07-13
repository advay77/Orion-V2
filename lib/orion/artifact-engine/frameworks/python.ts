import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const pythonFramework: FrameworkDefinition = {
  id: 'python',
  name: 'Python (Generic)',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.endsWith('.py'))) score += 0.5;
    if (paths.includes('requirements.txt')) score += 0.3;
    if (paths.includes('setup.py')) score += 0.2;
    if (paths.includes('pyproject.toml')) score += 0.2;
    return Math.min(score, 1);
  },
  canonicalPaths: {},
  entryFile: 'main.py',
  previewable: false,
  requiredFiles: [],
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
