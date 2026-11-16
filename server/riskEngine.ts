export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface IndicatorInput {
  type: string;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  evidence: string;
  explanation: string;
}

export interface ScoredIndicator {
  type: string;
  label: string;
  weight: number;
  appliedPoints: number;
  severity: string;
  detected: boolean;
  supportingEvidence: string;
  explanation: string;
}

export interface RiskAssessmentResult {
  riskScore: number;
  riskLevel: RiskLevel;
  categoryDescription: string;
  scoredIndicators: ScoredIndicator[];
  safeguardsApplied: string[];
  reasons: string[];
  recommendedActions: string[];
  isPrototypeScoringDisclaimer: string;
}

// Prototype rule-based weights from specification Section 8 (max 100 points)
export const RULE_WEIGHTS: Record<string, { label: string; weight: number }> = {
  authority_impersonation: { label: 'Authority impersonation', weight: 20 },
  urgent_payment_demand: { label: 'Urgent payment demand', weight: 15 },
  otp_or_pin_request: { label: 'OTP or PIN request', weight: 25 },
  suspicious_external_link: { label: 'Suspicious external link', weight: 15 },
  threat_or_fear_language: { label: 'Threat or fear-based language', weight: 10 },
  payment_purpose_inconsistency: { label: 'Payment-purpose inconsistency', weight: 15 },
};

const INDICATOR_ALIASES: Record<string, string> = {
  urgency: 'urgent_payment_demand',
  urgent_payment_demand: 'urgent_payment_demand',
  urgency_pressure: 'urgent_payment_demand',
  financial_pressure: 'urgent_payment_demand',
  authority_impersonation: 'authority_impersonation',
  impersonation: 'authority_impersonation',
  otp_request: 'otp_or_pin_request',
  pin_request: 'otp_or_pin_request',
  otp_or_pin_request: 'otp_or_pin_request',
  confidential_info_request: 'otp_or_pin_request',
  suspicious_link: 'suspicious_external_link',
  suspicious_external_link: 'suspicious_external_link',
  phishing_url: 'suspicious_external_link',
  fear: 'threat_or_fear_language',
  threat: 'threat_or_fear_language',
  threats: 'threat_or_fear_language',
  threat_or_fear_language: 'threat_or_fear_language',
  payment_purpose_inconsistency: 'payment_purpose_inconsistency',
  suspicious_payment_instruction: 'payment_purpose_inconsistency',
  refund_scam_pattern: 'payment_purpose_inconsistency',
  kyc_verification_payment: 'payment_purpose_inconsistency',
  unrealistic_reward: 'payment_purpose_inconsistency',
};

export function mapScoreToRiskLevel(score: number): { level: RiskLevel; description: string } {
  if (score >= 70) {
    return {
      level: 'CRITICAL',
      description: 'Strong evidence of a potentially active financial scam.',
    };
  }
  if (score >= 40) {
    return {
      level: 'HIGH',
      description: 'Multiple significant warning indicators identified.',
    };
  }
  if (score >= 20) {
    return {
      level: 'MODERATE',
      description: 'Some suspicious indicators require independent verification.',
    };
  }
  return {
    level: 'LOW',
    description: 'No significant indicators identified.',
  };
}

export function calculateTransparentRiskScore(
  rawIndicators: IndicatorInput[],
  options: {
    hasEvidence: boolean;
    hasLegitimateContextMarker?: boolean;
    hasConflictingInformation?: boolean;
    customRuleWeights?: Record<string, number>;
  }
): RiskAssessmentResult {
  const effectiveWeights: Record<string, { label: string; weight: number }> = {};
  for (const [k, def] of Object.entries(RULE_WEIGHTS)) {
    const override = options.customRuleWeights?.[k];
    effectiveWeights[k] = {
      label: def.label,
      weight:
        typeof override === 'number' && Number.isFinite(override) && override >= 0 && override <= 50
          ? override
          : def.weight,
    };
  }

  const safeguardsApplied: string[] = [];

  if (!options.hasEvidence) {
    safeguardsApplied.push('Missing-evidence safeguard: No submitted evidence items to score.');
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      categoryDescription: 'No significant indicators identified.',
      scoredIndicators: Object.entries(effectiveWeights).map(([type, def]) => ({
        type,
        label: def.label,
        weight: def.weight,
        appliedPoints: 0,
        severity: 'none',
        detected: false,
        supportingEvidence: '',
        explanation: 'No evidence submitted yet.',
      })),
      safeguardsApplied,
      reasons: ['Insufficient evidence submitted to assess financial risk.'],
      recommendedActions: [
        'Submit the suspicious message, screenshot, call transcript, or URL before making any payment.',
      ],
      isPrototypeScoringDisclaimer:
        'Prototype rule-based score (0–100), not a statistically calibrated fraud probability.',
    };
  }

  // Deduplicate indicators by canonical rule category and reject unsupported claims
  const bestByRule = new Map<string, IndicatorInput>();
  let droppedUnsupported = 0;
  let deduplicatedCount = 0;

  for (const ind of rawIndicators) {
    if (!ind.evidence || ind.evidence.trim().length < 3) {
      droppedUnsupported++;
      continue;
    }
    const canonical = INDICATOR_ALIASES[ind.type.toLowerCase().trim()];
    if (!canonical) continue;
    if (ind.severity === 'none') continue;

    if (bestByRule.has(canonical)) {
      deduplicatedCount++;
      const prev = bestByRule.get(canonical)!;
      const rank = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };
      if (rank[ind.severity] > rank[prev.severity]) {
        bestByRule.set(canonical, ind);
      }
    } else {
      bestByRule.set(canonical, ind);
    }
  }

  if (droppedUnsupported > 0) {
    safeguardsApplied.push(
      `Unsupported-claim safeguard: Filtered ${droppedUnsupported} indicator(s) lacking concrete evidence quotes.`
    );
  }
  if (deduplicatedCount > 0) {
    safeguardsApplied.push(
      `Duplicate-indicator safeguard: Consolidated ${deduplicatedCount} repeated indicator(s) so each rule category scores at most once.`
    );
  }
  if (options.hasLegitimateContextMarker) {
    safeguardsApplied.push(
      'Legitimate-context safeguard: Genuine informational alerts without payment demands or credential requests are kept low-risk.'
    );
  }
  if (options.hasConflictingInformation) {
    safeguardsApplied.push(
      'Conflicting-evidence safeguard: Conflicting details between submitted items are flagged for manual verification.'
    );
  }

  let totalScore = 0;
  const scoredIndicators: ScoredIndicator[] = [];
  const reasons: string[] = [];

  for (const [ruleKey, ruleDef] of Object.entries(effectiveWeights)) {
    const matched = bestByRule.get(ruleKey);
    if (matched) {
      // Scale partial weight slightly if severity is strictly 'low' so low ambiguity doesn't over-trigger
      const appliedPoints =
        matched.severity === 'low' ? Math.round(ruleDef.weight * 0.6) : ruleDef.weight;
      totalScore += appliedPoints;
      scoredIndicators.push({
        type: ruleKey,
        label: ruleDef.label,
        weight: ruleDef.weight,
        appliedPoints,
        severity: matched.severity,
        detected: true,
        supportingEvidence: matched.evidence,
        explanation: matched.explanation,
      });
      reasons.push(`${ruleDef.label} (+${appliedPoints} pts): ${matched.explanation}`);
    } else {
      scoredIndicators.push({
        type: ruleKey,
        label: ruleDef.label,
        weight: ruleDef.weight,
        appliedPoints: 0,
        severity: 'none',
        detected: false,
        supportingEvidence: '',
        explanation: 'Not detected in submitted evidence.',
      });
    }
  }

  totalScore = Math.min(100, totalScore);
  const { level, description } = mapScoreToRiskLevel(totalScore);

  const recommendedActions: string[] = [];
  if (level === 'CRITICAL' || level === 'HIGH') {
    recommendedActions.push(
      'Do not authorise any UPI payment, bank transfer, or screen-sharing request.'
    );
    recommendedActions.push(
      'Do not share OTP, UPI PIN, ATM PIN, CVV, or netbanking passwords with anyone.'
    );
    recommendedActions.push(
      'Verify independently by calling your bank using the official number on the back of your debit card or official bank website.'
    );
    if (level === 'CRITICAL') {
      recommendedActions.push(
        'If money has already been transferred, open FINSHIELD RESCUE immediately, call 1930, and report at https://cybercrime.gov.in/.'
      );
    }
  } else if (level === 'MODERATE') {
    recommendedActions.push(
      'Pause and verify the sender or caller through an official, independent channel before acting.'
    );
    recommendedActions.push(
      'Avoid clicking unverified links; check your official banking app directly.'
    );
  } else {
    recommendedActions.push(
      'No significant scam indicators were detected in the submitted material, though standard caution always applies.'
    );
  }

  return {
    riskScore: totalScore,
    riskLevel: level,
    categoryDescription: description,
    scoredIndicators,
    safeguardsApplied,
    reasons: reasons.length > 0 ? reasons : ['No rule-based risk indicators triggered.'],
    recommendedActions,
    isPrototypeScoringDisclaimer:
      'Prototype rule-based score (0–100), not a statistically calibrated fraud probability.',
  };
}

export interface PaymentSafetyInput {
  amount: string;
  purpose: string;
  recipientFamiliarity: 'known' | 'merchant' | 'unknown';
  contactMethod: 'phone_call' | 'sms' | 'whatsapp' | 'email' | 'in_person' | 'official_app';
  requestedByCaller: boolean;
  urgencyInvolved: boolean;
  kycRelated: boolean;
  confidentialInfoAsked: boolean;
  independentlyVerified: boolean;
}

export function evaluatePaymentSafety(input: PaymentSafetyInput) {
  let score = 0;
  const reasons: string[] = [];

  if (input.recipientFamiliarity === 'unknown') {
    score += 20;
    reasons.push('Unknown payment recipient.');
  }

  const purposeLower = input.purpose.toLowerCase();
  if (
    input.kycRelated ||
    /kyc|verif|unblock|refund|processing fee|activation|reward|prize|customs/i.test(purposeLower)
  ) {
    score += 20;
    reasons.push(
      'Suspicious verification, KYC, refund-claim, or advance-fee related payment purpose.'
    );
  }

  if (input.urgencyInvolved) {
    score += 15;
    reasons.push('Urgent payment instructions creating time pressure.');
  }

  if (input.confidentialInfoAsked) {
    score += 25;
    reasons.push('Request for confidential credentials (OTP, PIN, CVV, or password).');
  }

  if (!input.independentlyVerified) {
    score += 15;
    reasons.push('Payment request has not been independently verified.');
  }

  if (
    input.requestedByCaller &&
    (input.contactMethod === 'phone_call' ||
      input.contactMethod === 'whatsapp' ||
      input.contactMethod === 'sms')
  ) {
    score += 10;
    reasons.push(`Unsolicited payment instruction delivered via ${input.contactMethod.replace('_', ' ')}.`);
  }

  score = Math.min(100, score);
  const { level, description } = mapScoreToRiskLevel(score);

  let recommendedAction =
    'Standard caution: confirm recipient details inside your payment app before approving.';
  if (level === 'CRITICAL' || level === 'HIGH') {
    recommendedAction =
      'Do not proceed until you independently verify the request with your bank or intended recipient using official contact details. FINSHIELD AI is not connected to the UPI network and cannot block or cancel transactions.';
  } else if (level === 'MODERATE') {
    recommendedAction =
      'Verify the recipient and purpose through an independent official contact before transferring funds.';
  }

  return {
    riskScore: score,
    riskLevel: level,
    title:
      level === 'CRITICAL'
        ? 'CRITICAL RISK — DO NOT PAY'
        : level === 'HIGH'
          ? 'HIGH RISK — PAYMENT CAUTION'
          : level === 'MODERATE'
            ? 'MODERATE RISK — VERIFY FIRST'
            : 'LOW RISK — STANDARD CAUTION',
    description,
    reasons: reasons.length > 0 ? reasons : ['No high-risk payment context factors selected.'],
    recommendedAction,
  };
}

export function analyzeUrlStructure(rawUrl: string) {
  const characteristics: string[] = [];
  let parsedHostname = '';
  let protocol = '';
  let suspiciousCount = 0;

  try {
    const normalized = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `http://${rawUrl.trim()}`;
    const u = new URL(normalized);
    parsedHostname = u.hostname.toLowerCase();
    protocol = u.protocol.replace(':', '');

    if (protocol === 'http') {
      characteristics.push('Uses unencrypted HTTP instead of HTTPS.');
      suspiciousCount++;
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsedHostname)) {
      characteristics.push('Uses a raw IP address instead of a registered domain name.');
      suspiciousCount += 2;
    }
    const labels = parsedHostname.split('.');
    if (labels.length >= 4) {
      characteristics.push(`Deeply nested subdomain structure (${labels.length} domain labels).`);
      suspiciousCount++;
    }
    if (
      /bit\.ly|tinyurl\.com|t\.co|rb\.gy|cutt\.ly|is\.gd|shorturl/i.test(parsedHostname)
    ) {
      characteristics.push('Uses a URL shortening service that obscures the final destination.');
      suspiciousCount++;
    }
    if (
      /(sbi|hdfc|icici|axis|kotak|npci|upi|paytm|phonepe|gpay|kyc|rbi)/i.test(rawUrl) &&
      !/(sbi\.co\.in|onlinesbi\.sbi|hdfcbank\.com|icicibank\.com|axisbank\.com|kotak\.com|npci\.org\.in|rbi\.org\.in)$/i.test(
        parsedHostname
      )
    ) {
      characteristics.push(
        'Contains Indian banking/UPI brand keywords on an unofficial or non-matching domain.'
      );
      suspiciousCount += 2;
    }
    if (/\.(xyz|top|tk|ml|ga|cf|gq|click|buzz|icu|info)$/i.test(parsedHostname)) {
      characteristics.push('Uses a top-level domain frequently abused in phishing campaigns.');
      suspiciousCount++;
    }
    if (parsedHostname.includes('-') && labels[0].length > 16) {
      characteristics.push('Long hyphenated domain label resembling lookalike phishing URLs.');
      suspiciousCount++;
    }

    return {
      valid: true,
      url: u.toString(),
      hostname: parsedHostname,
      protocol,
      characteristics,
      isStructurallySuspicious: suspiciousCount >= 2,
      reputationNote:
        'Structural URL inspection completed locally. Live external domain reputation lookup is not configured in this environment, so domain status is assessed strictly from observable URL characteristics.',
    };
  } catch {
    return {
      valid: false,
      url: rawUrl,
      hostname: '',
      protocol: '',
      characteristics: ['Malformed URL syntax that could not be parsed cleanly.'],
      isStructurallySuspicious: true,
      reputationNote: 'Could not parse as a standard HTTP/HTTPS URL.',
    };
  }
}

export function redactSensitiveText(text: string): string {
  if (!text) return '';
  return (
    text
      // Mask 12-digit Aadhaar-like numbers
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED-ID-NUMBER]')
      // Mask PAN-like identifiers
      .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[REDACTED-PAN]')
      // Mask 10-16 digit bank/card numbers
      .replace(/\b\d{10,16}\b/g, '[REDACTED-ACCOUNT-OR-PHONE]')
      // Mask 4-6 digit OTPs preceded by OTP/PIN keywords
      .replace(/\b(otp|pin|cvv)\s*[:\-]?\s*\d{4,6}\b/gi, '$1: [REDACTED]')
  );
}
