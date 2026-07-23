import type { RawArtifact } from './types';

/**
 * Extracts fenced code artifacts from LLM output into a structured file list.
 *
 * Supports:
 * - ```lang path="src/App.tsx"
 * - ```lang file="src/App.tsx"
 * - ```src/App.tsx   (path used as fence tag)
 * - // filepath: src/App.tsx  (or File:) immediately above a fence
 *
 * Pathless fences are only accepted as a last resort and get stable,
 * framework-friendly names — never Component-3.tsx style randomness.
 */
export class ArtifactParser {
  parse(llmOutput: string): RawArtifact[] {
    const artifacts: RawArtifact[] = [];
    const seenPaths = new Set<string>();
    const pathlessByLang: Record<string, string[]> = {};

    const lines = llmOutput.split(/\r?\n/);
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const fenceOpen = line.match(/^```([^\n`]*)$/);

      if (!fenceOpen) {
        i += 1;
        continue;
      }

      const header = fenceOpen[1].trim();
      const bodyLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        bodyLines.push(lines[i]);
        i += 1;
      }
      // skip closing ```
      if (i < lines.length && lines[i].startsWith('```')) i += 1;

      let content = bodyLines.join('\n').trim();
      if (!content) continue;

      // filepath comment immediately above was already consumed as previous lines —
      // also accept leading filepath comments inside the fence
      const leadingFileComment = content.match(
        /^(?:\/\/|#)\s*(?:filepath|file|path)\s*:\s*(.+)\n([\s\S]*)$/i,
      );
      if (leadingFileComment) {
        const path = this.cleanPath(leadingFileComment[1]);
        content = leadingFileComment[2].trim();
        if (path && content) {
          this.pushUnique(artifacts, seenPaths, {
            path,
            content,
            language: this.languageFromPath(path),
            originalPath: path,
          });
          continue;
        }
      }

      const pathFromHeader = this.pathFromFenceHeader(header);
      if (pathFromHeader) {
        this.pushUnique(artifacts, seenPaths, {
          path: pathFromHeader.path,
          content,
          language: pathFromHeader.language,
          originalPath: pathFromHeader.path,
        });
        continue;
      }

      // True pathless fence — queue for stable defaults (deduped later)
      const lang = (header.split(/\s+/)[0] || 'txt').toLowerCase().replace(/[^a-z0-9+#.-]/g, '') || 'txt';
      if (!pathlessByLang[lang]) pathlessByLang[lang] = [];
      // Skip if this content already exists under a pathed artifact (duplicate fence)
      const alreadyHave = artifacts.some((a) => a.content === content);
      if (!alreadyHave) {
        pathlessByLang[lang].push(content);
      }
    }

    // Also scan for "File: path" / "filepath: path" then fence on next non-empty line
    // (handled above via sequential parse; add regex pass for inline variants)
    this.extractFilepathPrefixed(llmOutput, artifacts, seenPaths);

    for (const [lang, contents] of Object.entries(pathlessByLang)) {
      contents.forEach((content, index) => {
        const path = this.stableDefaultPath(lang, index, content);
        this.pushUnique(artifacts, seenPaths, {
          path,
          content,
          language: lang,
        });
      });
    }

    return this.preferStructured(artifacts);
  }

  private extractFilepathPrefixed(
    llmOutput: string,
    artifacts: RawArtifact[],
    seenPaths: Set<string>,
  ): void {
    const re =
      /(?:^|\n)(?:\/\/|#|--)\s*(?:filepath|file|path)\s*:\s*([^\n]+)\n```([^\n`]*)\n([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(llmOutput)) !== null) {
      const path = this.cleanPath(match[1]);
      const content = match[3].trim();
      if (!path || !content) continue;
      this.pushUnique(artifacts, seenPaths, {
        path,
        content,
        language: this.languageFromPath(path) || this.languageFromHeader(match[2]),
        originalPath: path,
      });
    }
  }

  private pathFromFenceHeader(
    header: string,
  ): { path: string; language: string } | null {
    if (!header) return null;

    // lang path="..." | lang file='...'
    const attr = header.match(
      /^([\w+#.-]+)\s+(?:path|file)\s*=\s*["']([^"']+)["']\s*$/i,
    );
    if (attr) {
      return {
        language: attr[1].toLowerCase(),
        path: this.cleanPath(attr[2]),
      };
    }

    // Bare path as fence tag: ```src/components/Button.tsx
    if (/^[./\w-]+\.[a-zA-Z0-9]+$/.test(header) || /^[\w./-]+\/[\w./-]+\.[a-zA-Z0-9]+$/.test(header)) {
      const path = this.cleanPath(header);
      return { path, language: this.languageFromPath(path) };
    }

    // lang then path without quotes: ```tsx src/App.tsx
    const spaced = header.match(/^([\w+#.-]+)\s+([./\w-]+(?:\/[./\w-]+)+\.[a-zA-Z0-9]+)\s*$/);
    if (spaced) {
      return {
        language: spaced[1].toLowerCase(),
        path: this.cleanPath(spaced[2]),
      };
    }

    return null;
  }

  private stableDefaultPath(lang: string, index: number, content: string): string {
    // Prefer semantic names from content hints
    if (/^\s*\{[\s\S]*"name"\s*:/.test(content) && lang.includes('json')) {
      return index === 0 ? 'package.json' : `config/${index === 1 ? 'tsconfig' : `config-${index}`}.json`;
    }
    if (lang === 'html' || content.trimStart().startsWith('<!DOCTYPE') || content.includes('<html')) {
      return index === 0 ? 'index.html' : `pages/page-${index + 1}.html`;
    }
    if (lang === 'css' || lang === 'scss') {
      return index === 0 ? 'src/styles/index.css' : `src/styles/styles-${index + 1}.css`;
    }
    if (lang === 'python' || lang === 'py') {
      return index === 0 ? 'main.py' : `src/module_${index + 1}.py`;
    }
    if (lang === 'tsx' || lang === 'jsx') {
      return index === 0 ? `src/App.${lang}` : `src/components/Component${index + 1}.${lang}`;
    }
    if (lang === 'typescript' || lang === 'ts') {
      return index === 0 ? 'src/main.ts' : `src/lib/module${index + 1}.ts`;
    }
    if (lang === 'javascript' || lang === 'js') {
      return index === 0 ? 'src/main.js' : `src/lib/script${index + 1}.js`;
    }
    if (lang === 'markdown' || lang === 'md') {
      return index === 0 ? 'README.md' : `docs/note-${index + 1}.md`;
    }
    if (lang === 'json') {
      return index === 0 ? 'package.json' : `config/data-${index + 1}.json`;
    }
    return `src/generated/file-${index + 1}.${this.extForLang(lang)}`;
  }

  private preferStructured(artifacts: RawArtifact[]): RawArtifact[] {
    // Drop empty / tiny junk
    const filtered = artifacts.filter((a) => a.content.trim().length > 0 && a.path);
    // If we have both flat root App.tsx and src/App.tsx, keep nested via later normalizer —
    // here just dedupe identical content preferring longer/more nested path
    const byContent = new Map<string, RawArtifact>();
    for (const a of filtered) {
      const key = a.content.trim();
      const existing = byContent.get(key);
      if (!existing) {
        byContent.set(key, a);
        continue;
      }
      const score = (p: string) => (p.includes('/') ? 2 : 0) + p.length;
      if (score(a.path) > score(existing.path)) {
        byContent.set(key, a);
      }
    }
    return Array.from(byContent.values());
  }

  private pushUnique(
    artifacts: RawArtifact[],
    seenPaths: Set<string>,
    artifact: RawArtifact,
  ): void {
    const path = this.cleanPath(artifact.path);
    if (!path || !artifact.content.trim()) return;

    if (seenPaths.has(path)) {
      const idx = artifacts.findIndex((a) => a.path === path);
      if (idx >= 0 && artifact.content.length > artifacts[idx].content.length) {
        artifacts[idx] = { ...artifact, path };
      }
      return;
    }

    seenPaths.add(path);
    artifacts.push({ ...artifact, path });
  }

  private cleanPath(raw: string): string {
    return raw
      .trim()
      .replace(/^['"`]|['"`]$/g, '')
      .replace(/\\/g, '/')
      .replace(/^\.\/+/, '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
  }

  private languageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || 'txt';
    const map: Record<string, string> = {
      tsx: 'tsx',
      jsx: 'jsx',
      ts: 'typescript',
      js: 'javascript',
      mjs: 'javascript',
      cjs: 'javascript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      md: 'markdown',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      toml: 'toml',
      yaml: 'yaml',
      yml: 'yaml',
    };
    return map[ext] || ext;
  }

  private languageFromHeader(header: string): string {
    return (header.split(/\s+/)[0] || 'txt').toLowerCase();
  }

  private extForLang(lang: string): string {
    const map: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      markdown: 'md',
      rust: 'rs',
    };
    return map[lang] || lang.replace(/[^a-z0-9]/g, '') || 'txt';
  }
}
