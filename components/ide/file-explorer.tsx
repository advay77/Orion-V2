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
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return null; // Handled in render
    }

    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'go':
      case 'rs':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return <File className="w-4 h-4 text-[#8b949e]" />;
    }
  };

  const renderNode = (node: FileNode, path: string = '', depth: number = 0, index?: number) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    // Add index to key to ensure uniqueness for files with same name at root level
    const uniqueKey = path ? fullPath : `${fullPath}-${index}`;
    const isExpanded = expandedFolders.has(fullPath);
    const isSelected = selectedFile === fullPath;

    if (node.type === 'folder') {
      return (
        <div key={fullPath}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 py-1 px-2 hover:bg-[#21262d] cursor-pointer rounded text-sm"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-[#8b949e]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[#8b949e]" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-400" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-400" />
            )}
            <span className="text-[#c9d1d9]">{node.name}</span>
          </motion.div>
          <AnimatePresence>
            {isExpanded && node.children && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {node.children.map((child, childIndex) => renderNode(child, fullPath, depth + 1, childIndex))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <motion.div
        key={fullPath}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded text-sm ${
          isSelected ? 'bg-[#1f6feb] text-white' : 'hover:bg-[#21262d] text-[#c9d1d9]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        onClick={() => onFileSelect(fullPath)}
      >
        {getFileIcon(node)}
        <span className="truncate">{node.name}</span>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-[#161b22] flex flex-col">
      <div className="p-3 border-b border-[#30363d]">
        <h3 className="text-white font-medium text-sm flex items-center gap-2">
          <Folder className="w-4 h-4 text-yellow-400" />
          Explorer
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file, index) => renderNode(file, '', 0, index))}
      </div>
    </div>
  );
}
