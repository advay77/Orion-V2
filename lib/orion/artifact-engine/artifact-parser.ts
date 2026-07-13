import type { RawArtifact } from './types';

export class ArtifactParser {
  private languageToDefaultPath: Record<string, (index: number) => string> = {
    html: (i) => (i === 0 ? 'index.html' : `page-${i + 1}.html`),
    css: (i) => (i === 0 ? 'src/index.css' : `src/styles-${i + 1}.css`),
    javascript: (i) => (i === 0 ? 'src/main.jsx' : `src/script-${i + 1}.js`),
    js: (i) => (i === 0 ? 'src/main.jsx' : `src/script-${i + 1}.js`),
    typescript: (i) => (i === 0 ? 'src/main.ts' : `src/index-${i + 1}.ts`),
    ts: (i) => (i === 0 ? 'src/main.ts' : `src/index-${i + 1}.ts`),
    tsx: (i) => (i === 0 ? 'src/App.tsx' : `src/components/Component-${i + 1}.tsx`),
    jsx: (i) => (i === 0 ? 'src/App.jsx' : `src/components/Component-${i + 1}.jsx`),
    python: (i) => (i === 0 ? 'main.py' : `main-${i + 1}.py`),
    py: (i) => (i === 0 ? 'main.py' : `main-${i + 1}.py`),
    rust: (i) => (i === 0 ? 'main.rs' : `main-${i + 1}.rs`),
    rs: (i) => (i === 0 ? 'main.rs' : `main-${i + 1}.rs`),
    json: (i) => (i === 0 ? 'package.json' : `config-${i + 1}.json`),
    markdown: (i) => (i === 0 ? 'README.md' : `README-${i + 1}.md`),
    md: (i) => (i === 0 ? 'README.md' : `README-${i + 1}.md`),
  };

  parse(llmOutput: string): RawArtifact[] {
    const artifacts: RawArtifact[] = [];
    const pathlessArtifactsByLang: Record<string, RawArtifact[]> = {};

    const patternWithPath = /```([\w+#.-]+)\s+path=["']([^"']+)["']([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = patternWithPath.exec(llmOutput)) !== null) {
      const [, lang, path, content] = match;
      artifacts.push({
        path: path.trim(),
        content: content.trim(),
        language: lang.trim().toLowerCase(),
        originalPath: path.trim(),
      });
    }

    const patternWithoutPath = /```([\w+#.-]+)([\s\S]*?)```/g;
    while ((match = patternWithoutPath.exec(llmOutput)) !== null) {
      const [, lang, content] = match;
      const trimmedLang = lang.trim().toLowerCase();
      if (!pathlessArtifactsByLang[trimmedLang]) {
        pathlessArtifactsByLang[trimmedLang] = [];
      }
      pathlessArtifactsByLang[trimmedLang].push({
        path: '',
        content: content.trim(),
        language: trimmedLang,
      });
    }

    for (const [lang, langArtifacts] of Object.entries(pathlessArtifactsByLang)) {
      langArtifacts.forEach((artifact, index) => {
        const pathGenerator = this.languageToDefaultPath[lang];
        if (pathGenerator) {
          artifact.path = pathGenerator(index);
        } else {
          artifact.path = `file-${index + 1}.txt`;
          artifact.language = 'plaintext';
        }
        artifacts.push(artifact);
      });
    }

    return artifacts;
  }
}
