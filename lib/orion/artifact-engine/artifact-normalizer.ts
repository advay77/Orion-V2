import type { RawArtifact, VFSFile, VFSMap, FrameworkDefinition } from './types';

/**
 * Maps raw artifacts onto a consistent project tree for the detected framework.
 */
export class ArtifactNormalizer {
  normalize(artifacts: RawArtifact[], framework: FrameworkDefinition): VFSMap {
    const vfs = new Map<string, VFSFile>();

    // Detect a shared root folder LLM may have wrapped everything in (e.g. my-app/src/...)
    const stripRoot = this.detectDisposableRoot(artifacts.map((a) => a.path));

    for (const artifact of artifacts) {
      let targetPath = this.cleanPath(artifact.path);
      if (stripRoot && targetPath.startsWith(stripRoot + '/')) {
        targetPath = targetPath.slice(stripRoot.length + 1);
      }

      if (framework.canonicalPaths[targetPath]) {
        targetPath = framework.canonicalPaths[targetPath];
      } else {
        // Also map basename-only keys
        const base = targetPath.split('/').pop() || targetPath;
        if (framework.canonicalPaths[base] && !targetPath.includes('/')) {
          targetPath = framework.canonicalPaths[base];
        }
      }

      targetPath = this.enforceFrameworkLayout(targetPath, framework.id);

      const existing = vfs.get(targetPath);
      if (existing) {
        if (artifact.content.length > existing.content.length) {
          vfs.set(targetPath, {
            path: targetPath,
            content: artifact.content,
            language: artifact.language,
          });
        }
      } else {
        vfs.set(targetPath, {
          path: targetPath,
          content: artifact.content,
          language: artifact.language,
        });
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

  private cleanPath(raw: string): string {
    return raw
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\.\/+/, '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
  }

  /**
   * If every path shares a single top-level folder that isn't a known project root
   * (src, app, public, …), strip it so the VFS starts at the real project root.
   */
  private detectDisposableRoot(paths: string[]): string | null {
    const cleaned = paths.map((p) => this.cleanPath(p)).filter(Boolean);
    if (cleaned.length < 2) return null;

    const roots = cleaned.map((p) => p.split('/')[0]);
    const first = roots[0];
    if (!first || !roots.every((r) => r === first)) return null;

    const keepAsRoot = new Set([
      'src',
      'app',
      'pages',
      'public',
      'components',
      'lib',
      'styles',
      'api',
      'server',
      'client',
      'docs',
      'tests',
      'test',
      'bin',
      'cmd',
      'pkg',
      'internal',
    ]);
    if (keepAsRoot.has(first)) return null;
    if (first.includes('.')) return null; // file at root
    return first;
  }

  private enforceFrameworkLayout(path: string, frameworkId: string): string {
    // Keep already-nested paths
    if (path.includes('/')) return path;

    switch (frameworkId) {
      case 'nextjs':
        if (path === 'layout.tsx' || path === 'page.tsx' || path === 'loading.tsx') {
          return `app/${path}`;
        }
        if (path.endsWith('.css')) return `app/${path}`;
        break;
      case 'vite':
      case 'react':
        if (/^App\.(tsx|jsx|js)$/.test(path)) return `src/${path}`;
        if (/^main\.(tsx|jsx|ts|js)$/.test(path)) return `src/${path}`;
        if (/^index\.(tsx|jsx|ts|js)$/.test(path)) return `src/${path}`;
        if (path.endsWith('.css')) return `src/${path}`;
        break;
      case 'html':
        if (path.endsWith('.css')) return path === 'styles.css' ? 'styles.css' : path;
        break;
      default:
        break;
    }
    return path;
  }
}
