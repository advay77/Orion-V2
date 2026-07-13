import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const javaFramework: FrameworkDefinition = {
  id: 'java',
  name: 'Java',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.endsWith('.java'))) score += 0.6;
    if (paths.includes('pom.xml')) score += 0.3;
    if (paths.includes('build.gradle')) score += 0.3;
    return Math.min(score, 1);
  },
  canonicalPaths: {},
  entryFile: 'Main.java',
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
