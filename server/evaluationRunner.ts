import { analyzeEvidenceWithGemini } from './geminiService.ts';
import { calculateTransparentRiskScore } from './riskEngine.ts';
import { VALIDATION_TEST_SUITE } from './syntheticScenarios.ts';

export interface EvaluationCaseResult {
  id: string;
  label: string;
  language: string;
  expectedSuspicious: boolean;
  predictedSuspicious: boolean;
  riskLevel: string;
  riskScore: number;
  indicatorCount: number;
  processingMs: number;
  explanationSummary: string;
  outcome: 'TP' | 'TN' | 'FP' | 'FN';
}

export async function runSyntheticEvaluationSuite() {
  const results: EvaluationCaseResult[] = [];
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let totalMs = 0;
  let coveredWithExplanation = 0;

  for (const scenario of VALIDATION_TEST_SUITE) {
    const start = Date.now();
    const aiResult = await analyzeEvidenceWithGemini({
      evidenceType: scenario.evidenceType,
      rawText: scenario.content,
      language: 'en',
    });

    const risk = calculateTransparentRiskScore(aiResult.risk_indicators, {
      hasEvidence: true,
      hasLegitimateContextMarker: aiResult.legitimate_context_likely,
    });
    const elapsed = Date.now() - start;
    totalMs += elapsed;

    // Suspicious threshold: MODERATE or higher (>= 20 points) when not marked legitimate
    const predictedSuspicious = risk.riskScore >= 20;

    let outcome: 'TP' | 'TN' | 'FP' | 'FN';
    if (scenario.expectedSuspicious && predictedSuspicious) {
      tp++;
      outcome = 'TP';
    } else if (!scenario.expectedSuspicious && !predictedSuspicious) {
      tn++;
      outcome = 'TN';
    } else if (!scenario.expectedSuspicious && predictedSuspicious) {
      fp++;
      outcome = 'FP';
    } else {
      fn++;
      outcome = 'FN';
    }

    if (aiResult.summary && aiResult.summary.length > 10) {
      coveredWithExplanation++;
    }

    results.push({
      id: scenario.id,
      label: scenario.label,
      language: scenario.language,
      expectedSuspicious: scenario.expectedSuspicious,
      predictedSuspicious,
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      indicatorCount: risk.scoredIndicators.filter((i) => i.detected).length,
      processingMs: elapsed,
      explanationSummary: aiResult.summary,
      outcome,
    });
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0;
  const avgProcessingMs = results.length > 0 ? Math.round(totalMs / results.length) : 0;
  const explanationCoverage = results.length > 0 ? coveredWithExplanation / results.length : 0;

  return {
    disclaimer:
      'SYNTHETIC EVALUATION REPORT: Computed dynamically on 10 synthetic test scenarios across English, Hindi, Hinglish, and Marathi. These synthetic test metrics do not represent real-world production fraud-detection accuracy.',
    evaluatedAt: new Date().toISOString(),
    totalScenarios: results.length,
    confusionMatrix: { tp, tn, fp, fn },
    metrics: {
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1Score: Number(f1Score.toFixed(3)),
      falsePositiveRate: Number(falsePositiveRate.toFixed(3)),
      avgProcessingMs,
      explanationCoverage: Number(explanationCoverage.toFixed(3)),
    },
    cases: results,
  };
}
