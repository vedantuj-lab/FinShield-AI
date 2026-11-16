import assert from 'node:assert/strict';
import {
  analyzeUrlStructure,
  calculateTransparentRiskScore,
  evaluatePaymentSafety,
  redactSensitiveText,
} from '../server/riskEngine.ts';

// 1. Missing evidence safeguard
const emptyRes = calculateTransparentRiskScore([], { hasEvidence: false });
assert.equal(emptyRes.riskLevel, 'LOW');
assert.equal(emptyRes.riskScore, 0);

// 2. Duplicate indicator & unsupported claim safeguards
const dupRes = calculateTransparentRiskScore(
  [
    {
      type: 'authority_impersonation',
      severity: 'high',
      evidence: 'Bank verification department',
      explanation: 'Claims bank authority',
    },
    {
      type: 'authority_impersonation',
      severity: 'moderate',
      evidence: 'Reserve Bank officer',
      explanation: 'Duplicate authority indicator',
    },
    {
      type: 'otp_or_pin_request',
      severity: 'critical',
      evidence: '',
      explanation: 'Empty quote should be dropped',
    },
  ],
  { hasEvidence: true }
);
assert.equal(dupRes.riskScore, 20);
assert.equal(dupRes.riskLevel, 'MODERATE');

// 3. Critical multi-indicator scam escalation
const critRes = calculateTransparentRiskScore(
  [
    {
      type: 'authority_impersonation',
      severity: 'high',
      evidence: 'SBI verification desk',
      explanation: 'Impersonates bank staff',
    },
    {
      type: 'urgent_payment_demand',
      severity: 'high',
      evidence: 'pay within 10 minutes',
      explanation: 'Artificial deadline',
    },
    {
      type: 'otp_or_pin_request',
      severity: 'critical',
      evidence: 'share OTP',
      explanation: 'Requests confidential OTP',
    },
    {
      type: 'suspicious_external_link',
      severity: 'high',
      evidence: 'http://sbi-kyc-portal.xyz',
      explanation: 'Lookalike HTTP domain',
    },
  ],
  { hasEvidence: true }
);
assert.equal(critRes.riskScore, 75);
assert.equal(critRes.riskLevel, 'CRITICAL');

// 4. Pre-payment safety checkpoint (Prompt Section 9 example)
const payCheck = evaluatePaymentSafety({
  amount: '25000',
  purpose: 'Bank verification',
  recipientFamiliarity: 'unknown',
  contactMethod: 'phone_call',
  requestedByCaller: true,
  urgencyInvolved: true,
  kycRelated: true,
  confidentialInfoAsked: false,
  independentlyVerified: false,
});
assert.ok(payCheck.riskLevel === 'HIGH' || payCheck.riskLevel === 'CRITICAL');
assert.ok(payCheck.reasons.length >= 4);

// 5. URL structure check
const urlCheck = analyzeUrlStructure('http://sbi-kyc-verify-portal.xyz/update');
assert.equal(urlCheck.isStructurallySuspicious, true);

// 6. Redaction check
const redacted = redactSensitiveText('Account 123456789012 OTP: 482910');
assert.ok(!redacted.includes('123456789012'));
assert.ok(!redacted.includes('482910'));

console.log('All FINSHIELD AI riskEngine tests passed.');
