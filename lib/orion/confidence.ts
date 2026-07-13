export interface ConfidenceResult {
  score: number; // 0-100
  reasoning: string;
}

export class ConfidenceCalculator {
  /**
   * Calculate confidence based on model capability gap and ambiguity
   * Formula: 50 + min(gap×2.5, 40) - ambiguity penalty, clamped 0-100
   */
  static calculateRouterConfidence(
    selectedCapability: number,
    requiredCapability: number,
    ambiguity: number = 0
  ): ConfidenceResult {
    const gap = selectedCapability - requiredCapability;
    const gapBonus = Math.min(gap * 2.5, 40);
    const ambiguityPenalty = ambiguity * 5;
    const rawScore = 50 + gapBonus - ambiguityPenalty;
    const clampedScore = Math.max(0, Math.min(100, rawScore));

    let reasoning = `Base confidence: 50`;
    if (gap > 0) {
      reasoning += ` + capability gap bonus: ${gapBonus.toFixed(1)}`;
    }
    if (ambiguity > 0) {
      reasoning += ` - ambiguity penalty: ${ambiguityPenalty.toFixed(1)}`;
    }
    reasoning += ` = ${clampedScore.toFixed(1)}`;

    return {
      score: clampedScore,
      reasoning,
    };
  }

  /**
   * Calculate overall confidence as average of agent confidences
   */
  static calculateOverallConfidence(agentConfidences: number[]): number {
    if (agentConfidences.length === 0) return 0;
    const sum = agentConfidences.reduce((acc, conf) => acc + conf, 0);
    return sum / agentConfidences.length;
  }

  /**
   * Normalize confidence to 0-1 range
   */
  static normalizeToDecimal(confidence: number): number {
    return confidence / 100;
  }

  /**
   * Convert decimal confidence to percentage
   */
  static normalizeToPercentage(confidence: number): number {
    return confidence * 100;
  }
}
