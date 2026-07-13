import type { ValidationResult, VFSMap, FrameworkDefinition } from './types';

export class ArtifactValidator {
  validate(vfs: VFSMap, framework: FrameworkDefinition): ValidationResult {
    const frameworkResult = framework.validateStructure(vfs);
    const warnings: string[] = [...frameworkResult.warnings];
    const errors: string[] = [...frameworkResult.errors];

    if (vfs.size === 0) {
      errors.push('No files in VFS');
    }

    for (const [path, file] of vfs.entries()) {
      if (!file.content.trim()) {
        warnings.push(`Empty file: ${path}`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
