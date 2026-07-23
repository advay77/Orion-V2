'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: FileNode[];
}

interface PreviewPanelProps {
  files: FileNode[];
  vfs: Record<string, { content: string; language: string }>;
  manifest: any;
}

export function PreviewPanel({ files, vfs, manifest }: PreviewPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const generatePreview = () => {
    // First check if manifest has previewFile
    if (manifest?.previewFile && vfs[manifest.previewFile]) {
      return vfs[manifest.previewFile].content;
    }
    
    // Fallback: find index.html
    const findFileByName = (nodes: FileNode[], name: string): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name === name) {
          return node;
        }
        if (node.children) {
          const found = findFileByName(node.children, name);
          if (found) return found;
        }
      }
      return null;
    };

    const htmlFile = findFileByName(files, 'index.html');
    if (htmlFile && htmlFile.content) {
      return htmlFile.content;
    }

    const reactFiles = files.filter(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'));
    if (reactFiles.length > 0) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;

    function App() {
      return (
        <div className="container">
          <h1 style={{ fontSize: '2em', marginBottom: '0.5em' }}>Generated Artifact Preview</h1>
          <p style={{ color: '#666' }}>This is a live preview of the generated artifact.</p>
          <div style={{ marginTop: '20px', padding: '16px', background: '#f0f0f0', borderRadius: '4px' }}>
            <strong>Files in project:</strong>
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              ${reactFiles.map(f => `<li key="${f.name}">${f.name}</li>`).join('')}
            </ul>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body {
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f4f2ec;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a1d26;
    }
    .panel {
      background: #fff;
      padding: 32px;
      border: 1px solid #e5e1d8;
      border-radius: 8px;
      max-width: 480px;
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      color: #5c584f;
      line-height: 1.55;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Preview unavailable</h1>
    <p>Orion could not find a previewable entry file. Open the Code tab to inspect generated files.</p>
  </div>
</body>
</html>`;
  };

  const previewContent = generatePreview();

  return (
    <div className="h-full flex flex-col bg-orion-surface">
      <div className="h-9 bg-orion-elevated/60 border-b border-orion-hairline flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-orion-paper">Preview</span>
          <span className="text-[10px] font-mono text-muted-foreground">iframe</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 hover:bg-secondary/60 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-secondary/60 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Open in New Tab"
            onClick={() => {
              const blob = new Blob([previewContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={previewContent}
          className="w-full h-full border-0"
          title="Artifact Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
