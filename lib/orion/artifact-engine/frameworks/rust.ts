import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const rustFramework: FrameworkDefinition = {
  id: 'rust',
  name: 'Rust',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.endsWith('.rs'))) score += 0.6;
    if (paths.includes('Cargo.toml')) score += 0.4;
    return Math.min(score, 1);
  },
  canonicalPaths: {},
  entryFile: 'src/main.rs',
  previewable: false,
  requiredFiles: ['Cargo.toml'],
  validateStructure(vfs: VFSMap): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    if (!vfs.has('Cargo.toml')) {
      warnings.push('Missing Cargo.toml');
    }
    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },
};
