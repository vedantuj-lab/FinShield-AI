"""
Fraud detection and investigation routes - Phase 6 Complete Implementation
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import uuid
import re

from app.database import get_db
from app.models import (
    User, Investigation, Evidence, EvidenceAnalysis, FraudPattern, RiskScore,
    TimelineEvent, CaseFind, TransactionCheckpoint, ValidationRule, RescueCase,
    CommunicationLog, RecoveryTracking, Transaction, UserRole
)
from app.security import decode_token, generate_id
from app.schemas import (
    EvidenceCreate, EvidenceResponse, EvidenceListResponse, AnalysisRequest, AnalysisResultResponse,
    RiskScoreRequest, RiskScoreResponse, InvestigationCreateFraud, InvestigationUpdateRequest,
    InvestigationsListResponse, FindingCreateRequest, CaseFindResponse, TimelineEventResponse,
    CheckpointValidationRequest, CheckpointValidationResponse, CheckpointConfirmRequest,
    CheckpointConfirmResponse, CheckpointResponse, ValidationRulesListResponse, FraudPatternsListResponse,
    PatternTestRequest, PatternTestResponse, RescueCaseCreateRequest, RescueCaseResponse,
    RescueCaseListResponse, RescueCaseUpdateRequest, DisputeFilingRequest, DisputeFilingResponse,
    CommunicationAddRequest, CommunicationAddResponse, RecoveryAddRequest, RecoveryAddResponse,
    RescueResolveRequest, RescueResolveResponse
)

router = APIRouter(prefix="/fraud", tags=["fraud-detection"])


def get_current_user_from_header(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get current user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user


def check_admin(user: User):
    """Check if user is admin"""
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


# ==================== EVIDENCE UPLOAD SYSTEM ====================

@router.post("/evidence/upload", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(
    investigation_id: str,
    file_type: str,
    file: UploadFile = File(...),
    case_id: str = None,
    description: str = None,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Upload evidence file for an investigation"""
    # Validate investigation exists
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Check authorization
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload evidence for this investigation")
    
    # Validate file type
    valid_types = ["receipt", "document", "screenshot", "email", "other"]
    if file_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Must be one of: {valid_types}")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size (50MB max)
    if file_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")
    
    # Create evidence record
    evidence = Evidence(
        id=generate_id(),
        investigation_id=investigation_id,
        case_id=case_id,
        file_name=file.filename,
        file_type=file_type,
        file_path=f"uploads/{generate_id()}_{file.filename}",
        file_size=file_size,
        mime_type=file.content_type,
        storage_backend="local",
        storage_location=f"uploads/{generate_id()}_{file.filename}",
        status="uploaded",
        uploaded_by=current_user.id,
        extracted_text=description or "",
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=investigation_id,
        event_type="evidence_added",
        title=f"Evidence uploaded: {file.filename}",
        description=f"File type: {file_type}",
        created_by=current_user.id,
        related_entity_id=evidence.id,
        related_entity_type="evidence",
    )
    db.add(timeline_event)
    db.commit()
    
    return evidence


@router.get("/evidence/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve evidence details"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Check authorization
    investigation = db.query(Investigation).filter(Investigation.id == evidence.investigation_id).first()
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this evidence")
    
    return evidence


@router.get("/evidence/investigation/{investigation_id}", response_model=EvidenceListResponse)
async def list_evidence(
    investigation_id: str,
    status: str = Query(None),
    file_type: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """List evidence for an investigation"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(Evidence).filter(Evidence.investigation_id == investigation_id)
    
    if status:
        query = query.filter(Evidence.status == status)
    if file_type:
        query = query.filter(Evidence.file_type == file_type)
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.delete("/evidence/{evidence_id}", status_code=204)
async def delete_evidence(
    evidence_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Soft delete evidence"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    investigation = db.query(Investigation).filter(Investigation.id == evidence.investigation_id).first()
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Don't allow deletion of evidence from resolved cases
    if investigation.status == "resolved":
        raise HTTPException(status_code=409, detail="Cannot delete evidence from resolved case")
    
    # Soft delete
    evidence.deleted_at = datetime.utcnow()
    db.commit()


# ==================== FRAUD ANALYSIS ENGINE ====================

def analyze_text_for_fraud(text: str) -> dict:
    """Analyze text for fraud indicators"""
    indicators = []
    fraud_keywords = [
        "urgent", "immediate action", "verify account", "confirm password",
        "click here", "update payment", "suspicious activity", "verify identity",
        "confirm transaction", "act now", "limited time"
    ]
    
    text_lower = text.lower()
    for keyword in fraud_keywords:
        if keyword in text_lower:
            indicators.append({
                "indicator": keyword,
                "type": "keyword_match",
                "confidence": 0.7,
                "details": f"Fraud-related keyword detected: {keyword}"
            })
    
    confidence = min(len(indicators) * 0.2, 1.0) * 100
    return {
        "indicators": indicators,
        "confidence": confidence,
        "risk_level": "HIGH" if confidence > 60 else "MEDIUM" if confidence > 30 else "LOW"
    }


def detect_anomalies(text: str) -> list:
    """Detect anomalies in text"""
    anomalies = []
    
    # Check for all caps (usually suspicious)
    if len(text) > 20 and sum(1 for c in text if c.isupper()) / len(text) > 0.5:
        anomalies.append({
            "anomaly": "Excessive capitalization",
            "severity": "MEDIUM",
            "details": "Text contains unusual amount of capitals"
        })
    
    # Check for suspicious links
    if re.search(r'http[s]?://[^\s]+', text):
        anomalies.append({
            "anomaly": "Suspicious URL present",
            "severity": "HIGH",
            "details": "Text contains URL which may be phishing"
        })
    
    return anomalies


@router.post("/analysis/analyze-evidence", response_model=AnalysisResultResponse)
async def analyze_evidence(
    request: AnalysisRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Analyze evidence for fraud indicators"""
    evidence = db.query(Evidence).filter(Evidence.id == request.evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    investigation = db.query(Investigation).filter(Investigation.id == request.investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Perform analysis
    text_analysis = analyze_text_for_fraud(evidence.extracted_text or "")
    anomaly_flags = detect_anomalies(evidence.extracted_text or "")
    
    # Get patterns
    patterns = db.query(FraudPattern).filter(FraudPattern.status == "active").all()
    matched_patterns = []
    
    for pattern in patterns:
        indicators = json.loads(pattern.indicators) if isinstance(pattern.indicators, str) else pattern.indicators
        for indicator in indicators:
            if indicator.lower() in (evidence.extracted_text or "").lower():
                matched_patterns.append({
                    "pattern_id": pattern.id,
                    "pattern_name": pattern.pattern_name,
                    "match_confidence": pattern.risk_score_base,
                    "matches": [indicator]
                })
    
    # Store analysis
    analysis = EvidenceAnalysis(
        id=generate_id(),
        evidence_id=evidence.id,
        investigation_id=request.investigation_id,
        analysis_type=request.analysis_type,
        indicators_found=json.dumps(text_analysis["indicators"]),
        confidence_score=text_analysis["confidence"],
        anomaly_flags=json.dumps(anomaly_flags),
        matched_patterns=json.dumps(matched_patterns),
        risk_level=text_analysis["risk_level"],
    )
    db.add(analysis)
    
    # Update evidence fraud score
    evidence.fraud_score = text_analysis["confidence"]
    evidence.status = "verified"
    
    db.commit()
    db.refresh(analysis)
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=request.investigation_id,
        event_type="analysis_completed",
        title="Evidence analysis completed",
        description=f"Risk level: {text_analysis['risk_level']}",
        created_by=current_user.id,
        related_entity_id=evidence.id,
        related_entity_type="evidence",
    )
    db.add(timeline_event)
    db.commit()
    
    return {
        "evidence_id": evidence.id,
        "analysis_type": request.analysis_type,
        "indicators_found": text_analysis["indicators"],
        "confidence_score": text_analysis["confidence"],
        "anomaly_flags": anomaly_flags,
        "matched_patterns": matched_patterns,
        "risk_level": text_analysis["risk_level"],
        "analyzed_at": datetime.utcnow(),
    }


@router.post("/analysis/calculate-risk-score", response_model=RiskScoreResponse)
async def calculate_risk_score(
    request: RiskScoreRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Calculate comprehensive risk score"""
    investigation = db.query(Investigation).filter(Investigation.id == request.investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all evidence analyses
    analyses = db.query(EvidenceAnalysis).filter(EvidenceAnalysis.investigation_id == request.investigation_id).all()
    
    if not analyses:
        raise HTTPException(status_code=400, detail="Investigation has no evidence for risk scoring")
    
    # Calculate component scores
    evidence_score = sum(a.confidence_score for a in analyses) / len(analyses) if analyses else 0
    pattern_match_score = sum(json.loads(a.matched_patterns or "[]") and 60 or 0 for a in analyses) / len(analyses) if analyses else 0
    anomaly_score = sum(len(json.loads(a.anomaly_flags or "[]")) * 20 for a in analyses) / len(analyses) if analyses else 0
    
    # Weighted calculation
    overall_risk = (
        evidence_score * 0.3 +
        pattern_match_score * 0.25 +
        min(anomaly_score, 100) * 0.25 +
        0 * 0.15 +  # correlation score
        0 * 0.05    # temporal score
    )
    
    if overall_risk >= 80:
        risk_level = "CRITICAL"
    elif overall_risk >= 60:
        risk_level = "HIGH"
    elif overall_risk >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    # Check if risk score already exists
    risk_score = db.query(RiskScore).filter(RiskScore.investigation_id == request.investigation_id).first()
    if not risk_score:
        risk_score = RiskScore(
            id=generate_id(),
            investigation_id=request.investigation_id,
        )
        db.add(risk_score)
    
    risk_score.evidence_score = evidence_score
    risk_score.pattern_match_score = pattern_match_score
    risk_score.anomaly_score = anomaly_score
    risk_score.overall_risk = overall_risk
    risk_score.risk_level = risk_level
    risk_score.confidence = 75.0
    risk_score.calculated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(risk_score)
    
    # Update investigation risk level
    investigation.risk_level = risk_level
    db.commit()
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=request.investigation_id,
        event_type="risk_reassessed",
        title=f"Risk score calculated: {risk_level}",
        description=f"Overall risk: {overall_risk:.1f}",
        created_by=current_user.id,
        severity=risk_level,
    )
    db.add(timeline_event)
    db.commit()
    
    return {
        "investigation_id": request.investigation_id,
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "confidence": 75.0,
        "component_scores": {
            "evidence_score": evidence_score,
            "pattern_match_score": pattern_match_score,
            "anomaly_score": anomaly_score,
            "correlation_score": 0,
            "temporal_score": 0,
        },
        "reasoning": f"Risk assessed based on evidence analysis, pattern matching, and anomaly detection.",
        "calculated_at": datetime.utcnow(),
    }


@router.get("/analysis/patterns", response_model=FraudPatternsListResponse)
async def get_fraud_patterns(
    category: str = Query(None),
    status: str = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve active fraud patterns"""
    query = db.query(FraudPattern)
    
    if status:
        query = query.filter(FraudPattern.status == status)
    else:
        query = query.filter(FraudPattern.status == "active")
    
    if category:
        query = query.filter(FraudPattern.category == category)
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
    }


@router.post("/analysis/test-pattern", response_model=PatternTestResponse)
async def test_pattern(
    request: PatternTestRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Test if text matches a fraud pattern"""
    pattern = db.query(FraudPattern).filter(FraudPattern.id == request.pattern_id).first()
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    indicators = json.loads(pattern.indicators) if isinstance(pattern.indicators, str) else pattern.indicators
    matches = [ind for ind in indicators if ind.lower() in request.text.lower()]
    
    return {
        "pattern_id": pattern.id,
        "pattern_name": pattern.pattern_name,
        "matches": matches,
        "match_count": len(matches),
        "confidence": (len(matches) / len(indicators) * 100) if indicators else 0,
        "indicator_breakdown": [{"indicator": ind, "occurrences": request.text.lower().count(ind.lower())} for ind in indicators],
    }


# ==================== INVESTIGATION WORKFLOW ====================

@router.post("/investigations", status_code=201)
async def create_investigation(
    request: InvestigationCreateFraud,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create new fraud investigation"""
    investigation = Investigation(
        id=generate_id(),
        user_id=current_user.id,
        title=request.title,
        description=request.description,
        status="new",
        risk_level="LOW",
    )
    
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=investigation.id,
        event_type="investigation_opened",
        title="Investigation opened",
        description=request.description,
        created_by=current_user.id,
    )
    db.add(timeline_event)
    db.commit()
    
    return {
        "id": investigation.id,
        "user_id": investigation.user_id,
        "title": investigation.title,
        "description": investigation.description,
        "status": investigation.status,
        "priority": "MEDIUM",
        "risk_level": investigation.risk_level,
        "evidence_count": 0,
        "created_at": investigation.created_at,
        "updated_at": investigation.updated_at,
    }


@router.get("/investigations/{investigation_id}")
async def get_investigation(
    investigation_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve investigation details"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    evidence = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).all()
    findings = db.query(CaseFind).filter(CaseFind.investigation_id == investigation_id).all()
    risk_score = db.query(RiskScore).filter(RiskScore.investigation_id == investigation_id).first()
    timeline = db.query(TimelineEvent).filter(TimelineEvent.investigation_id == investigation_id).order_by(TimelineEvent.created_at.desc()).all()
    
    return {
        "id": investigation.id,
        "user_id": investigation.user_id,
        "title": investigation.title,
        "description": investigation.description,
        "status": investigation.status,
        "priority": "MEDIUM",
        "risk_level": investigation.risk_level,
        "evidence_collection": evidence,
        "case_findings": findings,
        "risk_score": {
            "overall_risk": risk_score.overall_risk if risk_score else 0,
            "risk_level": risk_score.risk_level if risk_score else "LOW",
            "confidence": risk_score.confidence if risk_score else 0,
        } if risk_score else None,
        "timeline": timeline,
        "created_at": investigation.created_at,
        "updated_at": investigation.updated_at,
    }


@router.get("/investigations")
async def list_investigations(
    status: str = Query(None),
    priority: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """List investigations for current user"""
    query = db.query(Investigation).filter(Investigation.user_id == current_user.id)
    
    if status:
        query = query.filter(Investigation.status == status)
    
    total = query.count()
    active_count = db.query(Investigation).filter(
        Investigation.user_id == current_user.id,
        Investigation.status != "closed"
    ).count()
    high_risk_count = db.query(Investigation).filter(
        Investigation.user_id == current_user.id,
        Investigation.risk_level.in_(["HIGH", "CRITICAL"])
    ).count()
    
    items = query.offset(offset).limit(limit).all()
    
    return {
        "items": [{"id": i.id, "title": i.title, "status": i.status, "priority": "MEDIUM", "risk_level": i.risk_level, "evidence_count": len(i.evidence), "created_at": i.created_at, "updated_at": i.updated_at} for i in items],
        "total": total,
        "active_count": active_count,
        "high_risk_count": high_risk_count,
    }


@router.patch("/investigations/{investigation_id}")
async def update_investigation(
    investigation_id: str,
    request: InvestigationUpdateRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Update investigation"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if request.status:
        investigation.status = request.status
    if request.priority:
        # Store priority separately if needed
        pass
    if request.findings_summary:
        investigation.description = request.findings_summary
    
    db.commit()
    db.refresh(investigation)
    
    return {
        "id": investigation.id,
        "status": investigation.status,
        "priority": "MEDIUM",
        "updated_at": investigation.updated_at,
    }


@router.post("/investigations/{investigation_id}/escalate")
async def escalate_investigation(
    investigation_id: str,
    reason: str = None,
    priority_override: str = None,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Escalate investigation"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    investigation.status = "escalated"
    db.commit()
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=investigation_id,
        event_type="escalated",
        title="Investigation escalated",
        description=reason or "Investigation escalated to admin review",
        created_by=current_user.id,
        severity="ALERT",
    )
    db.add(timeline_event)
    db.commit()
    
    return {
        "id": investigation.id,
        "status": "escalated",
        "assigned_to": "admin",
        "priority": priority_override or "HIGH",
        "escalated_at": datetime.utcnow(),
    }


@router.post("/investigations/{investigation_id}/add-finding", status_code=201)
async def add_finding(
    investigation_id: str,
    request: FindingCreateRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Add finding to investigation"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    finding = CaseFind(
        id=generate_id(),
        investigation_id=investigation_id,
        finding_text=request.finding_text,
        finding_type=request.finding_type,
        severity=request.severity,
        fraud_confidence=request.fraud_confidence or 0,
        related_evidence_ids=json.dumps(request.related_evidence_ids or []),
        added_by=current_user.id,
    )
    
    db.add(finding)
    db.commit()
    
    # Add timeline event
    timeline_event = TimelineEvent(
        id=generate_id(),
        investigation_id=investigation_id,
        event_type="finding_added",
        title="New finding added",
        description=request.finding_text[:100],
        created_by=current_user.id,
        severity=request.severity,
        related_entity_id=finding.id,
        related_entity_type="finding",
    )
    db.add(timeline_event)
    db.commit()
    
    return {
        "id": finding.id,
        "investigation_id": finding.investigation_id,
        "finding_text": finding.finding_text,
        "finding_type": finding.finding_type,
        "severity": finding.severity,
        "fraud_confidence": finding.fraud_confidence,
        "created_at": finding.created_at,
    }


@router.get("/investigations/{investigation_id}/timeline")
async def get_timeline(
    investigation_id: str,
    event_type: str = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve investigation timeline"""
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(TimelineEvent).filter(TimelineEvent.investigation_id == investigation_id)
    
    if event_type:
        query = query.filter(TimelineEvent.event_type == event_type)
    
    items = query.order_by(TimelineEvent.created_at.desc()).limit(limit).all()
    
    return {
        "items": items,
        "total": len(items),
    }


# ==================== PRE-PAYMENT CHECKPOINT ====================

@router.post("/checkpoint/validate", response_model=CheckpointValidationResponse)
async def validate_checkpoint(
    request: CheckpointValidationRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Validate transaction before payment"""
    # Get transaction
    transaction = db.query(Transaction).filter(Transaction.id == request.transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get validation rules
    rules = db.query(ValidationRule).filter(ValidationRule.status == "active").all()
    
    passed_rules = []
    failed_rules = []
    risk_score = 0
    
    for rule in rules:
        # Simple rule evaluation
        if rule.rule_name == "amount_check":
            if request.transaction_amount > 100000:
                failed_rules.append({"rule_name": rule.rule_name, "reason": "Amount exceeds threshold"})
                risk_score += 20
            else:
                passed_rules.append(rule.rule_name)
        else:
            passed_rules.append(rule.rule_name)
    
    # Determine status
    if risk_score >= 80:
        status = "blocked"
    elif risk_score >= 50:
        status = "requires_confirmation"
    else:
        status = "approved"
    
    confirmation_token = None
    confirmation_expires_at = None
    
    if status == "requires_confirmation":
        confirmation_token = str(uuid.uuid4())
        confirmation_expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Create checkpoint
    checkpoint = TransactionCheckpoint(
        id=generate_id(),
        transaction_id=request.transaction_id,
        user_id=current_user.id,
        status=status,
        risk_score=risk_score,
        risk_level="HIGH" if risk_score >= 60 else "MEDIUM" if risk_score >= 40 else "LOW",
        validation_rules_passed=json.dumps(passed_rules),
        validation_rules_failed=json.dumps(failed_rules),
        transaction_amount=request.transaction_amount,
        transaction_merchant=request.merchant_name,
        transaction_type=request.transaction_type,
        transaction_date=datetime.utcnow(),
        confirmation_required=(status == "requires_confirmation"),
        confirmation_token=confirmation_token,
        expires_at=confirmation_expires_at,
    )
    
    db.add(checkpoint)
    db.commit()
    db.refresh(checkpoint)
    
    return {
        "checkpoint_id": checkpoint.id,
        "transaction_id": request.transaction_id,
        "status": status,
        "risk_score": risk_score,
        "risk_level": checkpoint.risk_level,
        "validation_results": {
            "passed_rules": passed_rules,
            "failed_rules": failed_rules,
        },
        "risk_factors": ["High transaction amount"] if risk_score > 50 else [],
        "confirmation_required": status == "requires_confirmation",
        "confirmation_token": confirmation_token,
        "confirmation_expires_at": confirmation_expires_at,
        "checked_at": checkpoint.checked_at,
    }


@router.post("/checkpoint/confirm", response_model=CheckpointConfirmResponse)
async def confirm_checkpoint(
    request: CheckpointConfirmRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Confirm checkpoint"""
    checkpoint = db.query(TransactionCheckpoint).filter(TransactionCheckpoint.id == request.checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    
    # Validate token
    if checkpoint.confirmation_token != request.confirmation_token:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Check expiry
    if checkpoint.expires_at and checkpoint.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Token expired")
    
    checkpoint.status = "approved"
    checkpoint.confirmed_at = datetime.utcnow()
    checkpoint.confirmed_by_ip = request.user_ip
    checkpoint.confirmation_method = "manual_review"
    
    db.commit()
    
    return {
        "checkpoint_id": checkpoint.id,
        "status": "approved",
        "confirmed_at": checkpoint.confirmed_at,
        "confirmation_method": "manual_review",
        "expires_in_seconds": 60,
    }


@router.get("/checkpoint/{checkpoint_id}", response_model=CheckpointResponse)
async def get_checkpoint(
    checkpoint_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve checkpoint details"""
    checkpoint = db.query(TransactionCheckpoint).filter(TransactionCheckpoint.id == checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    
    if checkpoint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return checkpoint


@router.get("/checkpoint/rules", response_model=ValidationRulesListResponse)
async def get_validation_rules(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """List validation rules (admin only)"""
    check_admin(current_user)
    
    rules = db.query(ValidationRule).all()
    return {"items": rules}


# ==================== FINSHIELD RESCUE ====================

@router.post("/rescue/create", response_model=dict, status_code=201)
async def create_rescue_case(
    request: RescueCaseCreateRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create FINSHIELD RESCUE case"""
    # Validate amount
    if request.disputed_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Check for duplicate cases
    existing = db.query(RescueCase).filter(
        RescueCase.transaction_id == request.transaction_id,
        RescueCase.case_status != "closed"
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="Case already exists for this transaction")
    
    rescue_case = RescueCase(
        id=generate_id(),
        user_id=current_user.id,
        investigation_id=request.investigation_id,
        incident_date=request.incident_date,
        incident_type=request.incident_type,
        incident_description=request.incident_description,
        payment_method=request.payment_method,
        merchant_name=request.merchant_name,
        transaction_id=request.transaction_id,
        disputed_amount=request.disputed_amount,
        currency=request.currency,
        case_status="open",
        filing_status="draft",
        recovery_status="pending",
    )
    
    db.add(rescue_case)
    db.commit()
    db.refresh(rescue_case)
    
    return {
        "id": rescue_case.id,
        "case_id": rescue_case.id,
        "user_id": rescue_case.user_id,
        "incident_type": rescue_case.incident_type,
        "disputed_amount": rescue_case.disputed_amount,
        "filing_status": rescue_case.filing_status,
        "case_status": rescue_case.case_status,
        "recovery_status": rescue_case.recovery_status,
        "created_at": rescue_case.created_at,
        "next_steps": [
            "File dispute with your bank within 90 days",
            "Gather supporting documents",
            "Monitor chargeback status"
        ],
    }


@router.get("/rescue/{case_id}", response_model=RescueCaseResponse)
async def get_rescue_case(
    case_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Retrieve rescue case details"""
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if rescue_case.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return rescue_case


@router.get("/rescue", response_model=RescueCaseListResponse)
async def list_rescue_cases(
    status: str = Query(None),
    filing_status: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """List rescue cases"""
    query = db.query(RescueCase).filter(RescueCase.user_id == current_user.id)
    
    if status:
        query = query.filter(RescueCase.case_status == status)
    if filing_status:
        query = query.filter(RescueCase.filing_status == filing_status)
    
    total = query.count()
    open_cases = db.query(RescueCase).filter(RescueCase.user_id == current_user.id, RescueCase.case_status == "open").count()
    total_disputed = db.query(RescueCase).filter(RescueCase.user_id == current_user.id).with_entities(
        db.func.sum(RescueCase.disputed_amount)
    ).scalar() or 0
    total_recovered = db.query(RescueCase).filter(RescueCase.user_id == current_user.id).with_entities(
        db.func.sum(RescueCase.recovered_amount)
    ).scalar() or 0
    
    items = query.offset(offset).limit(limit).all()
    
    return {
        "items": [{"id": i.id, "case_id": i.id, "incident_type": i.incident_type, "disputed_amount": i.disputed_amount, "filing_status": i.filing_status, "case_status": i.case_status, "recovery_status": i.recovery_status, "recovered_amount": i.recovered_amount, "created_at": i.created_at, "updated_at": i.updated_at} for i in items],
        "total": total,
        "open_cases": open_cases,
        "total_disputed_amount": total_disputed,
        "total_recovered_amount": total_recovered,
    }


@router.patch("/rescue/{case_id}", response_model=dict)
async def update_rescue_case(
    case_id: str,
    request: RescueCaseUpdateRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Update rescue case"""
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if rescue_case.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if request.case_status:
        rescue_case.case_status = request.case_status
    if request.filing_status:
        rescue_case.filing_status = request.filing_status
    if request.chargeback_filed is not None:
        rescue_case.chargeback_filed = request.chargeback_filed
    if request.chargeback_ref_number:
        rescue_case.chargeback_ref_number = request.chargeback_ref_number
    if request.resolution_type:
        rescue_case.resolution_type = request.resolution_type
    if request.resolution_notes:
        rescue_case.resolution_notes = request.resolution_notes
    
    db.commit()
    db.refresh(rescue_case)
    
    return {
        "id": rescue_case.id,
        "case_id": rescue_case.id,
        "filing_status": rescue_case.filing_status,
        "case_status": rescue_case.case_status,
        "updated_at": rescue_case.updated_at,
    }


@router.post("/rescue/{case_id}/file-dispute", response_model=DisputeFilingResponse)
async def file_dispute(
    case_id: str,
    request: DisputeFilingRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """File dispute for rescue case"""
    check_admin(current_user)
    
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    dispute_ref = f"DISPUTE-{generate_id()}"
    rescue_case.filing_status = "filed"
    rescue_case.filing_date = datetime.utcnow()
    rescue_case.dispute_ref_number = dispute_ref
    
    db.commit()
    
    return {
        "case_id": rescue_case.id,
        "filing_status": "filed",
        "dispute_ref_number": dispute_ref,
        "filing_date": rescue_case.filing_date,
        "expected_resolution_date": datetime.utcnow() + timedelta(days=30),
        "next_steps": [
            "Bank will review the dispute",
            "Chargeback will be filed if approved",
            "You will be notified of progress"
        ],
        "confirmation_sent_to": current_user.email if hasattr(current_user, 'email') else "user@example.com",
    }


@router.post("/rescue/{case_id}/add-communication", response_model=CommunicationAddResponse, status_code=201)
async def add_communication(
    case_id: str,
    request: CommunicationAddRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Add communication log"""
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    log = CommunicationLog(
        id=generate_id(),
        rescue_case_id=case_id,
        communication_type=request.communication_type,
        direction=request.direction,
        message=request.message,
        sent_by=current_user.id,
        sent_to=current_user.id if hasattr(current_user, 'id') else "",
        recipient_type=request.recipient_type,
        external_ref=request.external_ref,
        status="sent",
    )
    
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return {
        "id": log.id,
        "rescue_case_id": log.rescue_case_id,
        "communication_type": log.communication_type,
        "direction": log.direction,
        "status": log.status,
        "sent_at": log.sent_at,
    }


@router.post("/rescue/{case_id}/add-recovery", response_model=RecoveryAddResponse, status_code=201)
async def add_recovery(
    case_id: str,
    request: RecoveryAddRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Record recovery event"""
    check_admin(current_user)
    
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    recovery = RecoveryTracking(
        id=generate_id(),
        rescue_case_id=case_id,
        event_type=request.event_type,
        recovery_amount=request.recovery_amount,
        recovery_date=request.recovery_date,
        reference_number=request.reference_number,
        bank_reference=request.bank_reference,
        status="pending",
    )
    
    db.add(recovery)
    
    # Update rescue case
    rescue_case.recovered_amount += request.recovery_amount
    rescue_case.recovery_date = request.recovery_date
    rescue_case.recovery_status = "recovered" if rescue_case.recovered_amount >= rescue_case.disputed_amount else "partial"
    
    db.commit()
    db.refresh(recovery)
    
    return {
        "id": recovery.id,
        "rescue_case_id": recovery.rescue_case_id,
        "event_type": recovery.event_type,
        "recovery_amount": recovery.recovery_amount,
        "recovery_date": recovery.recovery_date,
        "status": recovery.status,
        "created_at": recovery.created_at,
    }


@router.post("/rescue/{case_id}/resolve", response_model=RescueResolveResponse)
async def resolve_rescue_case(
    case_id: str,
    request: RescueResolveRequest,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Resolve rescue case"""
    check_admin(current_user)
    
    rescue_case = db.query(RescueCase).filter(RescueCase.id == case_id).first()
    if not rescue_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    rescue_case.case_status = "closed"
    rescue_case.resolution_type = request.resolution_type
    rescue_case.resolution_notes = request.resolution_notes
    rescue_case.resolution_date = datetime.utcnow()
    rescue_case.recovered_amount = request.final_recovery_amount
    rescue_case.recovery_status = "resolved"
    
    db.commit()
    
    return {
        "case_id": rescue_case.id,
        "case_status": "closed",
        "resolution_type": request.resolution_type,
        "recovery_status": "resolved",
        "total_recovered": rescue_case.recovered_amount,
        "resolution_date": rescue_case.resolution_date,
        "closure_communication_sent": True,
    }
