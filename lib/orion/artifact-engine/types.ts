export interface RawArtifact {
  path: string;
  content: string;
  language: string;
  originalPath?: string;
}

export interface VFSFile {
  path: string;
  content: string;
  language: string;
}

export type VFSMap = Map<string, VFSFile>;

export interface VFSNode {
  name: string;
  type: 'file' | 'folder';
  children?: VFSNode[];
  file?: VFSFile;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export type CanonicalPathMap = Record<string, string>;

export interface FrameworkDefinition {
  id: string;
  name: string;
  detect(paths: string[], content: Record<string, string>): number;
  canonicalPaths: CanonicalPathMap;
  entryFile: string;
  previewFile?: string;
  previewable: boolean;
  requiredFiles?: string[];
  validateStructure(vfs: VFSMap): ValidationResult;
  rewriteReferences?(content: string, paths: string[]): string;
}

export interface DetectionResult {
  framework: FrameworkDefinition;
  confidence: number;
  signals: string[];
}

export interface ArtifactManifest {
  framework: string;
  entryFile: string;
  previewFile?: string;
  files: string[];
  folders: string[];
  dependencies: Record<string, string>;
  metadata: {
    generatedAt: string;
    totalFiles: number;
  };
}

export interface EngineResult {
  vfs: VFSMap;
  manifest: ArtifactManifest;
  framework: FrameworkDefinition;
  validation: ValidationResult;
  previewable: boolean;
}
