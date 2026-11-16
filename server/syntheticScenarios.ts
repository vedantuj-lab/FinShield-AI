export interface SyntheticScenario {
  id: string;
  label: string;
  category: string;
  language: 'en' | 'hi' | 'hinglish' | 'mr';
  expectedSuspicious: boolean;
  evidenceType: string;
  content: string;
  isSynthetic: true;
}

export const SYNTHETIC_DEMO_CASE = {
  title: 'SYNTHETIC DEMO: Multi-Stage Bank Suspension & KYC Verification Chain',
  suspectedCategory: 'Bank Impersonation & Fake KYC Verification Scam',
  summary:
    'SYNTHETIC DEMONSTRATION DATA: Shows how an initial account-suspension SMS escalates into an impersonated verification phone call and a ₹25,000 UPI payment instruction.',
  items: [
    {
      evidenceType: 'sms',
      title: 'Evidence A: Suspicious Bank Suspension SMS (Synthetic)',
      eventTimestamp: '10:00 AM',
      rawInput:
        'URGENT ALERT: Your State Bank account will be blocked within 10 minutes due to incomplete KYC. Click http://sbi-kyc-verify-portal.xyz/update or call our verification officer immediately.',
    },
    {
      evidenceType: 'voice_transcript',
      title: 'Evidence B: Telephone Call Transcript (Synthetic)',
      eventTimestamp: '10:15 AM',
      rawInput:
        'Caller: "Good morning, I am Rajesh Sharma from the bank KYC verification department. Do not disconnect or tell anyone about this call. Your account is flagged for immediate freeze. To complete RBI biometric validation, open your UPI app and transfer ₹25,000 to our temporary verification escrow ID verify.rbi.desk@okaxis. It will auto-refund in 5 minutes."',
    },
    {
      evidenceType: 'payment_screenshot',
      title: 'Evidence C: UPI Collect Request Details (Synthetic)',
      eventTimestamp: '10:25 AM',
      rawInput:
        'UPI Collect Request Received\nPayee: Verification Desk (verify.rbi.desk@okaxis)\nAmount: ₹25,000.00\nRemark: URGENT KYC VALIDATION DEPOSIT — PAY WITHIN 3 MINS\nStatus: Pending Approval',
    },
  ],
};

export const SYNTHETIC_SAMPLE_SCENARIOS: SyntheticScenario[] = [
  {
    id: 'SYN-A',
    label: 'Scenario A: Fake bank account suspension SMS',
    category: 'Bank Impersonation',
    language: 'en',
    expectedSuspicious: true,
    evidenceType: 'sms',
    content:
      'Your bank account will be blocked within 10 minutes. Contact our verification department at +91-9876500000 and complete the verification fee payment immediately at http://bank-kyc-desk.xyz.',
    isSynthetic: true,
  },
  {
    id: 'SYN-B',
    label: 'Scenario B: Fake KYC verification call (Marathi)',
    category: 'Fake KYC Call',
    language: 'mr',
    expectedSuspicious: true,
    evidenceType: 'voice_transcript',
    content:
      'मला बँकेकडून फोन आला आहे. ते सांगत आहेत की केवायसी अपडेट न केल्यास खाते १० मिनिटांत बंद होईल आणि ते आताच ₹५,००० पाठवायला व ओटीपी सांगायला सांगत आहेत.',
    isSynthetic: true,
  },
  {
    id: 'SYN-C',
    label: 'Scenario C: Fake UPI refund request (Hinglish)',
    category: 'Refund Scam',
    language: 'hinglish',
    expectedSuspicious: true,
    evidenceType: 'whatsapp',
    content:
      'Sir aapka ₹4,500 ka order refund approve ho gaya hai. Paise receive karne ke liye apna UPI PIN enter karke is collect request ko approve kijiye turant, warna refund cancel ho jayega.',
    isSynthetic: true,
  },
  {
    id: 'SYN-D',
    label: 'Scenario D: Fake investment opportunity',
    category: 'Investment Scam',
    language: 'en',
    expectedSuspicious: true,
    evidenceType: 'whatsapp',
    content:
      'VIP Institutional Trading Group: Guaranteed 45% profit in 7 days. Deposit ₹15,000 before 5 PM today to unlock private allocation. Keep this invitation confidential.',
    isSynthetic: true,
  },
  {
    id: 'SYN-E',
    label: 'Scenario E: Genuine bank transaction notification',
    category: 'Genuine Alert',
    language: 'en',
    expectedSuspicious: false,
    evidenceType: 'sms',
    content:
      'Your A/c XX4821 is debited for INR 640.00 on 15-11-26 via UPI to Metro Supermarket. Available Bal: INR 18,420.50. If not done by you, call 1800-XXX-XXXX.',
    isSynthetic: true,
  },
  {
    id: 'SYN-F',
    label: 'Scenario F: Fake loan-processing fee request (Hindi)',
    category: 'Loan Scam',
    language: 'hi',
    expectedSuspicious: true,
    evidenceType: 'sms',
    content:
      'बधाई हो! आपका ₹3,00,000 का इंस्टेंट लोन बिना किसी दस्तावेज़ के स्वीकृत हो गया है। राशि खाते में प्राप्त करने के लिए अभी ₹2,999 प्रोसेसिंग फीस और OTP साझा करें।',
    isSynthetic: true,
  },
];

export const VALIDATION_TEST_SUITE: SyntheticScenario[] = [
  ...SYNTHETIC_SAMPLE_SCENARIOS,
  {
    id: 'VAL-07',
    label: 'Fake customer-care call transcript',
    category: 'Fake Customer Care',
    language: 'en',
    expectedSuspicious: true,
    evidenceType: 'voice_transcript',
    content:
      'Caller: I am calling from customer support regarding your failed electricity bill. Download QuickSupport screen-sharing app and share the 6-digit OTP to avoid disconnection tonight.',
    isSynthetic: true,
  },
  {
    id: 'VAL-08',
    label: 'OTP theft phishing message',
    category: 'OTP Request',
    language: 'hinglish',
    expectedSuspicious: true,
    evidenceType: 'sms',
    content:
      'Aapke credit card ke reward points expire ho rahe hain. Redeem karne ke liye abhi aaya hua 6-digit OTP share karein.',
    isSynthetic: true,
  },
  {
    id: 'VAL-09',
    label: 'Genuine utility payment reminder',
    category: 'Genuine Reminder',
    language: 'en',
    expectedSuspicious: false,
    evidenceType: 'sms',
    content:
      'Reminder: Your monthly broadband bill of INR 799 is due on 22-11-2026. Please pay via your official provider app or BBPS.',
    isSynthetic: true,
  },
  {
    id: 'VAL-10',
    label: 'Borderline urgent school fee reminder',
    category: 'Borderline Communication',
    language: 'en',
    expectedSuspicious: false,
    evidenceType: 'whatsapp',
    content:
      'Dear parents, today is the last day to clear Term 2 tuition fees through the school office portal. Please ignore if already paid.',
    isSynthetic: true,
  },
];
