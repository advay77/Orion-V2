import type { EngineResult } from './types';
import { ArtifactParser } from './artifact-parser';
import { ProjectDetector } from './project-detector';
import { ArtifactNormalizer } from './artifact-normalizer';
import { ArtifactValidator } from './artifact-validator';
import { VirtualFileSystem } from './virtual-file-system';
import { ManifestGenerator } from './manifest-generator';

export class ArtifactEngine {
  process(llmOutput: string | unknown): EngineResult {
    // Handle non-string inputs
    const outputStr = typeof llmOutput === 'string' ? llmOutput : JSON.stringify(llmOutput);
    const parser = new ArtifactParser();
    const artifacts = parser.parse(outputStr);

    const detector = new ProjectDetector();
    const detection = detector.detect(artifacts);

    const normalizer = new ArtifactNormalizer();
    const vfs = normalizer.normalize(artifacts, detection.framework);

    const validator = new ArtifactValidator();
    const validation = validator.validate(vfs, detection.framework);

    const manifestGenerator = new ManifestGenerator();
    const manifest = manifestGenerator.generate(vfs, detection.framework);

    return {
      vfs,
      manifest,
      framework: detection.framework,
      validation,
      previewable: detection.framework.previewable,
    };
  }

  merge(results: EngineResult[]): EngineResult {
    if (results.length === 0) {
      throw new Error('No results to merge');
    }

    if (results.length === 1) {
      return results[0];
    }

    const mergedVfs = new Map(results[0].vfs.entries());
    let bestResult = results[0];

    for (let i = 1; i < results.length; i++) {
      const result = results[i];
      for (const [path, file] of result.vfs.entries()) {
        const existing = mergedVfs.get(path);
        if (!existing || file.content.length > existing.content.length) {
          mergedVfs.set(path, file);
        }
      }
      if (result.framework.previewable && !bestResult.framework.previewable) {
        bestResult = result;
      }
    }

    const manifestGenerator = new ManifestGenerator();
    const manifest = manifestGenerator.generate(mergedVfs, bestResult.framework);

    const validator = new ArtifactValidator();
    const validation = validator.validate(mergedVfs, bestResult.framework);

    return {
      vfs: mergedVfs,
      manifest,
      framework: bestResult.framework,
      validation,
      previewable: bestResult.framework.previewable,
    };
  }
}
