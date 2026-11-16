# FINSHIELD AI

> **"Detect the manipulation. Understand the risk. Protect your money."**

FINSHIELD AI is an intelligent financial scam prevention, investigation, and recovery-assistance platform built primarily for Indian digital-payment users (UPI, banking, KYC, refund, loan, and phishing interactions).

---

## 1. Project Introduction & Problem Statement

Digital payment fraud frequently succeeds not by bypassing cryptographic bank security, but by manipulating people into authorising transfers themselves. Victims receive fragmented signals—an alarming SMS, a follow-up telephone call impersonating bank staff, and a timed UPI collect request—making it hard to see the coordinated pattern before approving a transaction.

FINSHIELD AI unites the full lifecycle:

**PREVENT → INVESTIGATE → PROTECT → RECOVER**

---

## 2. Objectives & Target Users

- **Objectives**: Identify suspicious communications, detect social-engineering tactics, analyse multimodal evidence (text, screenshots, audio, URLs), connect related items into a single Scam Story Reconstruction, provide transparent rule-based risk scores, evaluate pre-payment safety, and organise post-fraud evidence for official reporting.
- **Primary Users**: Regular UPI users, senior citizens, students, salaried professionals, and first-time digital payment users.
- **Secondary Users**: Small business owners receiving frequent unknown payment requests, and individuals preparing fraud evidence after an incident.

---

## 3. Core Features & USP

1. **Multimodal Evidence Analysis**: SMS, WhatsApp text, payment/bank screenshots (Gemini OCR), audio recordings (Gemini speech-to-text), voice transcripts, and URL structural analysis.
2. **Psychological Manipulation Detector**: Evaluates Urgency, Fear, Authority Impersonation, Secrecy, Emotional Manipulation, Financial Pressure, Unrealistic Rewards, Threats, Confidential Data Requests, and Suspicious Payment Instructions while distinguishing suspected manipulation from proven fraud.
3. **Scam Story Reconstruction (Primary USP)**: Connects multiple submitted evidence items into a visual relationship graph and chronological timeline, comparing payment instructions and flagging conflicting details without inventing unsupported connections.
4. **Explainable Risk Assessment**: Transparent 0–100 rule-based scoring engine backed by verbatim evidence quotes and safeguards against duplicates, missing evidence, and benign bank alerts.
5. **Pre-Payment Safety Checkpoint**: 9-field evaluation before approving a payment, with clear boundaries (not connected to the UPI network).
6. **FINSHIELD RESCUE**: Emergency dossier workflow displaying **1930** and **https://cybercrime.gov.in/**, chronological timeline organisation, and downloadable PDF reports via `jsPDF`.
7. **Supporting Modules**: Trusted Circle Protection (explicit consent, revocation, PII redaction), Multilingual UI & AI Analysis (English, Hindi, Marathi, Hinglish), Voice Assistance (STT + TTS), Investigation History, and Privacy/Data Management.

---

## 4. Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons, jsPDF.
- **Backend**: Node.js + Express (`server.ts` serving REST APIs and Vite middleware). *(Adapted from the conceptual Python/FastAPI outline to run natively in the Node.js TypeScript runtime on port 3000.)*
- **AI Integration**: `@google/genai` server-side SDK:
  - `gemini-4-hydrogen` (multimodal text/image OCR analysis, structured JSON manipulation detection, story reconstruction)
  - `gemini-3.5-transcribe` (speech-to-text transcription)
  - `gemini-3.8-flash-lite-tts` (multilingual safety audio guidance)
- **Database**: Cloud SQL for PostgreSQL via Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`).
- **Authentication**: Dual support for Email/Password (`bcryptjs` + HMAC-signed session tokens) and Google Sign-In via Firebase Auth (`firebase` + `firebase-admin`).

---

## 5. Database Schema (`src/db/schema.ts`)

- `users`: `id`, `uid`, `name`, `email`, `password_hash`, `preferred_language`, `retention_days`, `redact_sensitive`, `created_at`
- `investigations`: `id`, `investigation_code`, `user_id`, `title`, `suspected_category`, `risk_level`, `risk_score`, `status`, `summary`, `explanation`, `recommended_actions`, `is_synthetic_demo`, `created_at`, `updated_at`
- `evidence`: `id`, `investigation_id`, `user_id`, `evidence_type`, `title`, `file_reference`, `mime_type`, `raw_input`, `extracted_text`, `analysis_summary`, `detected_indicators`, `extracted_details`, `potential_risks`, `analysis_status`, `event_timestamp`, `error_message`, `created_at`
- `risk_indicators`: `id`, `investigation_id`, `evidence_id`, `indicator_type`, `category`, `severity`, `weight`, `detected`, `supporting_evidence`, `explanation`, `created_at`
- `evidence_relationships`: `id`, `investigation_id`, `source_evidence_id`, `target_evidence_id`, `relationship_type`, `event_time`, `indicator_label`, `explanation`, `created_at`
- `payment_safety_checks`: `id`, `user_id`, `amount`, `purpose`, `recipient_familiarity`, `contact_method`, `requested_by_caller`, `urgency_involved`, `kyc_related`, `confidential_info_asked`, `independently_verified`, `risk_level`, `risk_score`, `reasons`, `recommended_action`, `created_at`
- `rescue_cases`: `id`, `rescue_code`, `user_id`, `incident_date`, `incident_time`, `amount_involved`, `payment_method`, `transaction_reference`, `bank_provider`, `suspected_category`, `description`, `actions_taken`, `pending_actions`, `evidence_items`, `timeline_events`, `report_reference`, `status`, `created_at`
- `trusted_contacts` & `shared_warnings`: User-consented warning contacts and PII-redacted alert logs.

---

## 6. REST API Endpoints (`server.ts`)

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/firebase`, `GET /api/auth/me`
- `PATCH /api/profile`, `DELETE /api/profile/data`
- `GET /api/investigations`, `POST /api/investigations`, `POST /api/investigations/seed-demo`, `GET /api/investigations/:id`, `DELETE /api/investigations/:id`
- `POST /api/evidence/upload`, `POST /api/evidence/analyze`, `DELETE /api/evidence/:id`
- `POST /api/manipulation/analyze`, `POST /api/investigations/reconstruct`, `POST /api/risk/assess`
- `POST /api/payment-safety/check`, `GET /api/payment-safety/history`
- `POST /api/rescue/create`, `GET /api/rescue`, `GET /api/rescue/:id`, `POST /api/rescue/:id/evidence`, `GET /api/rescue/:id/report`
- `GET /api/contacts`, `POST /api/contacts`, `PATCH /api/contacts/:id`, `DELETE /api/contacts/:id`, `POST /api/contacts/share-warning`
- `GET /api/history`, `POST /api/voice/transcribe`, `POST /api/voice/tts`, `POST /api/evaluation/run`

---

## 7. Gemini AI & Scoring Architecture

- All user-submitted text, transcripts, URLs, and images are wrapped inside `<UNTRUSTED_EVIDENCE_DATA>` delimiters and separated from `systemInstruction` to prevent prompt injection.
- Structured JSON responses are enforced with `responseSchema` and validated server-side with `zod`.
- Prototype rule weights (`server/riskEngine.ts`): Authority impersonation (20), Urgent payment demand (15), OTP/PIN request (25), Suspicious external link (15), Threat/fear language (10), Payment-purpose inconsistency (15), capped at 100 (`0–19 LOW`, `20–39 MODERATE`, `40–69 HIGH`, `70–100 CRITICAL`).

---

## 8. Sample Demonstration Data & Testing Methodology

- `server/syntheticScenarios.ts` provides clearly labeled **SYNTHETIC DEMONSTRATION DATA** (Scenarios A–F + the 3-evidence connected investigation + 10-case multilingual evaluation benchmark).
- Run `npx tsx tests/riskEngine.test.ts` to verify deterministic risk-scoring rules, safeguards, URL parsing, and PII redaction.
- Visit `/methodology` in the web app and click **Run Live Synthetic Benchmark** (`POST /api/evaluation/run`) to evaluate Precision, Recall, F1-score, False-Positive Rate, and latency across English, Hindi, Hinglish, and Marathi synthetic cases.

---

## 9. Installation, Environment & Deployment

```bash
npm install
npm run build
npm run dev
```

Required environment variables (injected at runtime; never commit secrets):
- `GEMINI_API_KEY`
- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`
- `APP_URL`

---

## 10. Security, Privacy & Honest Limitations

- Never requests UPI PIN, OTP, ATM PIN, CVV, or banking passwords.
- Not connected to NPCI/UPI networks: cannot block payments, cancel transactions, freeze bank accounts, or verify real account ownership.
- Audio transcription converts speech to text and does not perform voice-biometric speaker verification.
- PDF rescue dossiers are AI-generated evidence-organising reports—not official police complaints, legal determinations, or guarantees of financial recovery.
- Live external URL reputation lookup is not configured; URL risk relies on observable structural inspection.

---

## 11. Implementation Status Checklist

| Capability | Status | Notes |
| --- | --- | --- |
| User Registration & Login (Email + Google) | **Fully Implemented** | PostgreSQL `users` + `bcryptjs` + Firebase Auth |
| Multimodal Evidence Upload & OCR/STT | **Fully Implemented** | `multer` + `gemini-4-hydrogen` + `gemini-3.5-transcribe` |
| Psychological Manipulation Detection | **Fully Implemented** | 6 core cards + 4 extended signals |
| Scam Story Reconstruction | **Fully Implemented** | Visual node graph, timeline, conflict detection |
| Explainable Rule-Based Risk Engine | **Fully Implemented** | Transparent 0–100 weights + safeguards |
| Pre-Payment Safety Checkpoint | **Fully Implemented** | 9-field evaluation + persisted history |
| FINSHIELD RESCUE & PDF Dossier | **Fully Implemented** | 1930/portal guidance + `jsPDF` download |
| Trusted Circle Protection | **Fully Implemented** | Consent, revocation, PII redaction |
| Multilingual (EN/HI/MR) & Voice Assistance | **Fully Implemented** | UI translations + Gemini STT & TTS |
| Live URL Domain Reputation API | **Development-Mode Demonstration** | Structural URL parser active; external threat-intel feed not configured |
| Live Banking / UPI Network Integration | **Not Implemented (Out of Scope)** | Intentionally excluded; explicitly disclaimed |
