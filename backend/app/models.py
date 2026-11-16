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
