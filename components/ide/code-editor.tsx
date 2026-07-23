'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
}

interface CodeEditorProps {
  file: FileNode | null | undefined;
}

/** Prefer bundled monaco over CDN — CSP blocks jsDelivr script loads. */
let monacoInit: Promise<void> | null = null;

function initMonacoFromBundle(): Promise<void> {
  if (!monacoInit) {
    monacoInit = import('monaco-editor')
      .then((monaco) => {
        loader.config({ monaco });
        return loader.init().then(() => undefined);
      })
      .catch((err) => {
        // Surface a real Error instead of a raw Event / {}
        const message =
          err instanceof Error
            ? err.message
            : err?.type
              ? `Monaco script/worker load failed (${err.type})`
              : 'Monaco failed to initialize';
        throw new Error(message);
      });
  }
  return monacoInit;
}

export function CodeEditor({ file }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initMonacoFromBundle()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Monaco failed to initialize';
        setError(msg);
        console.error('Monaco initialization:', msg, err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      json: 'json',
      md: 'markdown',
      html: 'html',
      css: 'css',
      txt: 'plaintext',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (!file || file.type === 'folder') {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm mb-1">No file selected</p>
          <p className="text-xs text-muted-foreground/80">Pick a file from the explorer</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-9 bg-orion-elevated/60 border-b border-orion-hairline flex items-center px-3">
          <span className="text-xs font-mono text-muted-foreground">{file.name}</span>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {file.content || ''}
        </pre>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-9 bg-orion-elevated/60 border-b border-orion-hairline flex items-center px-3">
        <span className="text-xs font-mono text-muted-foreground">{file.name}</span>
      </div>
      <Editor
        height="calc(100% - 40px)"
        language={file.language || getLanguage(file.name)}
        value={file.content || ''}
        theme="vs-dark"
        loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
        }}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
}
