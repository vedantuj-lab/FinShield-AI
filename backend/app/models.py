"""
SQLAlchemy models for FinShield AI
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, Enum, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="user", cascade="all, delete-orphan")
    business_profiles = relationship("BusinessProfile", back_populates="user", cascade="all, delete-orphan")
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    transaction_type = Column(String, default="expense")  # expense, income, transfer
    merchant = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    month = Column(String, nullable=False)  # YYYY-MM
    total_income = Column(Float, default=0)
    total_budget = Column(Float, nullable=False)
    savings_target = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category_budgets = relationship("CategoryBudget", back_populates="budget", cascade="all, delete-orphan")


class CategoryBudget(Base):
    __tablename__ = "category_budgets"

    id = Column(String, primary_key=True, index=True)
    budget_id = Column(String, ForeignKey("budgets.id"), nullable=False)
    category = Column(String, nullable=False)
    allocated_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    budget = relationship("Budget", back_populates="category_budgets")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)  # FD, SIP, MF, Stock, etc
    name = Column(String, nullable=False)
    purchase_value = Column(Float, nullable=False)
    units = Column(Float, nullable=False)
    purchase_date = Column(DateTime, nullable=False)
    current_value = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="investments")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="open")  # open, closed, resolved
    risk_level = Column(String, default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="investigations")


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    business_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    gst_number = Column(String, nullable=True)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=True)
    financial_year = Column(String, default="2024-25")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="business_profiles")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    total_invested = Column(Float, default=0)
    current_value = Column(Float, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="portfolio")
    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(String, primary_key=True, index=True)
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    sector = Column(String, nullable=True)
    category = Column(String, nullable=False)  # Stock, MutualFund, FD, etc
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")


class EducationResource(Base):
    __tablename__ = "education_resources"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # SIP, Stocks, MutualFunds, etc
    url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== PHASE 4: TRADING & MARKET INSIGHTS ====================

class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(String, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TechnicalIndicator(Base):
    __tablename__ = "technical_indicators"

    id = Column(String, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    ma20 = Column(Float, nullable=True)  # 20-day moving average
    ma50 = Column(Float, nullable=True)  # 50-day moving average
    rsi = Column(Float, nullable=True)   # Relative Strength Index
    macd = Column(Float, nullable=True)  # MACD line
    macd_signal = Column(Float, nullable=True)  # MACD signal line
    bbands_upper = Column(Float, nullable=True)  # Bollinger Bands upper
    bbands_lower = Column(Float, nullable=True)  # Bollinger Bands lower
    created_at = Column(DateTime, default=datetime.utcnow)


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    trade_type = Column(String, nullable=False)  # buy or sell
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    entry_date = Column(DateTime, nullable=False)
    exit_date = Column(DateTime, nullable=True)
    status = Column(String, default="open")  # open or closed
    profit_loss = Column(Float, nullable=True)
    profit_loss_percent = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="paper_trades")


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    strategy_name = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_capital = Column(Float, default=100000)
    final_value = Column(Float, nullable=False)
    total_profit_loss = Column(Float, nullable=False)
    total_profit_loss_percent = Column(Float, nullable=False)
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    win_rate = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    result_json = Column(Text, nullable=True)  # Detailed results as JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="backtest_results")


class PaperPortfolio(Base):
    __tablename__ = "paper_portfolios"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    starting_capital = Column(Float, default=100000)
    current_cash = Column(Float, default=100000)
    total_invested = Column(Float, default=0)
    current_value = Column(Float, default=0)
    total_profit_loss = Column(Float, default=0)
    total_profit_loss_percent = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="paper_portfolio")
    holdings = relationship("PaperHolding", back_populates="portfolio", cascade="all, delete-orphan")


class PaperHolding(Base):
    __tablename__ = "paper_holdings"

    id = Column(String, primary_key=True, index=True)
    portfolio_id = Column(String, ForeignKey("paper_portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    profit_loss = Column(Float, nullable=False)
    profit_loss_percent = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolio = relationship("PaperPortfolio", back_populates="holdings")


# ==================== PHASE 5: TAX ASSISTANT ====================

class TaxProfile(Base):
    __tablename__ = "tax_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    financial_year = Column(String, nullable=False)  # e.g., "2024-25"
    income_type = Column(String, nullable=False)  # "salary", "self_employed", "mixed"
    total_income = Column(Float, default=0)
    total_deductions = Column(Float, default=0)
    taxable_income = Column(Float, default=0)
    preferred_regime = Column(String, default="new")  # "old" or "new"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'financial_year', name='uq_user_financial_year'),
    )

    # Relationships
    user = relationship("User", backref="tax_profiles")
    deductions = relationship("TaxDeduction", back_populates="tax_profile", cascade="all, delete-orphan")


class TaxDeduction(Base):
    __tablename__ = "tax_deductions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    tax_profile_id = Column(String, ForeignKey("tax_profiles.id"), nullable=False)
    deduction_type = Column(String, nullable=False)  # e.g., "80C", "80D", "HRA", "Standard"
    category = Column(String, nullable=False)  # e.g., "Life Insurance", "Medical Insurance", "Rent"
    amount = Column(Float, nullable=False)
    proof_url = Column(String, nullable=True)  # URL to proof document
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # "pending", "verified", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="tax_deductions")
    tax_profile = relationship("TaxProfile", back_populates="deductions")


class TaxRegime(Base):
    __tablename__ = "tax_regimes"

    id = Column(String, primary_key=True, index=True)
    financial_year = Column(String, nullable=False, unique=True)  # e.g., "2024-25"
    regime_type = Column(String, nullable=False)  # "old" or "new"
    slab_structure = Column(Text, nullable=False)  # JSON string with slab structure
    standard_deduction = Column(Float, default=50000)
    standard_deduction_old = Column(Float, default=50000)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


# ==================== PHASE 6: FRAUD DETECTION SYSTEM ====================

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    case_id = Column(String, ForeignKey("rescue_cases.id"), nullable=True)
    
    # File metadata
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # receipt, document, screenshot, email, other
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=True)
    
    # Storage & indexing
    storage_backend = Column(String, default="local")  # s3, local, encrypted
    storage_location = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Content extraction
    extracted_text = Column(Text, nullable=True)
    extracted_metadata = Column(Text, nullable=True)  # JSON
    
    # Status & validation
    status = Column(String, default="uploaded")  # uploaded, processing, verified, rejected
    validation_errors = Column(Text, nullable=True)  # JSON
    
    # Related evidence
    related_evidence_ids = Column(Text, nullable=True)  # JSON array
    fraud_score = Column(Float, default=0)
    
    # Audit
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    investigation = relationship("Investigation", back_populates="evidence")
    user = relationship("User", backref="evidence_uploads")
    analysis = relationship("EvidenceAnalysis", back_populates="evidence", cascade="all, delete-orphan")


class EvidenceAnalysis(Base):
    __tablename__ = "evidence_analysis"

    id = Column(String, primary_key=True, index=True)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=False)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    
    # Analysis results
    analysis_type = Column(String, nullable=False)  # text_analysis, metadata_analysis, pattern_match
    indicators_found = Column(Text, nullable=True)  # JSON
    confidence_score = Column(Float, default=0)
    
    # Risk assessment
    anomaly_flags = Column(Text, nullable=True)  # JSON
    matched_patterns = Column(Text, nullable=True)  # JSON
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Timestamps
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    evidence = relationship("Evidence", back_populates="analysis")


class FraudPattern(Base):
    __tablename__ = "fraud_patterns"

    id = Column(String, primary_key=True, index=True)
    pattern_name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # phishing, payment_fraud, identity_theft, etc
    
    # Pattern definition
    description = Column(Text, nullable=False)
    indicators = Column(Text, nullable=False)  # JSON array of patterns
    risk_score_base = Column(Float, default=50)
    frequency_threshold = Column(Integer, default=1)
    
    # Status & management
    status = Column(String, default="active")  # active, archived, experimental
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Statistics
    cases_matched = Column(Integer, default=0)
    success_rate = Column(Float, default=0)
    false_positive_rate = Column(Float, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_matched = Column(DateTime, nullable=True)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), unique=True, nullable=False)
    
    # Component scores (0-100)
    evidence_score = Column(Float, default=0)
    pattern_match_score = Column(Float, default=0)
    anomaly_score = Column(Float, default=0)
    correlation_score = Column(Float, default=0)
    temporal_score = Column(Float, default=0)
    
    # Aggregate risk
    overall_risk = Column(Float, default=0)
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0)
    
    # Breakdown
    calculation_details = Column(Text, nullable=True)  # JSON
    reasoning = Column(Text, nullable=True)
    
    calculated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    
    # Event info
    event_type = Column(String, nullable=False)  # investigation_opened, evidence_added, etc
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Context
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    severity = Column(String, nullable=True)  # INFO, WARNING, ALERT
    
    # Data reference
    related_entity_id = Column(String, nullable=True)
    related_entity_type = Column(String, nullable=True)  # investigation, evidence, finding
    metadata = Column(Text, nullable=True)  # JSON


class CaseFind(Base):
    __tablename__ = "case_findings"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    
    # Finding content
    finding_text = Column(Text, nullable=False)
    finding_type = Column(String, nullable=False)  # evidence, analysis_result, pattern_match, etc
    
    # Severity & impact
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    fraud_confidence = Column(Float, default=0)
    
    # Connection to evidence
    related_evidence_ids = Column(Text, nullable=True)  # JSON array
    
    # Attribution & tracking
    added_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TransactionCheckpoint(Base):
    __tablename__ = "transaction_checkpoints"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Checkpoint info
    checkpoint_type = Column(String, default="pre_payment_validation")
    status = Column(String, default="pending")  # pending, approved, blocked, escalated, expired
    
    # Validation results
    validation_rules_passed = Column(Text, nullable=True)  # JSON
    validation_rules_failed = Column(Text, nullable=True)  # JSON
    
    # Risk assessment
    risk_score = Column(Float, default=0)
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    risk_reasons = Column(Text, nullable=True)  # JSON
    
    # Transaction details (denormalized)
    transaction_amount = Column(Float, nullable=False)
    transaction_merchant = Column(String, nullable=True)
    transaction_type = Column(String, nullable=True)
    transaction_date = Column(DateTime, nullable=True)
    
    # User confirmation
    confirmation_required = Column(Boolean, default=False)
    confirmation_token = Column(String, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_by_ip = Column(String, nullable=True)
    confirmation_method = Column(String, nullable=True)  # otp, email_link, biometric, manual_review
    
    # Audit
    checked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", backref="checkpoints")


class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(String, primary_key=True, index=True)
    rule_name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # amount, velocity, merchant, pattern, account
    
    # Rule definition
    description = Column(Text, nullable=False)
    rule_logic = Column(Text, nullable=False)  # JSON
    threshold_value = Column(Float, nullable=True)
    action = Column(String, nullable=False)  # flag, block, escalate
    
    # Status
    status = Column(String, default="active")  # active, inactive, testing
    priority = Column(Integer, default=0)
    
    # Statistics
    true_positives = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    true_negatives = Column(Integer, default=0)
    false_negatives = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_updated_by = Column(String, ForeignKey("users.id"), nullable=True)


class RescueCase(Base):
    __tablename__ = "rescue_cases"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=True)
    
    # Incident details
    incident_date = Column(DateTime, nullable=False)
    incident_type = Column(String, nullable=False)  # fraudulent_transaction, unauthorized_access, etc
    incident_description = Column(Text, nullable=False)
    
    # Dispute filing
    filing_status = Column(String, default="draft")  # draft, filed, under_review, appealed
    filing_date = Column(DateTime, nullable=True)
    dispute_ref_number = Column(String, nullable=True)
    
    # Amount involved
    disputed_amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    payment_method = Column(String, nullable=False)  # credit_card, debit_card, net_banking, upi, wallet
    
    # Merchant/Transaction details
    merchant_name = Column(String, nullable=False)
    merchant_id = Column(String, nullable=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    
    # Chargeback management
    chargeback_filed = Column(Boolean, default=False)
    chargeback_date = Column(DateTime, nullable=True)
    chargeback_ref_number = Column(String, nullable=True)
    chargeback_status = Column(String, nullable=True)  # filed, accepted, rejected, appealed, resolved
    chargeback_amount = Column(Float, nullable=True)
    
    # Recovery tracking
    recovery_status = Column(String, default="pending")  # pending, recovered, partial, unsuccessful
    recovered_amount = Column(Float, default=0)
    recovery_date = Column(DateTime, nullable=True)
    recovery_reference = Column(String, nullable=True)
    
    # Case resolution
    case_status = Column(String, default="open")  # open, in_progress, resolved, closed, escalated
    resolution_type = Column(String, nullable=True)  # refund, reversal, replacement, writeoff, pending
    resolution_date = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Communication
    user_contacted = Column(Boolean, default=False)
    last_contact_date = Column(DateTime, nullable=True)
    next_action_date = Column(DateTime, nullable=True)
    
    # Audit & compliance
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    handled_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", backref="rescue_cases", foreign_keys=[user_id])
    investigation = relationship("Investigation", back_populates="rescue_case")
    communication_logs = relationship("CommunicationLog", back_populates="rescue_case", cascade="all, delete-orphan")
    recovery_tracking = relationship("RecoveryTracking", back_populates="rescue_case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", foreign_keys=[Evidence.case_id])


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(String, primary_key=True, index=True)
    rescue_case_id = Column(String, ForeignKey("rescue_cases.id"), nullable=False)
    
    # Communication details
    communication_type = Column(String, nullable=False)  # email, sms, in_app, phone, letter
    direction = Column(String, nullable=False)  # outgoing, incoming
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    
    # Parties involved
    sent_by = Column(String, ForeignKey("users.id"), nullable=False)
    sent_to = Column(String, nullable=False)
    recipient_type = Column(String, nullable=False)  # user, bank, merchant, support
    
    # Timestamps
    sent_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Status
    status = Column(String, default="sent")  # sent, failed, bounced, opened
    
    # Reference
    external_ref = Column(String, nullable=True)
    
    # Relationships
    rescue_case = relationship("RescueCase", back_populates="communication_logs")


class RecoveryTracking(Base):
    __tablename__ = "recovery_tracking"

    id = Column(String, primary_key=True, index=True)
    rescue_case_id = Column(String, ForeignKey("rescue_cases.id"), nullable=False)
    
    # Recovery event
    event_type = Column(String, nullable=False)  # refund_initiated, refund_processed, chargeback_won, etc
    
    # Amount & timing
    recovery_amount = Column(Float, nullable=False)
    recovery_date = Column(DateTime, nullable=False)
    expected_settlement_date = Column(DateTime, nullable=True)
    actual_settlement_date = Column(DateTime, nullable=True)
    
    # Reference & tracking
    reference_number = Column(String, nullable=False)
    bank_reference = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="pending")  # pending, in_progress, completed, failed
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    rescue_case = relationship("RescueCase", back_populates="recovery_tracking")


# Update Investigation model to include new relationships
Investigation.evidence = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
Investigation.case_findings = relationship("CaseFind", cascade="all, delete-orphan")
Investigation.risk_score = relationship("RiskScore", cascade="all, delete-orphan")
Investigation.timeline_events = relationship("TimelineEvent", cascade="all, delete-orphan")
Investigation.rescue_case = relationship("RescueCase", back_populates="investigation", uselist=False)

# Add back reference for Evidence case relationship
Evidence.case = relationship("RescueCase", back_populates="evidence", foreign_keys=[Evidence.case_id])


# ==================== PHASE 7: SMALL BUSINESS FINANCE ====================

class GSTInvoice(Base):
    __tablename__ = "gst_invoices"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    
    # Invoice details
    invoice_number = Column(String, nullable=False, unique=True)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=True)
    
    # Customer/Supplier details
    customer_name = Column(String, nullable=False)
    customer_gstin = Column(String, nullable=True)
    customer_address = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    
    # Invoice items
    items = Column(Text, nullable=False)  # JSON array of items with HSN, description, qty, rate, tax rate
    
    # Amounts
    subtotal = Column(Float, nullable=False)
    sgst_amount = Column(Float, default=0)  # State GST
    cgst_amount = Column(Float, default=0)  # Central GST
    igst_amount = Column(Float, default=0)  # Integrated GST
    gst_rate = Column(Float, nullable=False)  # 5%, 12%, 18%, 28%
    total_amount = Column(Float, nullable=False)
    
    # Payment
    payment_status = Column(String, default="pending")  # pending, partial, paid
    payment_date = Column(DateTime, nullable=True)
    amount_paid = Column(Float, default=0)
    
    # Status & notes
    status = Column(String, default="draft")  # draft, issued, paid, cancelled
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="gst_invoices")


class IncomeExpense(Base):
    __tablename__ = "income_expenses"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    
    # Transaction details
    transaction_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Classification
    transaction_type = Column(String, nullable=False)  # income, expense
    category = Column(String, nullable=False)  # Sales, Salaries, Rent, Utilities, etc
    subcategory = Column(String, nullable=True)
    
    # Details
    description = Column(String, nullable=False)
    reference_number = Column(String, nullable=True)  # Invoice/Receipt number
    
    # Payment method
    payment_method = Column(String, nullable=True)  # Cash, Check, Bank Transfer, Card
    
    # Tax-related
    includes_gst = Column(Boolean, default=False)
    gst_amount = Column(Float, default=0)
    gst_rate = Column(Float, nullable=True)
    
    # Reconciliation
    reconciled = Column(Boolean, default=False)
    reconciled_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="income_expenses")


class CashFlowForecast(Base):
    __tablename__ = "cash_flow_forecasts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    
    # Forecast metadata
    forecast_date = Column(DateTime, default=datetime.utcnow)
    start_month = Column(String, nullable=False)  # YYYY-MM
    end_month = Column(String, nullable=False)    # YYYY-MM
    forecast_months = Column(Integer, nullable=False)
    
    # Forecast data
    forecast_data = Column(Text, nullable=False)  # JSON with monthly forecasts
    # Structure: { "2024-11": { "opening_balance": X, "inflows": X, "outflows": X, "closing_balance": X }, ... }
    
    # Assumptions
    growth_rate = Column(Float, default=0)
    seasonality_factor = Column(Float, default=1.0)
    assumptions = Column(Text, nullable=True)  # JSON with forecast assumptions
    
    # Scenarios
    best_case = Column(Text, nullable=True)  # JSON
    base_case = Column(Text, nullable=True)  # JSON
    worst_case = Column(Text, nullable=True)  # JSON
    
    # Summary
    total_inflows = Column(Float, default=0)
    total_outflows = Column(Float, default=0)
    net_cash_flow = Column(Float, default=0)
    ending_balance = Column(Float, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="cash_flow_forecasts")


class EMIPlan(Base):
    __tablename__ = "emi_plans"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    business_profile_id = Column(String, ForeignKey("business_profiles.id"), nullable=False)
    
    # Loan details
    loan_name = Column(String, nullable=False)
    principal_amount = Column(Float, nullable=False)
    annual_interest_rate = Column(Float, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    
    # EMI calculation
    monthly_emi = Column(Float, nullable=False)
    total_amount_payable = Column(Float, nullable=False)
    total_interest = Column(Float, nullable=False)
    
    # Payment tracking
    start_date = Column(DateTime, nullable=False)
    next_emi_date = Column(DateTime, nullable=True)
    last_payment_date = Column(DateTime, nullable=True)
    amount_paid = Column(Float, default=0)
    remaining_amount = Column(Float, nullable=False)
    
    # Schedule
    emi_schedule = Column(Text, nullable=True)  # JSON array with payment dates and amounts
    
    # Status
    status = Column(String, default="active")  # active, completed, closed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="emi_plans")
