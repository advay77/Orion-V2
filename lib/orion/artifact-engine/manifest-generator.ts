import type { ArtifactManifest, VFSMap, FrameworkDefinition } from './types';

export class ManifestGenerator {
  generate(vfs: VFSMap, framework: FrameworkDefinition): ArtifactManifest {
    const files = Array.from(vfs.keys());
    const folders = new Set<string>();

    for (const file of files) {
      const parts = file.split('/');
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'));
      }
    }

    let dependencies: Record<string, string> = {};
    const pkgFile = vfs.get('package.json');
    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.content);
        dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      } catch {
        // ignore invalid json
      }
    }

    return {
      framework: framework.id,
      entryFile: framework.entryFile,
      previewFile: framework.previewFile,
      files,
      folders: Array.from(folders),
      dependencies,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: vfs.size,
      },
    };
  }
}
