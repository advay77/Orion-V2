import type { FrameworkDefinition, VFSMap, ValidationResult } from '../types';

export const htmlFramework: FrameworkDefinition = {
  id: 'html',
  name: 'HTML/Vanilla JS',
  detect(paths: string[], content: Record<string, string>): number {
    let score = 0;
    if (paths.some(p => p.endsWith('.html'))) score += 0.6;
    if (paths.some(p => p.endsWith('.css'))) score += 0.2;
    if (paths.some(p => p.endsWith('.js'))) score += 0.2;
    if (paths.includes('index.html')) score += 0.3;
    return Math.min(score, 1);
  },
  canonicalPaths: {
    'styles.css': 'assets/css/styles.css',
    'style.css': 'assets/css/styles.css',
    'script.js': 'assets/js/main.js',
    'main.js': 'assets/js/main.js',
    'index.js': 'assets/js/main.js',
  },
  entryFile: 'index.html',
  previewFile: 'index.html',
  previewable: true,
  requiredFiles: ['index.html'],
  validateStructure(vfs: VFSMap): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    if (!vfs.has('index.html')) {
      errors.push('Missing index.html');
    }
    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },
  rewriteReferences(content: string, paths: string[]): string {
    let updated = content;
    if (paths.includes('assets/css/styles.css')) {
      updated = updated.replace(/href=["'](\.\/)?styles?\.css["']/g, 'href="assets/css/styles.css"');
    }
    if (paths.includes('assets/js/main.js')) {
      updated = updated.replace(/src=["'](\.\/)?(script|main|index)\.js["']/g, 'src="assets/js/main.js"');
    }
    return updated;
  },
};
