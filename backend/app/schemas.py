"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


# Budget Schemas
class TransactionCreate(BaseModel):
    date: datetime
    amount: float
    description: str
    category: str
    transaction_type: str = "expense"
    merchant: Optional[str] = None
    reference: Optional[str] = None


class TransactionResponse(TransactionCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    month: str
    total_income: float
    total_budget: float
    savings_target: float = 0


class BudgetResponse(BudgetCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Investment Schemas
class InvestmentCreate(BaseModel):
    category: str
    name: str
    purchase_value: float
    units: float
    purchase_date: datetime
    current_value: Optional[float] = None
    notes: Optional[str] = None


class InvestmentResponse(InvestmentCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Portfolio Schemas
class PortfolioHoldingCreate(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    category: str
    sector: Optional[str] = None
    current_price: Optional[float] = None


class PortfolioHoldingResponse(PortfolioHoldingCreate):
    id: str
    portfolio_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    id: str
    user_id: str
    total_invested: float
    current_value: float
    holdings: List[PortfolioHoldingResponse]
    last_updated: datetime

    class Config:
        from_attributes = True


class EducationResourceCreate(BaseModel):
    title: str
    content: str
    category: str
    url: Optional[str] = None


class EducationResourceResponse(EducationResourceCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Business Schemas
class BusinessProfileCreate(BaseModel):
    business_name: str
    category: str
    contact_email: str
    contact_phone: Optional[str] = None
    gst_number: Optional[str] = None
    financial_year: str = "2024-25"


class BusinessProfileResponse(BusinessProfileCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Investigation Schemas
class InvestigationCreate(BaseModel):
    title: str
    description: Optional[str] = None


class InvestigationResponse(InvestigationCreate):
    id: str
    user_id: str
    status: str
    risk_level: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Trading & Market Insights Schemas
class MarketDataResponse(BaseModel):
    id: str
    symbol: str
    date: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: int
    created_at: datetime

    class Config:
        from_attributes = True


class TechnicalIndicatorResponse(BaseModel):
    id: str
    symbol: str
    date: datetime
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    bbands_upper: Optional[float] = None
    bbands_lower: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaperTradeCreate(BaseModel):
    symbol: str
    trade_type: str  # buy or sell
    quantity: float
    entry_price: float
    entry_date: datetime


class PaperTradeResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    trade_type: str
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    entry_date: datetime
    exit_date: Optional[datetime] = None
    status: str
    profit_loss: Optional[float] = None
    profit_loss_percent: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaperHoldingResponse(BaseModel):
    id: str
    portfolio_id: str
    symbol: str
    quantity: float
    buy_price: float
    current_price: float
    total_cost: float
    current_value: float
    profit_loss: float
    profit_loss_percent: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaperPortfolioResponse(BaseModel):
    id: str
    user_id: str
    starting_capital: float
    current_cash: float
    total_invested: float
    current_value: float
    total_profit_loss: float
    total_profit_loss_percent: float
    holdings: List[PaperHoldingResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BacktestResultResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    strategy_name: str
    start_date: datetime
    end_date: datetime
    initial_capital: float
    final_value: float
    total_profit_loss: float
    total_profit_loss_percent: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: Optional[float] = None
    max_drawdown: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BacktestRequest(BaseModel):
    symbol: str
    strategy_name: str  # "moving_average_crossover", "rsi_strategy", "macd_strategy"
    start_date: datetime
    end_date: datetime
    initial_capital: float = 100000
    fast_ma: int = 10  # for moving average strategy
    slow_ma: int = 30  # for moving average strategy
    rsi_oversold: int = 30  # for RSI strategy
    rsi_overbought: int = 70  # for RSI strategy


class TechnicalAnalysisRequest(BaseModel):
    symbol: str
    period: int = 14


# Tax Schemas
class TaxDeductionCreate(BaseModel):
    deduction_type: str  # "80C", "80D", "HRA", "Standard"
    category: str
    amount: float
    proof_url: Optional[str] = None
    description: Optional[str] = None


class TaxDeductionResponse(TaxDeductionCreate):
    id: str
    user_id: str
    tax_profile_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxProfileCreate(BaseModel):
    financial_year: str
    income_type: str  # "salary", "self_employed", "mixed"
    total_income: float
    preferred_regime: str = "new"


class TaxProfileResponse(BaseModel):
    id: str
    user_id: str
    financial_year: str
    income_type: str
    total_income: float
    total_deductions: float
    taxable_income: float
    preferred_regime: str
    created_at: datetime
    updated_at: datetime
    deductions: List[TaxDeductionResponse]

    class Config:
        from_attributes = True


class TaxCalculationRequest(BaseModel):
    financial_year: str
    income_type: str
    salary_income: float = 0
    business_income: float = 0
    other_income: float = 0
    deductions: Optional[float] = 0


class TaxCalculationResponse(BaseModel):
    financial_year: str
    total_income: float
    total_deductions: float
    taxable_income: float
    tax_liability: float
    regime: str
    breakup: Optional[dict] = None


class RegimeComparisonRequest(BaseModel):
    financial_year: str
    total_income: float
    deductions: float = 0
    hra_amount: Optional[float] = 0


class RegimeComparisonResponse(BaseModel):
    financial_year: str
    total_income: float
    old_regime_tax: float
    new_regime_tax: float
    difference: float
    recommended_regime: str
    explanation: str


class DeductionSuggestionRequest(BaseModel):
    financial_year: str
    income_type: str
    salary: float
    has_hra: bool = False
    has_health_insurance: bool = False
    has_life_insurance: bool = False


class DeductionSuggestionResponse(BaseModel):
    applicable_deductions: List[dict]
    total_possible_deduction: float
    explanation: str


class TaxFilingSummaryRequest(BaseModel):
    financial_year: str
    user_id: str


class TaxFilingSummaryResponse(BaseModel):
    financial_year: str
    total_income: float
    total_deductions: float
    taxable_income: float
    tax_liability: float
    regime_used: str
    deductions_list: List[TaxDeductionResponse]
    filing_checklist: List[str]
    ready_to_file: bool


# Generic Response
class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str
    data: Optional[dict] = None


# ==================== PHASE 6: FRAUD DETECTION SYSTEM SCHEMAS ====================

# Evidence Schemas
class EvidenceCreate(BaseModel):
    investigation_id: str
    case_id: Optional[str] = None
    file_type: str  # receipt, document, screenshot, email, other
    file_name: str
    description: Optional[str] = None


class EvidenceResponse(BaseModel):
    id: str
    investigation_id: str
    case_id: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    status: str
    fraud_score: float
    upload_timestamp: datetime
    extracted_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EvidenceListResponse(BaseModel):
    items: List[EvidenceResponse]
    total: int
    limit: int
    offset: int


# Evidence Analysis Schemas
class AnalysisIndicator(BaseModel):
    indicator: str
    type: str
    confidence: float
    details: Optional[str] = None


class AnomalyFlag(BaseModel):
    anomaly: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    details: Optional[str] = None


class PatternMatch(BaseModel):
    pattern_id: str
    pattern_name: str
    match_confidence: float
    matches: List[str]


class AnalysisResultResponse(BaseModel):
    evidence_id: str
    analysis_type: str
    indicators_found: List[AnalysisIndicator]
    confidence_score: float
    anomaly_flags: List[AnomalyFlag]
    matched_patterns: List[PatternMatch]
    risk_level: str
    analyzed_at: datetime


class AnalysisRequest(BaseModel):
    evidence_id: str
    investigation_id: str
    analysis_type: str = "all"  # text_analysis, metadata_analysis, pattern_match, all


# Risk Score Schemas
class RiskScoreComponent(BaseModel):
    evidence_score: float
    pattern_match_score: float
    anomaly_score: float
    correlation_score: float
    temporal_score: float


class RiskScoreResponse(BaseModel):
    investigation_id: str
    overall_risk: float
    risk_level: str
    confidence: float
    component_scores: RiskScoreComponent
    calculation_details: Optional[dict] = None
    reasoning: Optional[str] = None
    calculated_at: datetime


class RiskScoreRequest(BaseModel):
    investigation_id: str
    include_components: bool = True


# Fraud Pattern Schemas
class FraudPatternResponse(BaseModel):
    id: str
    pattern_name: str
    category: str
    indicators: List[str]
    risk_score_base: float
    severity: str
    cases_matched: int
    success_rate: float

    class Config:
        from_attributes = True


class FraudPatternsListResponse(BaseModel):
    items: List[FraudPatternResponse]
    total: int


class PatternTestRequest(BaseModel):
    pattern_id: str
    text: str


class PatternTestResponse(BaseModel):
    pattern_id: str
    pattern_name: str
    matches: List[str]
    match_count: int
    confidence: float
    indicator_breakdown: List[dict]


# Investigation Schemas (Enhanced)
class InvestigationCreateFraud(BaseModel):
    title: str
    description: Optional[str] = None
    case_type: str = "suspicious_transaction"  # suspicious_transaction, phishing_report, identity_concern, payment_issue
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL


class TimelineEventResponse(BaseModel):
    id: str
    event_type: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    created_by: str
    severity: Optional[str] = None


class CaseFindResponse(BaseModel):
    id: str
    investigation_id: str
    finding_text: str
    finding_type: str
    severity: str
    fraud_confidence: float
    created_at: datetime


class InvestigationDetailResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    risk_level: str
    evidence_collection: List[EvidenceResponse]
    case_findings: List[CaseFindResponse]
    risk_score: Optional[RiskScoreResponse] = None
    timeline: List[TimelineEventResponse]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None


class InvestigationUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    findings_summary: Optional[str] = None
    conclusion: Optional[str] = None


class InvestigationsListResponse(BaseModel):
    items: List[dict]
    total: int
    active_count: int
    high_risk_count: int


class FindingCreateRequest(BaseModel):
    finding_text: str
    finding_type: str
    severity: str = "MEDIUM"
    fraud_confidence: Optional[float] = 0
    related_evidence_ids: Optional[List[str]] = None


# Pre-Payment Checkpoint Schemas
class CheckpointValidationRequest(BaseModel):
    transaction_id: str
    transaction_amount: float
    merchant_id: str
    merchant_name: str
    transaction_type: str


class ValidationResult(BaseModel):
    rule_name: str
    passed: bool
    reason: Optional[str] = None


class CheckpointValidationResponse(BaseModel):
    checkpoint_id: str
    transaction_id: str
    status: str  # approved, blocked, requires_confirmation
    risk_score: float
    risk_level: str
    validation_results: dict
    risk_factors: List[str]
    confirmation_required: bool
    confirmation_token: Optional[str] = None
    confirmation_expires_at: Optional[datetime] = None
    checked_at: datetime


class CheckpointConfirmRequest(BaseModel):
    checkpoint_id: str
    confirmation_token: str
    user_ip: str


class CheckpointConfirmResponse(BaseModel):
    checkpoint_id: str
    status: str
    confirmed_at: datetime
    confirmation_method: str
    expires_in_seconds: int


class CheckpointResponse(BaseModel):
    id: str
    transaction_id: str
    status: str
    risk_score: float
    risk_level: str
    checked_at: datetime
    confirmed_at: Optional[datetime] = None
    confirmation_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ValidationRuleResponse(BaseModel):
    id: str
    rule_name: str
    category: str
    description: str
    threshold_value: Optional[float] = None
    action: str
    priority: int
    true_positives: int
    false_positives: int
    status: str

    class Config:
        from_attributes = True


class ValidationRulesListResponse(BaseModel):
    items: List[ValidationRuleResponse]


# FINSHIELD RESCUE Schemas
class RescueCaseCreateRequest(BaseModel):
    investigation_id: Optional[str] = None
    incident_type: str  # fraudulent_transaction, unauthorized_access, account_takeover, refund_issue
    incident_description: str
    incident_date: datetime
    payment_method: str  # credit_card, debit_card, net_banking, upi, wallet
    merchant_name: str
    transaction_id: Optional[str] = None
    disputed_amount: float
    currency: str = "INR"


class CommunicationLogResponse(BaseModel):
    id: str
    rescue_case_id: str
    communication_type: str
    direction: str
    message: str
    sent_at: datetime
    status: str

    class Config:
        from_attributes = True


class RecoveryTrackingResponse(BaseModel):
    id: str
    event_type: str
    recovery_amount: float
    recovery_date: datetime
    status: str
    reference_number: str

    class Config:
        from_attributes = True


class RescueCaseResponse(BaseModel):
    id: str
    case_id: str
    user_id: str
    incident_type: str
    incident_date: datetime
    incident_description: str
    disputed_amount: float
    currency: str
    payment_method: str
    merchant_name: str
    filing_status: str
    filing_date: Optional[datetime] = None
    dispute_ref_number: Optional[str] = None
    chargeback_filed: bool
    chargeback_ref_number: Optional[str] = None
    chargeback_status: Optional[str] = None
    recovery_status: str
    recovered_amount: float
    recovery_date: Optional[datetime] = None
    case_status: str
    resolution_type: Optional[str] = None
    resolution_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    communication_logs: List[CommunicationLogResponse]
    recovery_tracking: List[RecoveryTrackingResponse]
    next_action_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== PHASE 8: AI ASSISTANT SCHEMAS ====================

class ChatMessageCreate(BaseModel):
    user_message: str
    language: str = "english"


class ChatMessageResponse(BaseModel):
    id: str
    user_message: str
    assistant_response: str
    detected_intent: Optional[str] = None
    intent_confidence: float = 0.0
    module_routed_to: Optional[str] = None
    language: str
    has_action: bool = False
    action_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationSessionCreate(BaseModel):
    title: str
    language: str = "english"


class ConversationSessionResponse(BaseModel):
    id: str
    title: str
    language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    language: str
    messages: List[ChatMessageResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RescueCaseListResponse(BaseModel):
    items: List[dict]
    total: int
    open_cases: int
    total_disputed_amount: float
    total_recovered_amount: float


class RescueCaseUpdateRequest(BaseModel):
    case_status: Optional[str] = None
    filing_status: Optional[str] = None
    chargeback_filed: Optional[bool] = None
    chargeback_ref_number: Optional[str] = None
    resolution_type: Optional[str] = None
    resolution_notes: Optional[str] = None


class DisputeFilingRequest(BaseModel):
    dispute_reason: str
    evidence_ids: Optional[List[str]] = None
    bank_details: Optional[dict] = None


class DisputeFilingResponse(BaseModel):
    case_id: str
    filing_status: str
    dispute_ref_number: str
    filing_date: datetime
    expected_resolution_date: datetime
    next_steps: List[str]
    confirmation_sent_to: str


class CommunicationAddRequest(BaseModel):
    communication_type: str  # email, sms, in_app, phone, letter
    direction: str  # outgoing, incoming
    message: str
    recipient_type: str  # user, bank, merchant, support
    external_ref: Optional[str] = None


class CommunicationAddResponse(BaseModel):
    id: str
    rescue_case_id: str
    communication_type: str
    direction: str
    status: str
    sent_at: datetime


class RecoveryAddRequest(BaseModel):
    event_type: str  # refund_initiated, refund_processed, chargeback_won, partial_recovery, recovery_failed
    recovery_amount: float
    recovery_date: datetime
    reference_number: str
    bank_reference: Optional[str] = None


class RecoveryAddResponse(BaseModel):
    id: str
    rescue_case_id: str
    event_type: str
    recovery_amount: float
    recovery_date: datetime
    status: str
    created_at: datetime


class RescueResolveRequest(BaseModel):
    resolution_type: str  # refund, reversal, replacement, writeoff
    resolution_notes: str
    final_recovery_amount: float
    closure_reason: Optional[str] = None


class RescueResolveResponse(BaseModel):
    case_id: str
    case_status: str
    resolution_type: str
    recovery_status: str
    total_recovered: float
    resolution_date: datetime
    closure_communication_sent: bool


# ==================== PHASE 7: SMALL BUSINESS FINANCE SCHEMAS ====================

class InvoiceItem(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit_price: float
    tax_rate: float = 18


class GSTInvoiceCreate(BaseModel):
    invoice_number: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    customer_name: str
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[InvoiceItem]
    gst_rate: float = 18


class GSTInvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    customer_name: str
    subtotal: float
    sgst_amount: float
    cgst_amount: float
    igst_amount: float
    total_amount: float
    gst_rate: float
    payment_status: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class IncomeExpenseCreate(BaseModel):
    transaction_date: datetime
    amount: float
    transaction_type: str  # income, expense
    category: str
    subcategory: Optional[str] = None
    description: str
    reference_number: Optional[str] = None
    payment_method: Optional[str] = None
    includes_gst: bool = False
    gst_rate: Optional[float] = None


class IncomeExpenseResponse(IncomeExpenseCreate):
    id: str
    gst_amount: float
    reconciled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CashFlowForecastCreate(BaseModel):
    start_month: str  # YYYY-MM
    end_month: str    # YYYY-MM
    growth_rate: float = 0
    seasonality_factor: float = 1.0
    assumptions: Optional[dict] = None


class CashFlowForecastData(BaseModel):
    month: str
    opening_balance: float
    inflows: float
    outflows: float
    closing_balance: float


class CashFlowForecastResponse(BaseModel):
    id: str
    forecast_date: datetime
    start_month: str
    end_month: str
    forecast_months: int
    forecast_data: List[CashFlowForecastData]
    total_inflows: float
    total_outflows: float
    net_cash_flow: float
    ending_balance: float
    best_case: Optional[dict] = None
    base_case: Optional[dict] = None
    worst_case: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EMIPlanCreate(BaseModel):
    loan_name: str
    principal_amount: float
    annual_interest_rate: float
    tenure_months: int
    start_date: datetime


class EMIScheduleItem(BaseModel):
    payment_number: int
    due_date: datetime
    opening_balance: float
    emi_amount: float
    principal_paid: float
    interest_paid: float
    closing_balance: float


class EMIPlanResponse(BaseModel):
    id: str
    loan_name: str
    principal_amount: float
    annual_interest_rate: float
    tenure_months: int
    monthly_emi: float
    total_amount_payable: float
    total_interest: float
    start_date: datetime
    next_emi_date: Optional[datetime] = None
    amount_paid: float
    remaining_amount: float
    status: str
    emi_schedule: Optional[List[EMIScheduleItem]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
