import type { VFSMap, VFSNode, VFSFile } from './types';

// Temporary type for building the tree with object children
type TempVFSNode = {
  name: string;
  type: 'file' | 'folder';
  children?: Record<string, TempVFSNode> | VFSNode[];
  file?: VFSFile;
};

export class VirtualFileSystem {
  static buildTree(vfs: VFSMap): VFSNode[] {
    const root: Record<string, TempVFSNode> = {};

    for (const [path, file] of vfs.entries()) {
      const parts = path.split('/').filter(p => p.length > 0);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (isFile) {
          current[part] = { name: part, type: 'file', file };
        } else {
          if (!current[part]) {
            current[part] = { name: part, type: 'folder', children: {} };
          }
          current = current[part].children as Record<string, TempVFSNode>;
        }
      }
    }

    return this.flattenObjectToNodes(root);
  }

  private static flattenObjectToNodes(obj: Record<string, TempVFSNode>): VFSNode[] {
    const nodes: VFSNode[] = [];
    const keys = Object.keys(obj).sort((a, b) => {
      const aIsFolder = obj[a].type === 'folder';
      const bIsFolder = obj[b].type === 'folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    for (const key of keys) {
      const node = obj[key];
      if (node.type === 'folder' && node.children && typeof node.children === 'object' && !Array.isArray(node.children)) {
        (node as unknown as VFSNode).children = this.flattenObjectToNodes(node.children as Record<string, TempVFSNode>);
      }
      nodes.push(node as unknown as VFSNode);
    }

    return nodes;
  }

  static toFlatRecord(vfs: VFSMap): Record<string, VFSFile> {
    const record: Record<string, VFSFile> = {};
    for (const [path, file] of vfs.entries()) {
      record[path] = file;
    }
    return record;
  }
}
