/**
 * Detect whether LLM output likely contains extractable code fences.
 * Aligned with ArtifactParser capabilities — intentionally looser than
 * "must have path=" so engineering pathless fences still get processed.
 */
export function hasExtractableCode(resultStr: string): boolean {
  if (!resultStr || typeof resultStr !== 'string') return false;

  // ```tsx path="..." / file="..." / path='...'
  if (/```[\w+#.-]*\s+(?:path|file)\s*=/.test(resultStr)) return true;

  // ```src/App.tsx  (bare path as fence tag)
  if (/```[\w./-]+\.[a-zA-Z0-9]+/.test(resultStr)) return true;

  // ```tsx src/App.tsx  (lang + path, no =)
  if (/```[\w+#.-]+\s+[\w./-]+\.[a-zA-Z0-9]+/.test(resultStr)) return true;

  // // filepath: src/App.tsx  (or # path:) above / inside content
  if (/(?:\/\/|#|--)\s*(?:filepath|file|path)\s*:/i.test(resultStr)) return true;

  // Any non-empty fenced block (pathless — parser assigns stable defaults)
  if (/```[^\n]*\n[\s\S]*?```/.test(resultStr)) return true;

  return false;
}

export function isSkippedTaskResult(resultStr: string): boolean {
  return /Task skipped\s*-/i.test(resultStr);
}
