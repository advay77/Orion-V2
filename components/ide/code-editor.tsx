'use client';

import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
}

interface CodeEditorProps {
  file: FileNode | null | undefined;
}

export function CodeEditor({ file }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

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
