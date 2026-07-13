import type { RawArtifact, VFSFile, VFSMap, FrameworkDefinition } from './types';

export class ArtifactNormalizer {
  normalize(artifacts: RawArtifact[], framework: FrameworkDefinition): VFSMap {
    const vfs = new Map<string, VFSFile>();

    for (const artifact of artifacts) {
      let targetPath = artifact.path.trim().replace(/^\/+|\/+$/g, '');

      if (framework.canonicalPaths[targetPath]) {
        targetPath = framework.canonicalPaths[targetPath];
      }

      const existing = vfs.get(targetPath);
      if (existing) {
        const incomingIsOriginal = artifact.originalPath && framework.canonicalPaths[artifact.originalPath] === targetPath;
        const existingIsOriginal = artifacts.some(a => a.originalPath === targetPath);
        if (incomingIsOriginal && !existingIsOriginal) {
          vfs.set(targetPath, { path: targetPath, content: artifact.content, language: artifact.language });
        } else if (artifact.content.length > existing.content.length) {
          vfs.set(targetPath, { path: targetPath, content: artifact.content, language: artifact.language });
        }
      } else {
        vfs.set(targetPath, { path: targetPath, content: artifact.content, language: artifact.language });
      }
    }

    const paths = Array.from(vfs.keys());
    if (framework.rewriteReferences) {
      for (const [path, file] of vfs.entries()) {
        const updatedContent = framework.rewriteReferences(file.content, paths);
        if (updatedContent !== file.content) {
          vfs.set(path, { ...file, content: updatedContent });
        }
      }
    }

    return vfs;
  }
}
