import type { FrameworkDefinition } from '../types';
import { htmlFramework } from './html';
import { reactFramework } from './react';
import { viteFramework } from './vite';
import { nextjsFramework } from './nextjs';
import { nodeFramework } from './node';
import { pythonFramework } from './python';
import { javaFramework } from './java';
import { cppFramework } from './cpp';
import { rustFramework } from './rust';
import { genericFramework } from './generic';

const frameworks: FrameworkDefinition[] = [
  nextjsFramework,
  viteFramework,
  reactFramework,
  nodeFramework,
  htmlFramework,
  pythonFramework,
  javaFramework,
  cppFramework,
  rustFramework,
  genericFramework,
];

const frameworkRegistry = new Map<string, FrameworkDefinition>();

export function registerFramework(framework: FrameworkDefinition): void {
  frameworkRegistry.set(framework.id, framework);
}

export function getFramework(id: string): FrameworkDefinition | undefined {
  return frameworkRegistry.get(id);
}

export function getAllFrameworks(): FrameworkDefinition[] {
  return frameworks;
}

for (const fw of frameworks) {
  registerFramework(fw);
}
