# PHASE 6: FRAUD DETECTION SYSTEM - DESIGN DOCUMENT

**Goal**: Design a comprehensive fraud detection system with evidence management, anomaly detection, investigation workflows, pre-payment checkpoints, and emergency dispute resolution.

**Status**: 🎯 DESIGN READY FOR REVIEW  
**Technology Stack**: Python/FastAPI (backend), React/TypeScript (frontend), SQLAlchemy ORM, PostgreSQL (assumed)

---

## Architecture Overview

The fraud detection system operates across five interconnected subsystems:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRAUD DETECTION SYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │  EVIDENCE UPLOAD │    │  FRAUD ANALYSIS  │    │  INVESTIGATION│ │
│  │    SYSTEM        │───▶│    ENGINE        │───▶│    WORKFLOW   │ │
│  │                  │    │                  │    │               │ │
│  │ • File uploads   │    │ • Anomalies      │    │ • Case mgmt   │ │
│  │ • Metadata       │    │ • Pattern match  │    │ • Tracking    │ │
│  │ • Indexing       │    │ • Risk scoring   │    │ • Timeline    │ │
│  │ • Integration    │    │ • Correlation    │    │ • Resolution  │ │
│  └──────────────────┘    └──────────────────┘    └───────────────┘ │
│           │                       │                      │           │
│           └───────────────────────┼──────────────────────┘           │
│                                   │                                  │
│                    ┌──────────────┴──────────────┐                  │
│                    │                             │                  │
│            ┌───────▼─────────┐        ┌─────────▼────────┐         │
│            │ PRE-PAYMENT     │        │  FINSHIELD       │         │
│            │ CHECKPOINT      │        │  RESCUE          │         │
│            │                 │        │                  │         │
│            │ • Validation    │        │ • Dispute filing │         │
│            │ • Risk assess   │        │ • Chargeback     │         │
│            │ • Alerts        │        │ • Recovery track │         │
│            │ • Confirmation  │        │ • Comm logs      │         │
│            └─────────────────┘        └──────────────────┘         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. DATABASE SCHEMA MODELS

### 1.1 Evidence Management

#### Evidence Model
```python
class Evidence(Base):
    __tablename__ = "evidence"
    
    id: String (primary key)
    investigation_id: String (FK → Investigation)
    case_id: String (FK → RescueCase, nullable)
    
    # File metadata
    file_name: String
    file_type: String (enum: "receipt", "document", "screenshot", "email", "other")
    file_path: String (S3 path or local path)
    file_size: Integer (bytes)
    mime_type: String
    
    # Storage & indexing
    storage_backend: String (enum: "s3", "local", "encrypted")
    storage_location: String
    upload_timestamp: DateTime
    
    # Content extraction
    extracted_text: Text (OCR/text extraction)
    extracted_metadata: JSON (timestamps, signatures, etc.)
    
    # Status & validation
    status: String (enum: "uploaded", "processing", "verified", "rejected")
    validation_errors: JSON (array of validation issues)
    
    # Relationships & correlation
    related_evidence_ids: JSON (array of evidence IDs)
    fraud_score: Float (0-100, calculated during analysis)
    
    # Audit
    uploaded_by: String (user_id)
    created_at: DateTime
    updated_at: DateTime
    deleted_at: DateTime (soft delete support)
    
    Constraints:
    - Max file size: 50MB (enforced at API layer)
    - Supported formats: PDF, JPEG, PNG, DOCX, TXT, XLSX
    - Automatic expiry: 2 years after case resolution
    
    Relationships:
    - investigation (many-to-one)
    - rescue_case (many-to-one, optional)
    - evidence_analysis (one-to-many)
```

#### Evidence Analysis Model
```python
class EvidenceAnalysis(Base):
    __tablename__ = "evidence_analysis"
    
    id: String (primary key)
    evidence_id: String (FK → Evidence)
    investigation_id: String (FK → Investigation)
    
    # Analysis results
    analysis_type: String (enum: "text_analysis", "metadata_analysis", "pattern_match")
    indicators_found: JSON (array of detected fraud indicators)
    confidence_score: Float (0-100)
    
    # Risk assessment
    anomaly_flags: JSON (array of anomalies)
    matched_patterns: JSON (patterns matching known fraud cases)
    risk_level: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    
    # Timestamps & audit
    analyzed_at: DateTime
    created_at: DateTime
```

### 1.2 Fraud Analysis & Pattern Management

#### Fraud Pattern Model
```python
class FraudPattern(Base):
    __tablename__ = "fraud_patterns"
    
    id: String (primary key)
    pattern_name: String (unique)
    category: String (enum: "phishing", "payment_fraud", "identity_theft", 
                     "chargebacks", "account_takeover", "refund_abuse", "other")
    
    # Pattern definition
    description: Text
    indicators: JSON (array of keyword/phrase patterns)
    risk_score_base: Float (0-100)
    frequency_threshold: Integer (min occurrences)
    
    # Status & management
    status: String (enum: "active", "archived", "experimental")
    severity: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    
    # Statistics
    cases_matched: Integer
    success_rate: Float (% cases correctly identified)
    false_positive_rate: Float
    
    created_at: DateTime
    updated_at: DateTime
    last_matched: DateTime (when pattern last matched evidence)
```

#### Risk Score Model
```python
class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id: String (primary key)
    investigation_id: String (FK → Investigation, unique)
    
    # Component scores (0-100)
    evidence_score: Float (based on evidence analysis)
    pattern_match_score: Float (based on known patterns)
    anomaly_score: Float (deviation from user's baseline)
    correlation_score: Float (multiple evidence pieces)
    temporal_score: Float (timing anomalies)
    
    # Aggregate risk
    overall_risk: Float (0-100, weighted average)
    risk_level: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    confidence: Float (0-100, confidence in assessment)
    
    # Breakdown
    calculation_details: JSON (weights and component scores)
    reasoning: Text (explanation of score)
    
    calculated_at: DateTime
    updated_at: DateTime
```

### 1.3 Investigation Workflow

#### Investigation Model (Enhanced)
```python
class Investigation(Base):  # Modified from existing model
    __tablename__ = "investigations"
    
    id: String (primary key)
    user_id: String (FK → User)
    
    # Case info
    title: String
    description: Text
    case_type: String (enum: "suspicious_transaction", "phishing_report", 
                      "identity_concern", "payment_issue", "other")
    
    # Status workflow (distinct from old status field)
    status: String (enum: "new", "in-review", "escalated", "resolved", "closed")
    priority: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    
    # Investigation details
    assigned_to: String (FK → User, nullable, admin/investigator)
    findings_summary: Text
    conclusion: String
    
    # Risk assessment
    risk_level: String (enum: "LOW", "MODERATE", "HIGH", "CRITICAL")
    
    # Dates
    created_at: DateTime
    updated_at: DateTime
    resolved_at: DateTime (nullable)
    closed_at: DateTime (nullable)
    
    # Relationships
    evidence_collection: Relationship → Evidence (one-to-many)
    case_findings: Relationship → CaseFind (one-to-many)
    risk_score: Relationship → RiskScore (one-to-one)
    timeline_events: Relationship → TimelineEvent (one-to-many)
    rescue_case: Relationship → RescueCase (one-to-one, optional)
```

#### Timeline Event Model
```python
class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    id: String (primary key)
    investigation_id: String (FK → Investigation)
    
    # Event info
    event_type: String (enum: "investigation_opened", "evidence_added", 
                       "analysis_completed", "risk_reassessed", "escalated", 
                       "finding_added", "status_changed", "resolution_proposed",
                       "case_closed")
    
    title: String
    description: Text
    
    # Context
    created_by: String (user_id)
    created_at: DateTime
    severity: String (optional, enum: "INFO", "WARNING", "ALERT")
    
    # Data reference
    related_entity_id: String (FK to investigation/evidence/finding)
    related_entity_type: String (enum: "investigation", "evidence", "finding")
    metadata: JSON (context-specific data)
```

#### Case Finding Model
```python
class CaseFind(Base):
    __tablename__ = "case_findings"
    
    id: String (primary key)
    investigation_id: String (FK → Investigation)
    
    # Finding content
    finding_text: Text (description of finding)
    finding_type: String (enum: "evidence", "analysis_result", "pattern_match", 
                         "user_statement", "investigator_note")
    
    # Severity & impact
    severity: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    fraud_confidence: Float (0-100)
    
    # Connection to evidence
    related_evidence_ids: JSON (array of evidence IDs)
    
    # Attribution & tracking
    added_by: String (user_id)
    created_at: DateTime
    updated_at: DateTime
```

### 1.4 Pre-Payment Checkpoint

#### Transaction Checkpoint Model
```python
class TransactionCheckpoint(Base):
    __tablename__ = "transaction_checkpoints"
    
    id: String (primary key)
    transaction_id: String (FK → Transaction)
    user_id: String (FK → User)
    
    # Checkpoint info
    checkpoint_type: String (enum: "pre_payment_validation", "risk_assessment", 
                            "confirmation_required", "escalation")
    status: String (enum: "pending", "approved", "blocked", "escalated", "expired")
    
    # Validation results
    validation_rules_passed: JSON (array of rule names)
    validation_rules_failed: JSON (array with details)
    
    # Risk assessment
    risk_score: Float (0-100)
    risk_level: String (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    risk_reasons: JSON (array of risk factors)
    
    # Transaction details (denormalized for checkpoint context)
    transaction_amount: Float
    transaction_merchant: String
    transaction_type: String
    transaction_date: DateTime
    
    # User confirmation (if required)
    confirmation_required: Boolean
    confirmation_token: String (unique, short-lived)
    confirmed_at: DateTime (nullable)
    confirmed_by_ip: String (nullable)
    confirmation_method: String (enum: "otp", "email_link", "biometric", "manual_review")
    
    # Audit
    checked_at: DateTime
    expires_at: DateTime (token expiry)
    created_at: DateTime
    updated_at: DateTime
    
    Relationships:
    - transaction (many-to-one)
    - risk_factors (one-to-many via join table, optional)
```

#### Validation Rule Model
```python
class ValidationRule(Base):
    __tablename__ = "validation_rules"
    
    id: String (primary key)
    rule_name: String (unique)
    category: String (enum: "amount", "velocity", "merchant", "pattern", "account")
    
    # Rule definition
    description: Text
    rule_logic: JSON (rule conditions in evaluable format)
    threshold_value: Float (nullable)
    action: String (enum: "flag", "block", "escalate")
    
    # Status
    status: String (enum: "active", "inactive", "testing")
    priority: Integer (execution order)
    
    # Statistics
    true_positives: Integer (correctly flagged fraud)
    false_positives: Integer (incorrectly flagged legitimate)
    true_negatives: Integer (correctly allowed legitimate)
    false_negatives: Integer (missed fraud)
    
    created_at: DateTime
    updated_at: DateTime
    last_updated_by: String
```

### 1.5 FINSHIELD RESCUE (Dispute Resolution)

#### Rescue Case Model
```python
class RescueCase(Base):
    __tablename__ = "rescue_cases"
    
    id: String (primary key, unique case ID)
    user_id: String (FK → User)
    investigation_id: String (FK → Investigation, nullable)
    
    # Incident details
    incident_date: DateTime
    incident_type: String (enum: "fraudulent_transaction", "unauthorized_access", 
                          "account_takeover", "refund_issue", "other")
    incident_description: Text
    
    # Dispute filing
    filing_status: String (enum: "draft", "filed", "under_review", "appealed")
    filing_date: DateTime (nullable)
    dispute_ref_number: String (nullable, bank's reference)
    
    # Amount involved
    disputed_amount: Float
    currency: String (default: "INR")
    payment_method: String (enum: "credit_card", "debit_card", "net_banking", 
                           "upi", "wallet", "other")
    
    # Merchant/Transaction details
    merchant_name: String
    merchant_id: String (nullable)
    transaction_id: String (nullable, FK → Transaction)
    
    # Chargeback management
    chargeback_filed: Boolean (default: False)
    chargeback_date: DateTime (nullable)
    chargeback_ref_number: String (nullable)
    chargeback_status: String (enum: "filed", "accepted", "rejected", "appealed", "resolved")
    chargeback_amount: Float (nullable)
    
    # Recovery tracking
    recovery_status: String (enum: "pending", "recovered", "partial", "unsuccessful")
    recovered_amount: Float (default: 0)
    recovery_date: DateTime (nullable)
    recovery_reference: String (nullable)
    
    # Case resolution
    case_status: String (enum: "open", "in_progress", "resolved", "closed", "escalated")
    resolution_type: String (enum: "refund", "reversal", "replacement", "writeoff", "pending")
    resolution_date: DateTime (nullable)
    resolution_notes: Text
    
    # Communication
    user_contacted: Boolean (default: False)
    last_contact_date: DateTime (nullable)
    next_action_date: DateTime (nullable)
    
    # Audit & compliance
    created_at: DateTime
    updated_at: DateTime
    handled_by: String (user_id, nullable, admin/support staff)
    
    Relationships:
    - user (many-to-one)
    - investigation (one-to-one, optional)
    - communication_logs (one-to-many)
    - evidence_collection (one-to-many via Evidence.case_id)
    - recovery_tracking (one-to-many)
```

#### Communication Log Model
```python
class CommunicationLog(Base):
    __tablename__ = "communication_logs"
    
    id: String (primary key)
    rescue_case_id: String (FK → RescueCase)
    
    # Communication details
    communication_type: String (enum: "email", "sms", "in_app", "phone", "letter")
    direction: String (enum: "outgoing", "incoming")
    subject: String (nullable)
    message: Text
    
    # Parties involved
    sent_by: String (user_id or system)
    sent_to: String (email/phone)
    recipient_type: String (enum: "user", "bank", "merchant", "support")
    
    # Timestamps
    sent_at: DateTime
    delivered_at: DateTime (nullable)
    read_at: DateTime (nullable)
    
    # Status
    status: String (enum: "sent", "failed", "bounced", "opened")
    
    # Reference
    external_ref: String (bank/merchant reference, nullable)
```

#### Recovery Tracking Model
```python
class RecoveryTracking(Base):
    __tablename__ = "recovery_tracking"
    
    id: String (primary key)
    rescue_case_id: String (FK → RescueCase)
    
    # Recovery event
    event_type: String (enum: "refund_initiated", "refund_processed", 
                       "chargeback_won", "partial_recovery", "recovery_failed")
    
    # Amount & timing
    recovery_amount: Float
    recovery_date: DateTime
    expected_settlement_date: DateTime (nullable)
    actual_settlement_date: DateTime (nullable)
    
    # Reference & tracking
    reference_number: String
    bank_reference: String (nullable)
    
    # Status
    status: String (enum: "pending", "in_progress", "completed", "failed")
    notes: Text (optional)
    
    created_at: DateTime
```

---

## 2. API ROUTES & ENDPOINTS

### 2.1 Evidence Upload System (`/api/fraud/evidence`)

#### POST /api/fraud/evidence/upload
**Purpose**: Upload evidence file for an investigation
**Authentication**: Required (Bearer token)

**Request**:
```json
{
  "investigation_id": "string",
  "case_id": "string (optional)",
  "file_type": "enum (receipt|document|screenshot|email|other)",
  "file_binary": "binary (multipart/form-data)",
  "file_name": "string",
  "description": "string (optional)"
}
```

**Response** (201):
```json
{
  "id": "string",
  "investigation_id": "string",
  "file_name": "string",
  "file_type": "string",
  "status": "uploaded",
  "upload_timestamp": "datetime",
  "fraud_score": 0,
  "storage_location": "string",
  "created_at": "datetime"
}
```

**Error Handling**:
- **400**: Invalid file type, exceeds size limit (50MB), invalid investigation_id
- **401**: Unauthorized (invalid/missing token)
- **403**: User not authorized to upload evidence for this investigation
- **404**: Investigation not found
- **413**: File too large (payload entity too large)
- **500**: File storage failure, OCR processing failed

#### GET /api/fraud/evidence/{evidence_id}
**Purpose**: Retrieve evidence details and extracted metadata
**Authentication**: Required

**Response** (200):
```json
{
  "id": "string",
  "investigation_id": "string",
  "file_name": "string",
  "file_type": "string",
  "file_size": "integer",
  "mime_type": "string",
  "status": "string",
  "extracted_text": "string",
  "extracted_metadata": {
    "timestamps": ["datetime"],
    "entities": ["string"],
    "keywords": ["string"]
  },
  "fraud_score": "float",
  "related_evidence_ids": ["string"],
  "created_at": "datetime",
  "uploaded_by": "string"
}
```

**Error Handling**:
- **401**: Unauthorized
- **403**: User not authorized to view this evidence
- **404**: Evidence not found
- **500**: Error retrieving extracted content

#### GET /api/fraud/evidence/investigation/{investigation_id}
**Purpose**: List all evidence files for an investigation
**Authentication**: Required

**Query Parameters**:
- `status`: Filter by status (uploaded, processing, verified, rejected)
- `file_type`: Filter by file type
- `limit`: Items per page (default 20, max 100)
- `offset`: Pagination offset

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "file_name": "string",
      "file_type": "string",
      "status": "string",
      "fraud_score": "float",
      "upload_timestamp": "datetime"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer"
}
```

**Error Handling**:
- **401**: Unauthorized
- **403**: User not authorized to view this investigation
- **404**: Investigation not found

#### DELETE /api/fraud/evidence/{evidence_id}
**Purpose**: Soft delete evidence (marks as deleted, retains for audit)
**Authentication**: Required

**Response** (204): No content

**Error Handling**:
- **401**: Unauthorized
- **403**: User/admin not authorized to delete
- **404**: Evidence not found
- **409**: Cannot delete evidence from resolved case (allow deletion of open cases only)

---

### 2.2 Fraud Analysis Engine (`/api/fraud/analysis`)

#### POST /api/fraud/analysis/analyze-evidence
**Purpose**: Trigger analysis of uploaded evidence
**Authentication**: Required

**Request**:
```json
{
  "evidence_id": "string",
  "investigation_id": "string",
  "analysis_type": "enum (text_analysis|metadata_analysis|pattern_match|all)"
}
```

**Response** (200):
```json
{
  "evidence_id": "string",
  "analysis_type": "string",
  "indicators_found": [
    {
      "indicator": "string",
      "type": "enum",
      "confidence": "float (0-100)",
      "details": "string"
    }
  ],
  "confidence_score": "float (0-100)",
  "anomaly_flags": [
    {
      "anomaly": "string",
      "severity": "enum (LOW|MEDIUM|HIGH|CRITICAL)",
      "details": "string"
    }
  ],
  "matched_patterns": [
    {
      "pattern_id": "string",
      "pattern_name": "string",
      "match_confidence": "float (0-100)",
      "matches": ["string"]
    }
  ],
  "risk_level": "enum (LOW|MEDIUM|HIGH|CRITICAL)",
  "analyzed_at": "datetime"
}
```

**Error Handling**:
- **400**: Invalid analysis type, evidence not ready
- **401**: Unauthorized
- **403**: User not authorized
- **404**: Evidence or investigation not found
- **500**: Analysis engine failure (NLP/pattern matching error)

#### POST /api/fraud/analysis/calculate-risk-score
**Purpose**: Calculate comprehensive risk score for investigation
**Authentication**: Required

**Request**:
```json
{
  "investigation_id": "string",
  "include_components": "boolean (default true)"
}
```

**Response** (200):
```json
{
  "investigation_id": "string",
  "overall_risk": "float (0-100)",
  "risk_level": "enum (LOW|MEDIUM|HIGH|CRITICAL)",
  "confidence": "float (0-100)",
  "component_scores": {
    "evidence_score": "float",
    "pattern_match_score": "float",
    "anomaly_score": "float",
    "correlation_score": "float",
    "temporal_score": "float"
  },
  "calculation_details": {
    "evidence_weight": "0.3",
    "pattern_weight": "0.25",
    "anomaly_weight": "0.25",
    "correlation_weight": "0.15",
    "temporal_weight": "0.05"
  },
  "reasoning": "string",
  "calculated_at": "datetime"
}
```

**Error Handling**:
- **400**: Investigation has no evidence/analysis
- **401**: Unauthorized
- **403**: User not authorized
- **404**: Investigation not found
- **500**: Risk calculation engine error

#### GET /api/fraud/analysis/patterns
**Purpose**: Retrieve active fraud patterns (for reference/training)
**Authentication**: Required

**Query Parameters**:
- `category`: Filter by pattern category
- `status`: active/archived/experimental
- `limit`: Default 50, max 200
- `offset`: Pagination

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "pattern_name": "string",
      "category": "string",
      "indicators": ["string"],
      "risk_score_base": "float",
      "severity": "enum",
      "cases_matched": "integer",
      "success_rate": "float"
    }
  ],
  "total": "integer"
}
```

#### POST /api/fraud/analysis/test-pattern
**Purpose**: Test if given text matches a fraud pattern
**Authentication**: Required

**Request**:
```json
{
  "pattern_id": "string",
  "text": "string (the evidence text to test)"
}
```

**Response** (200):
```json
{
  "pattern_id": "string",
  "pattern_name": "string",
  "matches": ["string"],
  "match_count": "integer",
  "confidence": "float (0-100)",
  "indicator_breakdown": [
    {
      "indicator": "string",
      "occurrences": "integer"
    }
  ]
}
```

---

### 2.3 Investigation Workflow (`/api/fraud/investigations`)

#### POST /api/fraud/investigations
**Purpose**: Create new fraud investigation case
**Authentication**: Required

**Request**:
```json
{
  "title": "string (required)",
  "description": "string",
  "case_type": "enum (suspicious_transaction|phishing_report|identity_concern|payment_issue|other)",
  "priority": "enum (LOW|MEDIUM|HIGH|CRITICAL, default MEDIUM)"
}
```

**Response** (201):
```json
{
  "id": "string",
  "user_id": "string",
  "title": "string",
  "description": "string",
  "case_type": "string",
  "status": "new",
  "priority": "string",
  "risk_level": "LOW",
  "created_at": "datetime",
  "updated_at": "datetime",
  "evidence_count": 0,
  "timeline_events": []
}
```

**Error Handling**:
- **400**: Missing required fields, invalid case type/priority
- **401**: Unauthorized
- **500**: Database error

#### GET /api/fraud/investigations/{investigation_id}
**Purpose**: Retrieve full investigation details
**Authentication**: Required

**Response** (200):
```json
{
  "id": "string",
  "user_id": "string",
  "title": "string",
  "description": "string",
  "case_type": "string",
  "status": "enum (new|in-review|escalated|resolved|closed)",
  "priority": "enum",
  "assigned_to": "string (nullable)",
  "risk_level": "string",
  "findings_summary": "string",
  "conclusion": "string",
  "evidence_collection": [
    {
      "id": "string",
      "file_name": "string",
      "status": "string",
      "fraud_score": "float"
    }
  ],
  "case_findings": [
    {
      "id": "string",
      "finding_text": "string",
      "severity": "string",
      "fraud_confidence": "float"
    }
  ],
  "risk_score": {
    "overall_risk": "float",
    "risk_level": "string",
    "confidence": "float"
  },
  "timeline": [
    {
      "id": "string",
      "event_type": "string",
      "title": "string",
      "created_at": "datetime"
    }
  ],
  "rescue_case": {
    "id": "string",
    "filing_status": "string"
  },
  "created_at": "datetime",
  "updated_at": "datetime",
  "resolved_at": "datetime (nullable)",
  "closed_at": "datetime (nullable)"
}
```

**Error Handling**:
- **401**: Unauthorized
- **403**: User not authorized to view this investigation
- **404**: Investigation not found

#### GET /api/fraud/investigations
**Purpose**: List investigations for current user
**Authentication**: Required

**Query Parameters**:
- `status`: Filter by status
- `priority`: Filter by priority
- `case_type`: Filter by case type
- `include_closed`: Boolean (default false)
- `limit`: Default 20, max 100
- `offset`: Pagination

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "priority": "string",
      "risk_level": "string",
      "evidence_count": "integer",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": "integer",
  "active_count": "integer",
  "high_risk_count": "integer"
}
```

#### PATCH /api/fraud/investigations/{investigation_id}
**Purpose**: Update investigation status, priority, or findings
**Authentication**: Required

**Request**:
```json
{
  "status": "enum (optional)",
  "priority": "enum (optional)",
  "findings_summary": "string (optional)",
  "conclusion": "string (optional)"
}
```

**Response** (200):
```json
{
  "id": "string",
  "status": "string",
  "priority": "string",
  "updated_at": "datetime"
}
```

**Error Handling**:
- **400**: Invalid status transition, invalid data
- **401**: Unauthorized
- **403**: User not authorized to update (admin/investigator only)
- **404**: Investigation not found
- **409**: Cannot update resolved case

#### POST /api/fraud/investigations/{investigation_id}/escalate
**Purpose**: Escalate investigation to admin review
**Authentication**: Required

**Request**:
```json
{
  "reason": "string (optional)",
  "priority_override": "enum (optional)"
}
```

**Response** (200):
```json
{
  "id": "string",
  "status": "escalated",
  "assigned_to": "string (admin)",
  "priority": "string",
  "escalated_at": "datetime"
}
```

#### POST /api/fraud/investigations/{investigation_id}/add-finding
**Purpose**: Add a finding/observation to investigation
**Authentication**: Required

**Request**:
```json
{
  "finding_text": "string (required)",
  "finding_type": "enum (evidence|analysis_result|pattern_match|user_statement|investigator_note)",
  "severity": "enum (LOW|MEDIUM|HIGH|CRITICAL)",
  "fraud_confidence": "float (0-100, optional)",
  "related_evidence_ids": ["string (optional)"]
}
```

**Response** (201):
```json
{
  "id": "string",
  "investigation_id": "string",
  "finding_text": "string",
  "finding_type": "string",
  "severity": "string",
  "fraud_confidence": "float",
  "created_at": "datetime"
}
```

#### GET /api/fraud/investigations/{investigation_id}/timeline
**Purpose**: Retrieve investigation timeline
**Authentication**: Required

**Query Parameters**:
- `event_type`: Filter by event type
- `limit`: Default 50, max 200

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "event_type": "string",
      "title": "string",
      "description": "string",
      "severity": "string (nullable)",
      "created_at": "datetime",
      "created_by": "string"
    }
  ],
  "total": "integer"
}
```

---

### 2.4 Pre-Payment Checkpoint (`/api/fraud/checkpoint`)

#### POST /api/fraud/checkpoint/validate
**Purpose**: Validate transaction before payment processing
**Authentication**: Required

**Request**:
```json
{
  "transaction_id": "string",
  "transaction_amount": "float",
  "merchant_id": "string",
  "merchant_name": "string",
  "transaction_type": "string (enum: debit|credit|transfer)"
}
```

**Response** (200):
```json
{
  "checkpoint_id": "string",
  "transaction_id": "string",
  "status": "enum (approved|blocked|requires_confirmation)",
  "risk_score": "float (0-100)",
  "risk_level": "enum (LOW|MEDIUM|HIGH|CRITICAL)",
  "validation_results": {
    "passed_rules": ["string"],
    "failed_rules": [
      {
        "rule_name": "string",
        "reason": "string"
      }
    ]
  },
  "risk_factors": ["string"],
  "confirmation_required": "boolean",
  "confirmation_token": "string (if required)",
  "confirmation_expires_at": "datetime (if required)",
  "checked_at": "datetime"
}
```

**Error Handling**:
- **400**: Invalid transaction data, missing required fields
- **401**: Unauthorized
- **403**: User not authorized
- **404**: Transaction not found
- **500**: Checkpoint validation engine error

#### POST /api/fraud/checkpoint/confirm
**Purpose**: User confirms/approves transaction after review
**Authentication**: Required

**Request**:
```json
{
  "checkpoint_id": "string",
  "confirmation_token": "string",
  "user_ip": "string (user's IP address)"
}
```

**Response** (200):
```json
{
  "checkpoint_id": "string",
  "status": "approved",
  "confirmed_at": "datetime",
  "confirmation_method": "manual_review",
  "expires_in_seconds": "integer (60 - allow 60 seconds for payment)"
}
```

**Error Handling**:
- **400**: Invalid or expired token, missing data
- **401**: Unauthorized
- **403**: Token doesn't match user
- **404**: Checkpoint not found
- **410**: Token expired (validity window passed)

#### GET /api/fraud/checkpoint/{checkpoint_id}
**Purpose**: Retrieve checkpoint details
**Authentication**: Required

**Response** (200):
```json
{
  "id": "string",
  "transaction_id": "string",
  "status": "string",
  "risk_score": "float",
  "risk_level": "string",
  "validation_results": {
    "passed_rules": ["string"],
    "failed_rules": ["string"]
  },
  "checked_at": "datetime",
  "confirmed_at": "datetime (nullable)",
  "confirmation_expires_at": "datetime (nullable)"
}
```

#### GET /api/fraud/checkpoint/rules
**Purpose**: List all active validation rules (admin)
**Authentication**: Required (Admin)

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "rule_name": "string",
      "category": "string",
      "description": "string",
      "threshold_value": "float (nullable)",
      "action": "string",
      "priority": "integer",
      "true_positives": "integer",
      "false_positives": "integer",
      "status": "string"
    }
  ]
}
```

---

### 2.5 FINSHIELD RESCUE (`/api/fraud/rescue`)

#### POST /api/fraud/rescue/create
**Purpose**: Create emergency dispute/rescue case
**Authentication**: Required

**Request**:
```json
{
  "investigation_id": "string (optional)",
  "incident_type": "enum (fraudulent_transaction|unauthorized_access|account_takeover|refund_issue|other)",
  "incident_description": "string",
  "incident_date": "datetime",
  "payment_method": "enum (credit_card|debit_card|net_banking|upi|wallet|other)",
  "merchant_name": "string",
  "transaction_id": "string (optional)",
  "disputed_amount": "float",
  "currency": "string (default INR)"
}
```

**Response** (201):
```json
{
  "id": "string",
  "case_id": "string (unique reference)",
  "user_id": "string",
  "incident_type": "string",
  "disputed_amount": "float",
  "filing_status": "draft",
  "case_status": "open",
  "recovery_status": "pending",
  "created_at": "datetime",
  "next_steps": [
    "File dispute with your bank within 90 days",
    "Gather supporting documents",
    "Monitor chargeback status"
  ],
  "guidance": {
    "immediate_actions": ["string"],
    "contact_information": "object",
    "timeline": "string"
  }
}
```

**Error Handling**:
- **400**: Invalid incident type, missing required fields, invalid amount
- **401**: Unauthorized
- **403**: User not authorized
- **404**: Investigation not found (if provided)
- **409**: Case already exists for this transaction
- **500**: Case creation failed

#### GET /api/fraud/rescue/{case_id}
**Purpose**: Retrieve rescue case details
**Authentication**: Required

**Response** (200):
```json
{
  "id": "string",
  "case_id": "string",
  "user_id": "string",
  "incident_type": "string",
  "incident_date": "datetime",
  "incident_description": "string",
  "disputed_amount": "float",
  "currency": "string",
  "payment_method": "string",
  "merchant_name": "string",
  "filing_status": "string",
  "filing_date": "datetime (nullable)",
  "dispute_ref_number": "string (nullable)",
  "chargeback_filed": "boolean",
  "chargeback_ref_number": "string (nullable)",
  "chargeback_status": "string (nullable)",
  "recovery_status": "string",
  "recovered_amount": "float",
  "recovery_date": "datetime (nullable)",
  "case_status": "string",
  "resolution_type": "string (nullable)",
  "resolution_date": "datetime (nullable)",
  "resolution_notes": "string",
  "communication_logs": [
    {
      "id": "string",
      "communication_type": "string",
      "direction": "string",
      "message": "string (truncated)",
      "sent_at": "datetime"
    }
  ],
  "recovery_tracking": [
    {
      "event_type": "string",
      "recovery_amount": "float",
      "recovery_date": "datetime",
      "status": "string"
    }
  ],
  "evidence_files": ["string"],
  "next_action_date": "datetime (nullable)",
  "handled_by": "string (nullable)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Error Handling**:
- **401**: Unauthorized
- **403**: User not authorized to view this case
- **404**: Case not found

#### GET /api/fraud/rescue
**Purpose**: List rescue cases for user
**Authentication**: Required

**Query Parameters**:
- `status`: Filter by case status
- `filing_status`: Filter by filing status
- `recovery_status`: Filter by recovery status
- `include_closed`: Boolean (default false)
- `limit`: Default 20, max 100
- `offset`: Pagination

**Response** (200):
```json
{
  "items": [
    {
      "id": "string",
      "case_id": "string",
      "incident_type": "string",
      "disputed_amount": "float",
      "filing_status": "string",
      "case_status": "string",
      "recovery_status": "string",
      "recovered_amount": "float",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": "integer",
  "open_cases": "integer",
  "total_disputed_amount": "float",
  "total_recovered_amount": "float"
}
```

#### PATCH /api/fraud/rescue/{case_id}
**Purpose**: Update rescue case status or details
**Authentication**: Required (User or Admin)

**Request**:
```json
{
  "case_status": "enum (optional)",
  "filing_status": "enum (optional)",
  "chargeback_filed": "boolean (optional)",
  "chargeback_ref_number": "string (optional)",
  "resolution_type": "enum (optional)",
  "resolution_notes": "string (optional)"
}
```

**Response** (200):
```json
{
  "id": "string",
  "case_id": "string",
  "filing_status": "string",
  "case_status": "string",
  "updated_at": "datetime"
}
```

#### POST /api/fraud/rescue/{case_id}/file-dispute
**Purpose**: File formal dispute (initiates bank chargeback process)
**Authentication**: Required (Admin/Support)

**Request**:
```json
{
  "dispute_reason": "string",
  "evidence_ids": ["string"],
  "bank_details": {
    "bank_name": "string",
    "account_number": "string (last 4)",
    "contact_number": "string"
  }
}
```

**Response** (200):
```json
{
  "case_id": "string",
  "filing_status": "filed",
  "dispute_ref_number": "string",
  "filing_date": "datetime",
  "expected_resolution_date": "datetime",
  "next_steps": ["string"],
  "confirmation_sent_to": "string (user's email)"
}
```

#### POST /api/fraud/rescue/{case_id}/add-communication
**Purpose**: Add communication log entry
**Authentication**: Required (User or Admin)

**Request**:
```json
{
  "communication_type": "enum (email|sms|in_app|phone|letter)",
  "direction": "enum (outgoing|incoming)",
  "message": "string",
  "recipient_type": "enum (user|bank|merchant|support)",
  "external_ref": "string (optional, bank reference)"
}
```

**Response** (201):
```json
{
  "id": "string",
  "rescue_case_id": "string",
  "communication_type": "string",
  "direction": "string",
  "status": "sent",
  "sent_at": "datetime"
}
```

#### POST /api/fraud/rescue/{case_id}/add-recovery
**Purpose**: Record recovery/refund event
**Authentication**: Required (Admin/Support)

**Request**:
```json
{
  "event_type": "enum (refund_initiated|refund_processed|chargeback_won|partial_recovery|recovery_failed)",
  "recovery_amount": "float",
  "recovery_date": "datetime",
  "reference_number": "string",
  "bank_reference": "string (optional)"
}
```

**Response** (201):
```json
{
  "id": "string",
  "rescue_case_id": "string",
  "event_type": "string",
  "recovery_amount": "float",
  "recovery_date": "datetime",
  "status": "pending",
  "created_at": "datetime"
}
```

#### POST /api/fraud/rescue/{case_id}/resolve
**Purpose**: Resolve and close rescue case
**Authentication**: Required (Admin/Support)

**Request**:
```json
{
  "resolution_type": "enum (refund|reversal|replacement|writeoff)",
  "resolution_notes": "string",
  "final_recovery_amount": "float",
  "closure_reason": "string (optional)"
}
```

**Response** (200):
```json
{
  "case_id": "string",
  "case_status": "closed",
  "resolution_type": "string",
  "recovery_status": "resolved",
  "total_recovered": "float",
  "resolution_date": "datetime",
  "closure_communication_sent": "boolean"
}
```

---

## 3. FRONTEND COMPONENTS

### 3.1 Component Hierarchy

```
FraudDetectionModule.tsx (main container with 5 tabs)
├── EvidenceUploadPanel.tsx
│   ├── FileUploadForm
│   ├── EvidenceList
│   └── EvidencePreview
├── FraudAnalysisPanel.tsx
│   ├── AnalysisResults
│   ├── RiskScoreDisplay
│   └── PatternMatches
├── InvestigationWorkflow.tsx
│   ├── CaseCreationForm
│   ├── InvestigationList
│   ├── CaseDetailsView
│   ├── TimelineView
│   └── FindingsPanel
├── PrePaymentCheckpoint.tsx
│   ├── CheckpointStatus
│   ├── ConfirmationFlow
│   └── RiskAlertModal
└── FinshieldRescue.tsx
    ├── RescueCaseCreation
    ├── RescueCaseList
    ├── CaseDetailsPanel
    ├── DisputeFiling
    ├── RecoveryTracking
    └── CommunicationPanel
```

### 3.2 Key Components

#### EvidenceUploadPanel.tsx
**Features**:
- Drag-and-drop file upload area
- File type validation (receipt, document, screenshot, email, other)
- File size display and validation (max 50MB)
- Progress indicator for upload
- List of uploaded evidence with statuses
- Evidence preview (text extraction display)
- Delete functionality
- Evidence correlation/linking
- Sort and filter by type, date, status

**UI Elements**:
- Upload zone card with icon
- File list table (name, type, size, status, uploaded date, fraud score)
- Status badges (uploaded, processing, verified, rejected)
- Fraud score indicator (0-100, color coded)
- Preview panel for text extraction
- Error messages for failed uploads

#### FraudAnalysisPanel.tsx
**Features**:
- Trigger analysis for selected evidence
- Display analysis results (indicators, anomalies)
- Show matched fraud patterns
- Display comprehensive risk score breakdown
- Component score visualization
- Reasoning/explanation for score
- Pattern matching details with confidence levels
- Anomaly flags with severity
- Recommendation generation

**UI Elements**:
- Analysis status tracker (running, complete, error)
- Risk score gauge (0-100, color coded)
- Component scores breakdown (bar chart or radial chart)
- Pattern match list with match confidence
- Anomaly flags table (anomaly, severity, count)
- Indicator findings list
- Reasoning text block

#### InvestigationWorkflow.tsx (5 sub-tabs)
**Tab 1: Overview**
- Summary cards (status, priority, risk level, findings count)
- Quick action buttons (escalate, resolve, add finding)
- Recent timeline events (last 5)
- Evidence summary (count, types)
- Links to other panels

**Tab 2: Details**
- Investigation info display and edit
- Case type, description, priority
- Status workflow selector (new → in-review → escalated → resolved → closed)
- Assignment panel (assign to investigator)
- Findings summary editor

**Tab 3: Timeline**
- Chronological event stream
- Event types: investigation opened, evidence added, analysis completed, escalated, etc.
- Created by user display
- Metadata display
- Filter/search by event type
- Sortable by date (ascending/descending)

**Tab 4: Evidence**
- Evidence list (link to evidence panel)
- Evidence grid view or list view toggle
- Quick fraud score view
- Link to evidence details

**Tab 5: Findings**
- Add new finding form
- Findings list with severity color coding
- Finding type display (evidence, analysis, pattern, statement, note)
- Fraud confidence display (0-100)
- Related evidence links
- Edit/delete findings (author or admin only)

#### PrePaymentCheckpoint.tsx
**Features**:
- Transaction details display (amount, merchant, type)
- Risk score display (0-100)
- Risk level badge (LOW/MEDIUM/HIGH/CRITICAL)
- Validation rules status (passed/failed rules)
- Risk factors breakdown
- Confirmation modal (if required)
- Confirmation token display
- OTP/Email confirmation method indication
- Timer showing confirmation expiry
- Approve/Deny buttons

**UI Elements**:
- Status indicator badge
- Risk gauge/score display
- Rules checklist (✓ passed, ✗ failed)
- Risk factors cards
- Confirmation modal with instructions
- Timer countdown
- Approve/Block buttons

#### FinshieldRescue.tsx (main panel with sub-views)
**Sub-Tab 1: Create Case**
- Incident type selector
- Incident date picker
- Amount input
- Payment method selector
- Merchant name input
- Description text area
- Submit button
- Guidance text/next steps display

**Sub-Tab 2: Cases List**
- List of user's rescue cases
- Status indicators (open, in-progress, resolved, closed)
- Filing status display (draft, filed, under review, appealed)
- Recovery status display (pending, recovered, partial, unsuccessful)
- Amount and recovered amount display
- Creation date
- Sort and filter options

**Sub-Tab 3: Case Details**
- Full case information display
- Timeline of events
- Communication logs (searchable)
- Recovery tracking events
- Evidence file links
- Status update buttons (for admin)
- File dispute button (for admin)
- Add communication button
- Add recovery event button (for admin)
- Action buttons based on case status

**Sub-Tab 4: Recovery Tracking**
- Recovery event list
- Event type display
- Amount and date
- Status (pending, completed, failed)
- Reference numbers
- Chargeback status (filed, accepted, rejected, appealed, resolved)
- Timeline visualization

**Sub-Tab 5: Communication**
- Communication log entries
- Direction (outgoing/incoming)
- Communication type (email, SMS, in-app, phone)
- Message preview
- Timestamp
- Recipient type
- Delivery status
- Option to send new communication (for admin/support)

---

## 4. DATA FLOW & INTEGRATION

### 4.1 Evidence Upload Flow
```
User selects file
    ↓
Frontend validates (type, size)
    ↓
POST /api/fraud/evidence/upload (multipart/form-data)
    ↓
Backend stores file (S3 or local storage)
    ↓
Backend triggers OCR/text extraction (async)
    ↓
Evidence record created in DB
    ↓
Frontend receives evidence ID
    ↓
User views uploaded evidence in list
    ↓
User can delete or trigger analysis
```

### 4.2 Analysis Flow
```
User selects evidence + analysis type
    ↓
POST /api/fraud/analysis/analyze-evidence
    ↓
Backend: Text analysis (keyword matching)
Backend: Pattern matching (against known patterns)
Backend: Anomaly detection (statistical)
    ↓
Results stored in EvidenceAnalysis table
    ↓
User views results in analysis panel
    ↓
Risk score recalculated (if new findings)
    ↓
Investigation timeline updated
```

### 4.3 Investigation Creation & Escalation
```
User creates investigation
    ↓
POST /api/fraud/investigations
    ↓
Investigation created with status: "new"
    ↓
User uploads evidence for investigation
    ↓
POST /api/fraud/evidence/upload (with investigation_id)
    ↓
User triggers analysis
    ↓
Risk score calculated
    ↓
User can escalate: POST /api/fraud/investigations/{id}/escalate
    ↓
Admin reviews and may file rescue case
```

### 4.4 Pre-Payment Checkpoint Flow
```
User initiates payment
    ↓
Frontend calls: POST /api/fraud/checkpoint/validate
    ↓
Backend applies validation rules
    ↓
Backend calculates risk score
    ↓
If risk_level == CRITICAL or failed critical rule
    → status: "blocked" + block transaction
    
Else if risk_level == HIGH or failed important rule
    → status: "requires_confirmation" + show confirmation modal
    
Else
    → status: "approved" + proceed with payment
    ↓
If requires_confirmation:
    User sees modal with checkpoint details
    User clicks "Confirm Payment"
    ↓
    POST /api/fraud/checkpoint/confirm (with token)
    ↓
    Backend validates token expiry + user
    ↓
    Returns approval + 60-second window
    ↓
    Frontend proceeds with payment
```

### 4.5 FINSHIELD RESCUE Flow
```
User reports fraud via rescue form
    ↓
POST /api/fraud/rescue/create
    ↓
Rescue case created (status: "open", filing_status: "draft")
    ↓
System sends guidance + next steps email
    ↓
Admin can review case + request evidence
    ↓
User provides evidence via investigation link
    ↓
When ready: PATCH /api/fraud/rescue/{id} (filing_status: "filed")
    ↓
Admin files dispute with bank
    ↓
POST /api/fraud/rescue/{id}/file-dispute
    ↓
System records bank reference number
    ↓
Communication log entries created
    ↓
User can monitor recovery tracking
    ↓
Recovery events added via POST /api/fraud/rescue/{id}/add-recovery
    ↓
Case resolved: POST /api/fraud/rescue/{id}/resolve
    ↓
Timeline complete
```

---

## 5. VALIDATION & ERROR HANDLING

### 5.1 File Upload Validation
**Enforced at API layer**:
- File type: Must be receipt, document, screenshot, email, or other
- File size: Max 50MB (413 Payload Too Large error)
- Mime type: Whitelist (PDF, JPEG, PNG, DOCX, TXT, XLSX)
- MIME type must match file extension (prevent spoofing)

**Errors**:
- 400 Bad Request: Invalid file type, unsupported mime type
- 413 Payload Too Large: File exceeds size limit
- 500 Internal Server Error: Storage failure, OCR failure (not fatal, allow retry)

**Recovery**:
- Temporary upload failures can be retried
- OCR failures log error but don't block evidence creation
- User can retry extraction later

### 5.2 Investigation Status Transitions
**Valid transitions**:
```
new → in-review (user updates)
new → escalated (user request)
in-review → resolved (investigator/admin)
in-review → escalated (automatic if high risk)
resolved → closed (automatic after 30 days)
escalated → in-review (admin takes action)
escalated → resolved (admin resolves)
```

**Invalid transitions** (return 409 Conflict):
- resolved → new (cannot reopen)
- closed → anything (case is final)

### 5.3 Checkpoint Confirmation Validation
**Token validation**:
- Token expiry: Must be within 60 minutes of generation
- Token format: UUID v4, cryptographically secure
- User validation: Token tied to specific user_id
- One-time use: Token invalidated after successful confirmation

**Errors**:
- 400: Invalid token format, missing required fields
- 410: Token expired (validity window passed)
- 403: Token belongs to different user

### 5.4 Risk Score Calculation Validation
**Pre-requisites**:
- At least one piece of evidence analyzed
- All evidence analysis complete (status != "processing")

**If missing evidence**:
- Return 400 with message: "Investigation has no analyzed evidence for risk scoring"

**If analysis not complete**:
- Return 202 Accepted with "analysis_in_progress": true
- Include estimated completion time

### 5.5 Rescue Case Validation
**Constraints**:
- disputed_amount > 0
- incident_date <= current date (not future)
- payment_method must be in enum
- merchant_name required
- Only one open rescue case per transaction (no duplicates)

**Errors**:
- 400: Invalid amount, future date, missing fields
- 409: Case already exists for this transaction

---

## 6. TESTING STRATEGY

### 6.1 Backend Unit Tests
**Evidence Model Tests**:
- Test evidence creation with valid file metadata
- Test file size validation (>50MB fails)
- Test file type validation (unsupported formats rejected)
- Test evidence deletion (soft delete)
- Test relationship integrity (orphan handling)

**Analysis Engine Tests**:
- Test pattern matching with known indicators
- Test risk score calculation formula
- Test anomaly detection with edge cases
- Test score components weighting

**Investigation Tests**:
- Test case creation and status transitions
- Test invalid transitions (409 errors)
- Test timeline event creation
- Test evidence/finding relationships

**Checkpoint Tests**:
- Test validation rule execution
- Test risk score calculation
- Test token generation and expiry
- Test confirmation window (60-second constraint)

**Rescue Case Tests**:
- Test case creation constraints
- Test duplicate case prevention
- Test recovery tracking
- Test status transitions

### 6.2 Backend Integration Tests
**Evidence Upload → Analysis Flow**:
```python
1. Upload evidence file
2. Verify file stored
3. Verify OCR extraction completed
4. Trigger analysis
5. Verify EvidenceAnalysis record created
6. Verify risk score updated
7. Verify timeline event created
```

**Investigation Escalation Flow**:
```python
1. Create investigation (status: new)
2. Add evidence
3. Analyze evidence
4. Calculate risk score (high)
5. Escalate investigation
6. Verify status changed to escalated
7. Verify assignment field populated
```

**Pre-Payment Checkpoint Flow**:
```python
1. Submit checkpoint validation request
2. Verify rules evaluated
3. If requires_confirmation:
   a. Verify token generated
   b. Submit confirmation with token
   c. Verify confirmation timestamp
   d. Verify expiry timestamp
4. Verify checkpoint status updated
```

**FINSHIELD RESCUE Flow**:
```python
1. Create rescue case
2. Verify case created with correct amounts
3. Add evidence
4. Update case status to filed
5. Add recovery tracking event
6. Verify total recovered amount updated
7. Resolve case
8. Verify case_status = closed
```

### 6.3 Frontend Component Tests
**EvidenceUploadPanel**:
- Upload valid file (mock API)
- Show upload progress
- Display evidence in list
- Fraud score shown with correct color
- Delete evidence (confirm modal)
- Error states (network, validation)

**FraudAnalysisPanel**:
- Trigger analysis (mock API)
- Display analysis results
- Risk score updates
- Pattern matches displayed
- Anomaly flags shown

**InvestigationWorkflow Tabs**:
- Tab switching works
- Details editable
- Timeline displays chronologically
- Findings can be added/removed
- Status transitions work (valid only)
- Escalation button available

**PrePaymentCheckpoint**:
- Checkpoint status displayed
- Risk factors listed
- If confirmation required: modal shows
- Confirmation token input field
- Confirmation expires after 60 seconds
- Approve/Block buttons functional

**FinshieldRescue Panels**:
- Case creation form validation
- Cases list displays correctly
- Case details fully populated
- Communication log searchable
- Recovery tracking timeline correct
- Recovery amount accumulates correctly

### 6.4 API Contract Tests (via curl/Postman)
**Test scenarios documented in separate file with:**
- Request/response examples
- Status code assertions
- Error case assertions
- Sample data for each endpoint

---

## 7. ERROR HANDLING STRATEGY

### 7.1 Error Response Format (Standardized)
```json
{
  "detail": "string (human-readable error message)",
  "error_code": "string (machine-readable code)",
  "error_type": "enum (validation_error|authorization_error|not_found|conflict|server_error)",
  "timestamp": "datetime",
  "request_id": "string (for debugging)"
}
```

### 7.2 HTTP Status Code Mapping
| Status | Scenario | Recovery |
|--------|----------|----------|
| 200 | Success | N/A |
| 201 | Resource created | N/A |
| 202 | Accepted (async) | Poll or wait for webhook |
| 400 | Bad request (validation) | Fix input, retry |
| 401 | Unauthorized (invalid token) | Reauthenticate |
| 403 | Forbidden (no permission) | Contact admin |
| 404 | Not found | Verify ID/resource exists |
| 409 | Conflict (constraint violation) | Use different values/check state |
| 410 | Gone (token expired) | Request new token |
| 413 | Payload too large (file size) | Use smaller file |
| 500 | Server error | Retry or contact support |

### 7.3 Specific Error Cases
**Evidence Upload**:
- If OCR fails: Store error, allow manual text input later
- If file storage fails: Retry with exponential backoff

**Analysis Engine**:
- If pattern database unavailable: Use cached patterns, queue for retry
- If NLP service down: Return partial results or 202 Accepted

**Risk Scoring**:
- If calculation fails: Return 500, log error, trigger alert
- If evidence incomplete: Return 400 "Cannot score with pending analysis"

**Payment Checkpoint**:
- If external validation service down: Default to MEDIUM risk, require confirmation
- If user timeout: Allow re-request checkpoint (token reissuable)

---

## 8. PERFORMANCE & SCALABILITY

### 8.1 Indexing Strategy
**Database Indexes**:
- `evidence(investigation_id, status)` - Evidence lookup by case
- `evidence_analysis(evidence_id)` - Analysis results lookup
- `investigation(user_id, status)` - User's cases
- `investigation(created_at DESC)` - Recent investigations
- `risk_score(investigation_id)` - Case risk lookup
- `transaction_checkpoint(transaction_id)` - Transaction validation
- `rescue_case(user_id, case_status)` - User's rescue cases
- `communication_log(rescue_case_id, sent_at DESC)` - Case communications

### 8.2 Caching Strategy
**In-Memory Cache (Redis)**:
- Active fraud patterns (refresh daily or on update)
- Validation rules (refresh on rule change)
- User's recent investigations (TTL: 5 minutes)
- Risk score calculations (TTL: 10 minutes, per investigation)

**Benefits**:
- Faster pattern matching
- Reduced DB load for frequently accessed rules
- Instant user investigation list refresh

### 8.3 Async Processing
**Async Tasks** (Celery/Background jobs):
- OCR text extraction (file upload)
- Full evidence analysis (pattern matching, NLP)
- Risk score recalculation (when evidence added)
- Report generation (daily/weekly stats)
- Email notifications (rescue case updates, decisions)

**Queue Strategy**:
- High priority: Urgent evidence analysis
- Normal priority: Standard analysis, reports
- Low priority: Historical data cleanup

### 8.4 API Rate Limiting
**Per-user limits**:
- 100 requests per minute to analysis endpoints
- 50 file uploads per day
- 20 investigations per month

**Admin limits**: Higher (200+ requests/minute)

---

## 9. SECURITY CONSIDERATIONS

### 9.1 File Upload Security
**Threats & Mitigations**:
- Malicious file upload → File type/MIME validation, virus scan, sandboxed storage
- File content injection → OCR isolated, no code execution
- Path traversal → Use secure storage (S3 with versioning)
- Sensitive data leakage → Encrypt files at rest, enforce access control

### 9.2 Authentication & Authorization
**Token validation**:
- All endpoints require Bearer token
- Token validation on every request
- User isolation: Filter results by user_id from token
- Admin endpoints: Check role == "ADMIN"

**Sensitive data**:
- Passwords: Never logged or exposed
- Evidence text: Treat as sensitive (access control)
- Recovery amounts: Visible only to user/admin/support

### 9.3 Audit Logging
**All actions logged**:
- File upload: user_id, file_name, timestamp
- Investigation created/updated: user_id, changes, timestamp
- Analysis triggered: user_id, evidence_id, timestamp
- Case decision: admin_id, decision, reasoning, timestamp

**Retention**: Logs retained for 2 years (compliance)

### 9.4 Encryption
**At rest**:
- Evidence files: Encrypted with AES-256 (S3 or local encrypted storage)
- Database: TDE (Transparent Data Encryption) for PostgreSQL

**In transit**:
- HTTPS enforced (TLS 1.3)
- API responses: No sensitive data in URL parameters

---

## 10. INTEGRATION WITH EXISTING SYSTEMS

### 10.1 User & Transaction Integration
**User model**:
- Add `fraud_investigation_count` denormalized field (optional)
- Add `last_fraud_incident_date` for pattern recognition

**Transaction model**:
- Add `checkpoint_id` FK (optional, link to checkpoint)
- Add `is_flagged_for_fraud` boolean

### 10.2 Portfolio & Investment Integration
**Investigation linked to**:
- Investment activity (detect fraud in investment transactions)
- Portfolio holdings (correlate with account takeover patterns)

### 10.3 Business Profile Integration
**Rescue case uses**:
- Business email for notifications
- Business GST number for dispute filing

---

## 11. ASSUMPTIONS & CONSTRAINTS

**Assumptions**:
1. PostgreSQL available for relational data
2. S3 or local filesystem available for file storage
3. External OCR service available (Google Cloud Vision or Azure Computer Vision)
4. NLP/pattern matching can be implemented with Python libraries (sklearn, nltk)
5. Users have 60 minutes to confirm pre-payment checkpoints
6. Fraud patterns database is manually maintained/updated
7. Admin users trained on investigation workflows

**Constraints**:
- Evidence files max 50MB
- OCR extraction limited to text documents (PDF, images with text)
- Pattern matching based on keyword matching (not ML-based classification)
- Chargeback process follows Indian banking standards (90-day window)
- Risk score calculation uses static weights (not ML-based)
- Single-user context (no multi-user investigations)

---

## 12. DESIGN REVIEW RESPONSES

*This section will be populated with responses to design review findings.*

*No review findings at this stage.*

---

## Completion Criteria

✅ **Design Document Complete When**:
1. All 5 subsystems (evidence, analysis, investigation, checkpoint, rescue) designed with API contracts
2. Database schema comprehensive with relationships defined
3. Component hierarchy clear with feature specifications
4. Data flow diagrams document all major flows
5. Error handling documented per endpoint
6. Testing strategy covers unit, integration, and API levels
7. Security considerations addressed
8. Performance/scalability plan outlined

✅ **Ready for Implementation When**:
1. Design review completed with sign-off
2. All ambiguities clarified
3. Technology stack confirmed (PostgreSQL, S3 or local storage, Python/FastAPI)
4. Team resources allocated
5. Implementation schedule set (estimated 2-3 weeks for full system)

---

**Document Status**: 🎯 DESIGN READY  
**Created**: 2024  
**Phase**: 6 of N  
**Technology**: FastAPI (Python), React (TypeScript), SQLAlchemy, PostgreSQL
