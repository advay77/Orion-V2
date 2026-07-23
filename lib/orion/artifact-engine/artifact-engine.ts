import type { EngineResult } from './types';
import { ArtifactParser } from './artifact-parser';
import { ProjectDetector } from './project-detector';
import { ArtifactNormalizer } from './artifact-normalizer';
import { ArtifactValidator } from './artifact-validator';
import { ManifestGenerator } from './manifest-generator';

export class ArtifactEngine {
  process(llmOutput: string | unknown): EngineResult {
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

    // Prefer the largest structured tree as the base (usually engineering).
    const ranked = [...results].sort((a, b) => {
      const score = (r: EngineResult) =>
        r.vfs.size * 10 +
        (r.previewable ? 5 : 0) +
        (r.framework.id !== 'generic' ? 8 : 0) +
        (r.validation.valid ? 3 : 0);
      return score(b) - score(a);
    });

    const bestResult = ranked[0];
    const mergedVfs = new Map(bestResult.vfs.entries());

    for (let i = 1; i < ranked.length; i++) {
      const result = ranked[i];
      const allowForeign = bestResult.vfs.size < 3;
      for (const [path, file] of result.vfs.entries()) {
        if (!allowForeign && result.framework.id !== bestResult.framework.id) {
          if (
            !/^(src|app|pages|public|components|lib|styles)\//.test(path) &&
            path !== 'package.json'
          ) {
            continue;
          }
        }
        const existing = mergedVfs.get(path);
        if (!existing || file.content.length > existing.content.length) {
          mergedVfs.set(path, file);
        }
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
