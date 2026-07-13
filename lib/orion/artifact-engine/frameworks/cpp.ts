import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const cppFramework: FrameworkDefinition = {
  id: 'cpp',
  name: 'C++',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.endsWith('.cpp') || p.endsWith('.h') || p.endsWith('.hpp'))) score += 0.7;
    if (paths.includes('CMakeLists.txt')) score += 0.3;
    return Math.min(score, 1);
  },
  canonicalPaths: {},
  entryFile: 'main.cpp',
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
