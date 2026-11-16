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


# Generic Response
class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str
    data: Optional[dict] = None
