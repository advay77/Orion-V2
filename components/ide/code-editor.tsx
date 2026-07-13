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
      <div className="h-full flex items-center justify-center text-[#8b949e]">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] flex items-center px-4">
        <span className="text-white text-sm font-medium">{file.name}</span>
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
