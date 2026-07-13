import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const genericFramework: FrameworkDefinition = {
  id: 'generic',
  name: 'Generic',
  detect(): number {
    return 0.1;
  },
  canonicalPaths: {},
  entryFile: '',
  previewable: false,
  requiredFiles: [],
  validateStructure(): ValidationResult {
    return {
      valid: true,
      warnings: [],
      errors: [],
    };
  },
};
