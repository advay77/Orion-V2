export interface ConfidenceResult {
  score: number; // 0-100
  reasoning: string;
}

export class ConfidenceCalculator {
  static calculateRouterConfidence(
    selectedCapability: number,
    requiredCapability: number,
    ambiguity: number = 0,
  ): ConfidenceResult {
    const gap = selectedCapability - requiredCapability;
    const gapBonus = Math.min(gap * 2.5, 40);
    const ambiguityPenalty = ambiguity * 5;
    const rawScore = 50 + gapBonus - ambiguityPenalty;
    const clampedScore = Math.max(0, Math.min(100, rawScore));

    let reasoning = `Base confidence: 50`;
    if (gap > 0) reasoning += ` + capability gap bonus: ${gapBonus.toFixed(1)}`;
    if (ambiguity > 0) reasoning += ` - ambiguity penalty: ${ambiguityPenalty.toFixed(1)}`;
    reasoning += ` = ${clampedScore.toFixed(1)}`;

    return { score: clampedScore, reasoning };
  }

  /**
   * Blend router score with execution signals (0-1 output).
   */
  static blendTaskConfidence(input: {
    routerConfidence: number; // 0-1
    success: boolean;
    outputChars: number;
    agentBaseline: number; // 0-1
  }): number {
    if (!input.success) return 0;

    const router = Math.max(0, Math.min(1, input.routerConfidence));
    const baseline = Math.max(0, Math.min(1, input.agentBaseline));
    // Very short outputs are suspicious for research/engineering
    const lengthFactor =
      input.outputChars < 40 ? 0.55 : input.outputChars < 200 ? 0.75 : input.outputChars > 20000 ? 0.9 : 1;

    const blended = router * 0.5 + baseline * 0.35 + lengthFactor * 0.15;
    return Math.round(Math.max(0, Math.min(1, blended)) * 100) / 100;
  }

  static calculateOverallConfidence(agentConfidences: number[]): number {
    if (agentConfidences.length === 0) return 0;
    const sum = agentConfidences.reduce((acc, conf) => acc + conf, 0);
    return sum / agentConfidences.length;
  }

  static normalizeToDecimal(confidence: number): number {
    return confidence / 100;
  }

  static normalizeToPercentage(confidence: number): number {
    return confidence * 100;
  }
}
