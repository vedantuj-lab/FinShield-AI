"""
Investment and portfolio routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import math

from app.database import get_db
from app.models import Investment, User, Portfolio, PortfolioHolding, EducationResource
from app.schemas import (
    InvestmentCreate, InvestmentResponse, PortfolioHoldingCreate, 
    PortfolioHoldingResponse, PortfolioResponse, EducationResourceResponse
)
from app.security import decode_token, generate_id

router = APIRouter()


# Request/Response Schemas
class Holding(BaseModel):
    name: str
    current_value: float
    category: str
    sector: Optional[str] = None


class AnalyzePortfolioRequest(BaseModel):
    holdings: List[Holding]


class SIPCalculatorRequest(BaseModel):
    monthly_investment: float
    years: float
    annual_return: float


class FDCalculatorRequest(BaseModel):
    principal: float
    years: float
    rate: float


class LumpsumCalculatorRequest(BaseModel):
    principal: float
    years: float
    annual_return: float


class GoalCalculatorRequest(BaseModel):
    target_amount: float
    years: float
    expected_return: float


class CompoundInterestRequest(BaseModel):
    principal: float
    annual_rate: float
    years: float
    compounds_per_year: int = 12  # Monthly


class RetirementPlanRequest(BaseModel):
    current_age: int
    retirement_age: int
    monthly_expense: float
    annual_inflation: float
    annual_return: float
    current_savings: float


def get_current_user_from_header(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get current user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user


# ==================== Portfolio Management ====================

@router.get("/portfolio/{user_id}", response_model=Dict[str, Any])
async def get_portfolio(
    user_id: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get user's investment portfolio overview"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    current_user_id = payload.get("sub")
    
    if current_user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Get or create portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        portfolio = Portfolio(id=generate_id(), user_id=user_id)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    
    total_invested = sum(i.purchase_value for i in investments)
    current_value = sum(i.current_value or i.purchase_value for i in investments)
    
    return {
        "portfolio_id": portfolio.id,
        "total_invested": total_invested,
        "current_value": current_value,
        "gain_loss": current_value - total_invested,
        "gain_loss_percentage": ((current_value - total_invested) / total_invested * 100) if total_invested > 0 else 0,
        "investments_count": len(investments),
        "last_updated": portfolio.last_updated.isoformat(),
    }


@router.post("/add-holding", response_model=InvestmentResponse)
async def add_holding(
    investment: InvestmentCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Add investment position to portfolio"""
    
    new_investment = Investment(
        id=generate_id(),
        user_id=current_user.id,
        category=investment.category,
        name=investment.name,
        purchase_value=investment.purchase_value,
        units=investment.units,
        purchase_date=investment.purchase_date,
        current_value=investment.current_value or investment.purchase_value,
        notes=investment.notes,
    )
    
    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    
    return InvestmentResponse.from_orm(new_investment)


@router.post("/holdings", response_model=InvestmentResponse)
async def add_investment(
    investment: InvestmentCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Add a new investment (alias for add-holding)"""
    
    new_investment = Investment(
        id=generate_id(),
        user_id=current_user.id,
        category=investment.category,
        name=investment.name,
        purchase_value=investment.purchase_value,
        units=investment.units,
        purchase_date=investment.purchase_date,
        current_value=investment.current_value or investment.purchase_value,
        notes=investment.notes,
    )
    
    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    
    return InvestmentResponse.from_orm(new_investment)


@router.post("/calculators/sip", response_model=Dict[str, Any])
async def calculate_sip_basic(
    monthly_investment: float,
    annual_return: float,
    years: int,
):
    """Calculate SIP returns (basic endpoint)"""
    
    months = years * 12
    monthly_return = (annual_return / 100) / 12
    
    # Future Value of SIP formula: FV = P * [((1 + r)^n - 1) / r]
    if monthly_return == 0:
        future_value = monthly_investment * months
    else:
        future_value = monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return)
    
    total_invested = monthly_investment * months
    estimated_returns = future_value - total_invested
    
    return {
        "total_invested": round(total_invested, 2),
        "estimated_returns": round(estimated_returns, 2),
        "future_value": round(future_value, 2),
    }


@router.post("/calculators/compound-interest", response_model=Dict[str, Any])
async def calculate_compound_interest(
    request: CompoundInterestRequest,
):
    """Calculate compound interest"""
    
    if request.principal <= 0:
        raise HTTPException(status_code=400, detail="Principal must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    
    # Formula: A = P * (1 + r/n)^(nt)
    # where n is compounds per year
    rate = request.annual_rate / 100
    amount = request.principal * ((1 + rate / request.compounds_per_year) ** (request.compounds_per_year * request.years))
    interest = amount - request.principal
    
    return {
        "principal": request.principal,
        "rate": request.annual_rate,
        "years": request.years,
        "compounds_per_year": request.compounds_per_year,
        "final_amount": round(amount, 2),
        "interest_earned": round(interest, 2),
    }


@router.post("/calculators/retirement-plan", response_model=Dict[str, Any])
async def calculate_retirement_plan(
    request: RetirementPlanRequest,
):
    """Calculate retirement planning"""
    
    if request.current_age >= request.retirement_age:
        raise HTTPException(status_code=400, detail="Retirement age must be greater than current age")
    if request.monthly_expense <= 0:
        raise HTTPException(status_code=400, detail="Monthly expense must be greater than 0")
    
    years_to_retirement = request.retirement_age - request.current_age
    
    # Assume 30 years of retirement
    retirement_years = 30
    
    # Calculate future value of monthly expenses adjusted for inflation
    monthly_expense_at_retirement = request.monthly_expense * ((1 + request.annual_inflation / 100) ** years_to_retirement)
    
    # Calculate corpus needed using annuity formula
    # PV = PMT * [1 - (1 + r)^-n] / r
    monthly_return = (request.annual_return / 100) / 12
    if monthly_return == 0:
        corpus_needed = monthly_expense_at_retirement * 12 * retirement_years
    else:
        corpus_needed = monthly_expense_at_retirement * 12 * (1 - (1 + monthly_return) ** (-retirement_years * 12)) / monthly_return
    
    # Calculate monthly investment needed
    months_to_retirement = years_to_retirement * 12
    if monthly_return == 0:
        monthly_investment = corpus_needed / months_to_retirement
    else:
        monthly_investment = corpus_needed / (((1 + monthly_return) ** months_to_retirement - 1) / monthly_return)
    
    # Future value of current savings
    future_value_current = request.current_savings * ((1 + request.annual_return / 100) ** years_to_retirement)
    
    # Adjusted monthly investment needed
    corpus_still_needed = max(corpus_needed - future_value_current, 0)
    if corpus_still_needed > 0:
        if monthly_return == 0:
            monthly_investment_adjusted = corpus_still_needed / months_to_retirement
        else:
            monthly_investment_adjusted = corpus_still_needed / (((1 + monthly_return) ** months_to_retirement - 1) / monthly_return)
    else:
        monthly_investment_adjusted = 0
    
    return {
        "years_to_retirement": years_to_retirement,
        "corpus_needed": round(corpus_needed, 2),
        "monthly_expense_at_retirement": round(monthly_expense_at_retirement, 2),
        "monthly_investment_needed": round(monthly_investment_adjusted, 2),
        "future_value_of_current_savings": round(future_value_current, 2),
    }


# ==================== Risk Analysis ====================

def calculate_volatility_estimate(category: str) -> float:
    """Calculate volatility estimate based on category"""
    volatility_map = {
        "Stock": 80,
        "Crypto": 80,
        "MF": 50,
        "SIP": 50,
        "FD": 20,
        "Bond": 20,
        "Index Fund": 50,
        "Equity": 75,
        "Debt": 25,
    }
    return volatility_map.get(category, 50)  # Default to 50 for unknown


def generate_recommendations(concentration_risk: float, diversification_score: float, volatility: float) -> List[str]:
    """Generate recommendations based on risk metrics"""
    recommendations = []
    
    if concentration_risk > 60:
        recommendations.append(
            "Your portfolio has high concentration risk. Consider diversifying across more assets to reduce exposure."
        )
    
    if diversification_score < 40:
        recommendations.append(
            "Your portfolio lacks diversification. Adding more distinct holdings can help balance your risk profile."
        )
    
    if volatility > 70:
        recommendations.append(
            "Your portfolio has high volatility exposure. Consider adding more stable, low-risk investments like bonds or FDs."
        )
    
    if not recommendations:
        recommendations.append("Your portfolio is well-balanced. Continue monitoring for any changes needed.")
    
    return recommendations


@router.post("/calculate-risk", response_model=Dict[str, Any])
async def calculate_portfolio_risk(
    request: AnalyzePortfolioRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Analyze portfolio risk and provide metrics"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if not request.holdings or len(request.holdings) == 0:
        raise HTTPException(status_code=400, detail="At least one holding is required")
    
    # Calculate total value
    total_value = sum(h.current_value for h in request.holdings)
    if total_value <= 0:
        raise HTTPException(status_code=400, detail="Total portfolio value must be greater than 0")
    
    # Calculate concentration risk (percentage of largest holding)
    max_holding = max(h.current_value for h in request.holdings)
    concentration_risk = min((max_holding / total_value) * 100, 100)
    
    # Calculate diversification score (Herfindahl index: 1 - Σ(wi²)) * 100
    herfindahl_index = sum((h.current_value / total_value) ** 2 for h in request.holdings)
    diversification_score = min((1 - herfindahl_index) * 100, 100)
    
    # Calculate weighted average volatility
    volatility_estimate = sum(
        (h.current_value / total_value) * calculate_volatility_estimate(h.category)
        for h in request.holdings
    )
    
    # Calculate risk score using weighted formula
    risk_score = (
        (concentration_risk * 0.4) +
        ((100 - diversification_score) * 0.3) +
        (volatility_estimate * 0.3)
    )
    
    # Determine risk level
    if risk_score <= 25:
        risk_level = "Low"
    elif risk_score <= 50:
        risk_level = "Medium"
    elif risk_score <= 75:
        risk_level = "High"
    else:
        risk_level = "VeryHigh"
    
    # Build holdings analysis
    holdings_analysis = [
        {
            "name": h.name,
            "weight_percent": round((h.current_value / total_value) * 100, 2),
            "category": h.category,
            "value": h.current_value,
        }
        for h in request.holdings
    ]
    
    # Build sector breakdown
    sector_breakdown_dict: Dict[str, Dict[str, Any]] = {}
    for h in request.holdings:
        sector = h.sector or "Uncategorized"
        if sector not in sector_breakdown_dict:
            sector_breakdown_dict[sector] = {"value": 0, "percent": 0}
        sector_breakdown_dict[sector]["value"] += h.current_value
    
    # Calculate percentages for sectors
    sector_breakdown = [
        {
            "sector": sector,
            "value": data["value"],
            "percent": round((data["value"] / total_value) * 100, 2),
        }
        for sector, data in sector_breakdown_dict.items()
    ]
    
    # Generate recommendations
    recommendations = generate_recommendations(concentration_risk, diversification_score, volatility_estimate)
    
    return {
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "concentration_risk": round(concentration_risk, 2),
        "diversification_score": round(diversification_score, 2),
        "volatility_estimate": round(volatility_estimate, 2),
        "holdings_analysis": holdings_analysis,
        "sector_breakdown": sector_breakdown,
        "recommendations": recommendations,
    }


@router.post("/analyze")
async def analyze_portfolio(
    request: AnalyzePortfolioRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Analyze portfolio risk and provide metrics"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if not request.holdings or len(request.holdings) == 0:
        raise HTTPException(status_code=400, detail="At least one holding is required")
    
    # Calculate total value
    total_value = sum(h.current_value for h in request.holdings)
    if total_value <= 0:
        raise HTTPException(status_code=400, detail="Total portfolio value must be greater than 0")
    
    # Calculate concentration risk (percentage of largest holding)
    max_holding = max(h.current_value for h in request.holdings)
    concentration_risk = min((max_holding / total_value) * 100, 100)
    
    # Calculate diversification score (Herfindahl index: 1 - Σ(wi²)) * 100
    herfindahl_index = sum((h.current_value / total_value) ** 2 for h in request.holdings)
    diversification_score = min((1 - herfindahl_index) * 100, 100)
    
    # Calculate weighted average volatility
    volatility_estimate = sum(
        (h.current_value / total_value) * calculate_volatility_estimate(h.category)
        for h in request.holdings
    )
    
    # Calculate risk score using weighted formula
    risk_score = (
        (concentration_risk * 0.4) +
        ((100 - diversification_score) * 0.3) +
        (volatility_estimate * 0.3)
    )
    
    # Determine risk level
    if risk_score <= 25:
        risk_level = "Low"
    elif risk_score <= 50:
        risk_level = "Medium"
    elif risk_score <= 75:
        risk_level = "High"
    else:
        risk_level = "VeryHigh"
    
    # Build holdings analysis
    holdings_analysis = [
        {
            "name": h.name,
            "weight_percent": round((h.current_value / total_value) * 100, 2),
            "category": h.category,
            "value": h.current_value,
        }
        for h in request.holdings
    ]
    
    # Build sector breakdown
    sector_breakdown_dict: Dict[str, Dict[str, Any]] = {}
    for h in request.holdings:
        sector = h.sector or "Uncategorized"
        if sector not in sector_breakdown_dict:
            sector_breakdown_dict[sector] = {"value": 0, "percent": 0}
        sector_breakdown_dict[sector]["value"] += h.current_value
    
    # Calculate percentages for sectors
    sector_breakdown = [
        {
            "sector": sector,
            "value": data["value"],
            "percent": round((data["value"] / total_value) * 100, 2),
        }
        for sector, data in sector_breakdown_dict.items()
    ]
    
    # Generate recommendations
    recommendations = generate_recommendations(concentration_risk, diversification_score, volatility_estimate)
    
    return {
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "concentration_risk": round(concentration_risk, 2),
        "diversification_score": round(diversification_score, 2),
        "volatility_estimate": round(volatility_estimate, 2),
        "holdings_analysis": holdings_analysis,
        "sector_breakdown": sector_breakdown,
        "recommendations": recommendations,
    }


# ==================== Education Resources ====================

@router.get("/education/resources", response_model=List[Dict[str, Any]])
async def get_education_resources(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Fetch investment education resources"""
    
    query = db.query(EducationResource)
    if category:
        query = query.filter(EducationResource.category == category)
    
    resources = query.all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "content": r.content,
            "category": r.category,
            "url": r.url,
            "created_at": r.created_at.isoformat(),
        }
        for r in resources
    ]


# ==================== Legacy Calculator Endpoints ====================

@router.post("/calculators/sip")
async def calculate_sip(
    request: SIPCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate SIP returns"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.monthly_investment <= 0:
        raise HTTPException(status_code=400, detail="Monthly investment must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.annual_return < 0:
        raise HTTPException(status_code=400, detail="Annual return cannot be negative")
    
    months = int(request.years * 12)
    monthly_return = (request.annual_return / 100) / 12
    
    # Future Value of SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    if monthly_return == 0:
        future_value = request.monthly_investment * months
    else:
        future_value = request.monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
    
    total_invested = request.monthly_investment * months
    total_gain = future_value - total_invested
    
    return {
        "maturity_amount": round(future_value, 2),
        "total_invested": round(total_invested, 2),
        "total_gain": round(total_gain, 2),
        "breakdown": {
            "invested": round(total_invested, 2),
            "gained": round(total_gain, 2),
        },
    }


@router.post("/calculators/fd")
async def calculate_fd(
    request: FDCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate FD returns"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.principal <= 0:
        raise HTTPException(status_code=400, detail="Principal must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.rate < 0:
        raise HTTPException(status_code=400, detail="Rate cannot be negative")
    
    # Compound Interest: A = P * (1 + r/100)^t
    maturity_amount = request.principal * ((1 + request.rate / 100) ** request.years)
    interest_earned = maturity_amount - request.principal
    
    return {
        "maturity_amount": round(maturity_amount, 2),
        "interest_earned": round(interest_earned, 2),
        "principal": request.principal,
    }


@router.post("/calculate-sip")
async def calculate_sip_enhanced(
    request: SIPCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate SIP returns (enhanced)"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.monthly_investment <= 0:
        raise HTTPException(status_code=400, detail="Monthly investment must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.annual_return < 0:
        raise HTTPException(status_code=400, detail="Annual return cannot be negative")
    
    months = int(request.years * 12)
    monthly_return = (request.annual_return / 100) / 12
    
    # Future Value of SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    if monthly_return == 0:
        future_value = request.monthly_investment * months
    else:
        future_value = request.monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
    
    total_invested = request.monthly_investment * months
    total_gain = future_value - total_invested
    
    return {
        "maturity_amount": round(future_value, 2),
        "total_invested": round(total_invested, 2),
        "total_gain": round(total_gain, 2),
        "breakdown": {
            "invested": round(total_invested, 2),
            "gained": round(total_gain, 2),
        },
    }


@router.post("/calculate-fd")
async def calculate_fd_enhanced(
    request: FDCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate FD returns (enhanced)"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.principal <= 0:
        raise HTTPException(status_code=400, detail="Principal must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.rate < 0:
        raise HTTPException(status_code=400, detail="Rate cannot be negative")
    
    # Compound Interest: A = P * (1 + r/100)^t
    maturity_amount = request.principal * ((1 + request.rate / 100) ** request.years)
    interest_earned = maturity_amount - request.principal
    
    return {
        "maturity_amount": round(maturity_amount, 2),
        "interest_earned": round(interest_earned, 2),
        "principal": request.principal,
    }


@router.post("/calculate-lumpsum")
async def calculate_lumpsum(
    request: LumpsumCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate lump sum investment returns"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.principal <= 0:
        raise HTTPException(status_code=400, detail="Principal must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.annual_return < 0:
        raise HTTPException(status_code=400, detail="Annual return cannot be negative")
    
    # Formula: FV = P * (1 + r)^t
    annual_return_rate = request.annual_return / 100
    final_amount = request.principal * ((1 + annual_return_rate) ** request.years)
    gain = final_amount - request.principal
    
    return {
        "final_amount": round(final_amount, 2),
        "gain": round(gain, 2),
        "breakdown": {
            "principal": request.principal,
            "gained": round(gain, 2),
        },
    }


@router.post("/calculate-goal")
async def calculate_goal(
    request: GoalCalculatorRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate required monthly investment to reach a goal"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Validate input
    if request.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be greater than 0")
    if request.years <= 0:
        raise HTTPException(status_code=400, detail="Years must be greater than 0")
    if request.expected_return < 0:
        raise HTTPException(status_code=400, detail="Expected return cannot be negative")
    
    months = int(request.years * 12)
    monthly_return = (request.expected_return / 100) / 12
    
    # Formula: PMT = Target / [((1 + r)^n - 1) / r] * (1 + r)
    if monthly_return == 0:
        required_monthly = request.target_amount / months
    else:
        required_monthly = request.target_amount / (
            (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
        )
    
    total_invested = required_monthly * months
    total_gained = request.target_amount - total_invested
    
    return {
        "required_monthly_investment": round(required_monthly, 2),
        "total_invested": round(total_invested, 2),
        "total_gained": round(total_gained, 2),
        "target_amount": request.target_amount,
    }


@router.get("/portfolio")
async def get_portfolio_legacy(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get user's investment portfolio (legacy endpoint)"""
    
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    
    total_invested = sum(i.purchase_value for i in investments)
    current_value = sum(i.current_value or i.purchase_value for i in investments)
    
    return {
        "total_invested": total_invested,
        "current_value": current_value,
        "gain_loss": current_value - total_invested,
        "investments_count": len(investments),
    }

