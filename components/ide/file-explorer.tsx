'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Folder, FolderOpen, ChevronRight, ChevronDown, FileCode, Image, FileText } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: string | null;
  onFileSelect: (file: string) => void;
}

export function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') return null;

    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'go':
      case 'rs':
        return <FileCode className="w-3.5 h-3.5 text-orion-ink-muted" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'md':
      case 'txt':
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <File className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const renderNode = (node: FileNode, path: string = '', depth: number = 0, index?: number) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(fullPath);
    const isSelected = selectedFile === fullPath;

    if (node.type === 'folder') {
      return (
        <div key={fullPath}>
          <button
            type="button"
            className="w-full flex items-center gap-1 py-1 px-2 hover:bg-secondary/50 cursor-pointer rounded text-xs text-left"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-orion-paper/70 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-orion-paper/70 shrink-0" />
            )}
            <span className="text-foreground/90 truncate">{node.name}</span>
          </button>
          <AnimatePresence>
            {isExpanded && node.children && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {node.children.map((child, childIndex) =>
                  renderNode(child, fullPath, depth + 1, childIndex),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <button
        type="button"
        key={`${fullPath}-${index}`}
        className={`w-full flex items-center gap-1.5 py-1 px-2 cursor-pointer rounded text-xs text-left ${
          isSelected
            ? 'bg-orion-ink/15 text-orion-paper'
            : 'hover:bg-secondary/50 text-foreground/85'
        }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        onClick={() => onFileSelect(fullPath)}
      >
        {getFileIcon(node)}
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="h-full bg-orion-elevated/30 flex flex-col">
      <div className="px-3 py-2 border-b border-orion-hairline">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Explorer
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {files.map((file, index) => renderNode(file, '', 0, index))}
      </div>
    </div>
  );
}
