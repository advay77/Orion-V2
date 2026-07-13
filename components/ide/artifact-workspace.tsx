'use client';

import { useState, useMemo } from 'react';
import { Plan } from '@/lib/orion';
import { motion } from 'framer-motion';
import { Eye, Code, Files, Play, Download, Loader2, FolderOpen } from 'lucide-react';
import { FileExplorer } from '@/components/ide/file-explorer';
import { CodeEditor } from '@/components/ide/code-editor';
import { PreviewPanel } from '@/components/ide/preview-panel';
import { VirtualFileSystem as VFS, VFSNode, VFSFile, VFSMap } from '@/lib/orion/artifact-engine';

interface ArtifactWorkspaceProps {
  plan: Plan | null;
  artifacts?: {
    manifest: any;
    vfs: Record<string, VFSFile>;
    validation: any;
    framework: string;
    previewable: boolean;
  } | null | Record<string, any>;
  taskResults?: Record<string, any>;
}

type TabType = 'preview' | 'code' | 'files' | 'execution' | 'download';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
  content?: string;
}

export function ArtifactWorkspace({ plan, artifacts: backendArtifacts, taskResults }: ArtifactWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('execution');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Convert VFS to FileNode structure and tree
  const parsedArtifacts = useMemo(() => {
    // Check if it's the new format with vfs
    if (backendArtifacts && 'vfs' in backendArtifacts && backendArtifacts.vfs) {
      const vfsMap = new Map(Object.entries(backendArtifacts.vfs)) as VFSMap;
      const tree = VFS.buildTree(vfsMap);
      return convertVFSNodeToFileNode(tree);
    }
    // Fallback to old format if needed
    return [];
  }, [backendArtifacts]);

  const hasArtifacts = parsedArtifacts.length > 0;
  const isExecutionComplete = plan?.tasks.every(t => t.status === 'completed' || t.status === 'failed');

  // Helper to convert VFSNode array to FileNode array
  function convertVFSNodeToFileNode(nodes: VFSNode[]): FileNode[] {
    return nodes.map(node => {
      if (node.type === 'file') {
        return {
          name: node.name,
          type: 'file',
          language: node.file?.language,
          content: node.file?.content,
        };
      } else {
        return {
          name: node.name,
          type: 'folder',
          children: node.children ? convertVFSNodeToFileNode(node.children) : [],
        };
      }
    });
  }

  const renderTabContent = () => {
    if (!plan) {
      return (
        <div className="h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <FolderOpen className="w-16 h-16 text-[#30363d] mx-auto mb-4" />
            <p className="text-[#8b949e]">No execution in progress</p>
          </motion.div>
        </div>
      );
    }

    switch (activeTab) {
      case 'preview':
        if (!hasArtifacts || !backendArtifacts || !('previewable' in backendArtifacts) || !backendArtifacts.previewable) {
          return null;
        }
        return <PreviewPanel 
          files={parsedArtifacts} 
          vfs={('vfs' in backendArtifacts ? backendArtifacts.vfs : {})} 
          manifest={('manifest' in backendArtifacts ? backendArtifacts.manifest : undefined)} 
        />;
      
      case 'code':
        if (!hasArtifacts) {
          return null;
        }
        return (
          <div className="h-full flex">
            <div className="w-64 border-r border-[#30363d]">
              <FileExplorer
                files={parsedArtifacts}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
              />
            </div>
            <div className="flex-1">
              <CodeEditor
                file={selectedFile ? getFileByPath(parsedArtifacts, selectedFile) : getFirstFile(parsedArtifacts)}
              />
            </div>
          </div>
        );
      
      case 'files':
        if (!hasArtifacts) {
          return null;
        }
        return (
          <div className="h-full p-6">
            <FileExplorer
              files={parsedArtifacts}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
            />
          </div>
        );
      
      case 'execution':
        return (
          <div className="h-full p-6 overflow-auto">
            <h3 className="text-white font-semibold mb-4">Execution Log</h3>
            {backendArtifacts && 'validation' in backendArtifacts && (backendArtifacts.validation?.warnings?.length > 0 || backendArtifacts.validation?.errors?.length > 0) && (
              <div className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded">
                {backendArtifacts.validation?.warnings?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-400 text-xs font-medium">Warnings:</p>
                    <ul className="list-disc list-inside text-yellow-400/70 text-xs">
                      {backendArtifacts.validation.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {backendArtifacts.validation?.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-400 text-xs font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-red-400/70 text-xs">
                      {backendArtifacts.validation.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              {plan?.tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded border ${
                    task.status === 'completed'
                      ? 'bg-green-900/20 border-green-700/50'
                      : task.status === 'failed'
                      ? 'bg-red-900/20 border-red-700/50'
                      : task.status === 'in_progress'
                      ? 'bg-cyan-900/20 border-cyan-700/50'
                      : 'bg-[#161b22] border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{task.description}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      task.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-[#21262d] text-[#8b949e]'
                    }`}>
                      {task.status === 'in_progress' && <Loader2 className="w-3 h-3 inline animate-spin mr-1" />}
                      {task.status}
                    </span>
                  </div>
                  {task.result != null && (
                    <pre className="text-xs text-[#8b949e] whitespace-pre-wrap">
                      {(typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)) as string}
                    </pre>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      
      case 'download':
        if (!hasArtifacts) {
          return null;
        }
        return (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-white font-semibold">Download Project</h3>
              <p className="text-[#8b949e] text-sm">
                {Object.keys(backendArtifacts?.vfs ?? {}).length} file
                {Object.keys(backendArtifacts?.vfs ?? {}).length !== 1 ? 's' : ''} generated
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-xl shadow-cyan-500/25"
              onClick={async () => {
                const vfs = backendArtifacts?.vfs;
                if (!vfs || Object.keys(vfs).length === 0) return;

                try {
                  // Dynamically import JSZip to keep bundle size down
                  const JSZip = (await import('jszip')).default;
                  const zip = new JSZip();

                  for (const [filePath, fileData] of Object.entries(vfs) as [string, any][]) {
                    const content = fileData?.content ?? '';
                    // filePath may start with '/' — normalize it
                    const normalizedPath = filePath.replace(/^\//, '');
                    zip.file(normalizedPath, content);
                  }

                  const blob = await zip.generateAsync({ type: 'blob' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'orion-project.zip';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 10_000);
                } catch (err) {
                  console.error('ZIP download failed:', err);
                }
              }}
            >
              <Download className="w-5 h-5" />
              Download ZIP
            </motion.button>
          </div>
        );
      
      default:
        return null;
    }
  }

  const getFileByPath = (files: FileNode[], targetPath: string, currentPath: string = ''): FileNode | null => {
    for (const file of files) {
      const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      if (file.type === 'file' && fullPath === targetPath) {
        return file;
      }
      if (file.children) {
        const found = getFileByPath(file.children, targetPath, fullPath);
        if (found) return found;
      }
    }
    return null;
  };

  const getFirstFile = (files: FileNode[]): FileNode | null => {
    for (const file of files) {
      if (file.type === 'file') return file;
      if (file.children) {
        const found = getFirstFile(file.children);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      <div className="flex items-center border-b border-[#30363d] bg-[#161b22]">
        {[
          { id: 'preview' as TabType, label: 'Preview', icon: Eye },
          { id: 'code' as TabType, label: 'Code', icon: Code },
          { id: 'files' as TabType, label: 'Files', icon: Files },
          { id: 'execution' as TabType, label: 'Execution', icon: Play },
          { id: 'download' as TabType, label: 'Download', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isTabDisabled = tab.id !== 'execution' && !hasArtifacts;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isTabDisabled && setActiveTab(tab.id)}
              disabled={isTabDisabled}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-cyan-500 bg-[#0d1117]'
                  : isTabDisabled
                  ? 'text-[#484f58] cursor-not-allowed'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
}
