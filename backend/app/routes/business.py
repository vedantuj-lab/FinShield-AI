"""
Small business finance routes
"""

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import json

from app.database import get_db
from app.models import (
    User, BusinessProfile, GSTInvoice, IncomeExpense, CashFlowForecast, EMIPlan
)
from app.schemas import (
    BusinessProfileCreate, BusinessProfileResponse,
    GSTInvoiceCreate, GSTInvoiceResponse,
    IncomeExpenseCreate, IncomeExpenseResponse,
    CashFlowForecastCreate, CashFlowForecastResponse, CashFlowForecastData,
    EMIPlanCreate, EMIPlanResponse, EMIScheduleItem
)
from app.security import decode_token, generate_id
from fastapi import HTTPException, status

router = APIRouter()


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


def get_user_business_profile(user_id: str, db: Session):
    """Get user's business profile"""
    profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return profile


def calculate_gst(amount: float, gst_rate: float):
    """Calculate GST amounts (SGST, CGST for intra-state, IGST for inter-state)"""
    gst_amount = (amount * gst_rate) / 100
    sgst_amount = gst_amount / 2
    cgst_amount = gst_amount / 2
    igst_amount = 0
    return sgst_amount, cgst_amount, igst_amount, gst_amount


# ==================== BUSINESS PROFILE ====================

@router.post("/profile", response_model=BusinessProfileResponse)
async def create_business_profile(
    profile: BusinessProfileCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create or update business profile"""
    
    # Check if profile exists
    existing = db.query(BusinessProfile).filter(BusinessProfile.user_id == current_user.id).first()
    if existing:
        existing.business_name = profile.business_name
        existing.category = profile.category
        existing.contact_email = profile.contact_email
        existing.contact_phone = profile.contact_phone
        existing.gst_number = profile.gst_number
        existing.financial_year = profile.financial_year
        db.commit()
        db.refresh(existing)
        return BusinessProfileResponse.from_orm(existing)
    
    business = BusinessProfile(
        id=generate_id(),
        user_id=current_user.id,
        business_name=profile.business_name,
        category=profile.category,
        contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        gst_number=profile.gst_number,
        financial_year=profile.financial_year,
    )
    
    db.add(business)
    db.commit()
    db.refresh(business)
    
    return BusinessProfileResponse.from_orm(business)


@router.get("/profile", response_model=BusinessProfileResponse)
async def get_business_profile(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get business profile"""
    profile = get_user_business_profile(current_user.id, db)
    return BusinessProfileResponse.from_orm(profile)


# ==================== GST INVOICES ====================

@router.post("/invoices", response_model=GSTInvoiceResponse)
async def create_gst_invoice(
    invoice_data: GSTInvoiceCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create a GST invoice"""
    
    business_profile = get_user_business_profile(current_user.id, db)
    
    # Calculate totals
    subtotal = sum(item.quantity * item.unit_price for item in invoice_data.items)
    sgst_amount, cgst_amount, igst_amount, total_gst = calculate_gst(subtotal, invoice_data.gst_rate)
    total_amount = subtotal + total_gst
    
    invoice = GSTInvoice(
        id=generate_id(),
        user_id=current_user.id,
        business_profile_id=business_profile.id,
        invoice_number=invoice_data.invoice_number,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        customer_name=invoice_data.customer_name,
        customer_gstin=invoice_data.customer_gstin,
        customer_address=invoice_data.customer_address,
        customer_phone=invoice_data.customer_phone,
        customer_email=invoice_data.customer_email,
        items=json.dumps([item.dict() for item in invoice_data.items]),
        subtotal=subtotal,
        sgst_amount=sgst_amount,
        cgst_amount=cgst_amount,
        igst_amount=igst_amount,
        gst_rate=invoice_data.gst_rate,
        total_amount=total_amount,
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return GSTInvoiceResponse.from_orm(invoice)


@router.get("/invoices", response_model=List[GSTInvoiceResponse])
async def list_gst_invoices(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all GST invoices for current user"""
    
    invoices = db.query(GSTInvoice).filter(
        GSTInvoice.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [GSTInvoiceResponse.from_orm(inv) for inv in invoices]


@router.get("/invoices/{invoice_id}", response_model=GSTInvoiceResponse)
async def get_gst_invoice(
    invoice_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get a specific GST invoice"""
    
    invoice = db.query(GSTInvoice).filter(
        GSTInvoice.id == invoice_id,
        GSTInvoice.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return GSTInvoiceResponse.from_orm(invoice)


# ==================== INCOME & EXPENSE TRACKING ====================

@router.post("/income-expense", response_model=IncomeExpenseResponse)
async def track_income_expense(
    transaction: IncomeExpenseCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Track income or expense transaction"""
    
    business_profile = get_user_business_profile(current_user.id, db)
    
    # Calculate GST if applicable
    gst_amount = 0
    if transaction.includes_gst and transaction.gst_rate:
        gst_amount = (transaction.amount * transaction.gst_rate) / 100
    
    income_expense = IncomeExpense(
        id=generate_id(),
        user_id=current_user.id,
        business_profile_id=business_profile.id,
        transaction_date=transaction.transaction_date,
        amount=transaction.amount,
        transaction_type=transaction.transaction_type,
        category=transaction.category,
        subcategory=transaction.subcategory,
        description=transaction.description,
        reference_number=transaction.reference_number,
        payment_method=transaction.payment_method,
        includes_gst=transaction.includes_gst,
        gst_amount=gst_amount,
        gst_rate=transaction.gst_rate,
    )
    
    db.add(income_expense)
    db.commit()
    db.refresh(income_expense)
    
    return IncomeExpenseResponse.from_orm(income_expense)


@router.get("/income-expense", response_model=List[IncomeExpenseResponse])
async def list_income_expense(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
    transaction_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List income/expense transactions"""
    
    query = db.query(IncomeExpense).filter(IncomeExpense.user_id == current_user.id)
    
    if transaction_type:
        query = query.filter(IncomeExpense.transaction_type == transaction_type)
    if category:
        query = query.filter(IncomeExpense.category == category)
    
    transactions = query.offset(skip).limit(limit).all()
    
    return [IncomeExpenseResponse.from_orm(t) for t in transactions]


@router.get("/income-expense/summary")
async def get_income_expense_summary(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
    year_month: str = Query(None),
):
    """Get summary of income and expenses"""
    
    query = db.query(IncomeExpense).filter(IncomeExpense.user_id == current_user.id)
    
    if year_month:
        # Filter by year-month (e.g., "2024-11")
        query = query.filter(
            IncomeExpense.transaction_date >= datetime.strptime(year_month, "%Y-%m"),
            IncomeExpense.transaction_date < datetime.strptime(year_month, "%Y-%m") + timedelta(days=32)
        )
    
    transactions = query.all()
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
    total_expense = sum(t.amount for t in transactions if t.transaction_type == "expense")
    total_gst = sum(t.gst_amount for t in transactions)
    
    # Group by category
    by_category = {}
    for t in transactions:
        key = f"{t.transaction_type}_{t.category}"
        if key not in by_category:
            by_category[key] = 0
        by_category[key] += t.amount
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "total_gst": total_gst,
        "by_category": by_category,
        "transaction_count": len(transactions),
    }


# ==================== CASH FLOW FORECASTING ====================

@router.post("/cash-flow", response_model=CashFlowForecastResponse)
async def generate_cash_flow_forecast(
    forecast_request: CashFlowForecastCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Generate cash flow forecast"""
    
    business_profile = get_user_business_profile(current_user.id, db)
    
    # Get historical transactions
    start_date = datetime.strptime(forecast_request.start_month, "%Y-%m")
    end_date = datetime.strptime(forecast_request.end_month, "%Y-%m")
    months_delta = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    
    historical_transactions = db.query(IncomeExpense).filter(
        IncomeExpense.user_id == current_user.id,
        IncomeExpense.business_profile_id == business_profile.id
    ).all()
    
    # Calculate monthly averages
    monthly_data = {}
    for t in historical_transactions:
        month_key = t.transaction_date.strftime("%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"inflows": 0, "outflows": 0}
        
        if t.transaction_type == "income":
            monthly_data[month_key]["inflows"] += t.amount
        else:
            monthly_data[month_key]["outflows"] += t.amount
    
    # Generate forecast
    forecast_data = []
    current_balance = 0
    
    current = start_date
    while current <= end_date:
        month_key = current.strftime("%m")
        month_avg = monthly_data.get(month_key, {"inflows": 0, "outflows": 0})
        
        # Apply growth rate and seasonality
        inflows = month_avg["inflows"] * (1 + forecast_request.growth_rate / 100) * forecast_request.seasonality_factor
        outflows = month_avg["outflows"] * (1 + forecast_request.growth_rate / 100) * forecast_request.seasonality_factor
        
        closing_balance = current_balance + inflows - outflows
        
        forecast_data.append({
            "month": current.strftime("%Y-%m"),
            "opening_balance": current_balance,
            "inflows": round(inflows, 2),
            "outflows": round(outflows, 2),
            "closing_balance": round(closing_balance, 2),
        })
        
        current_balance = closing_balance
        current = current.replace(day=1) + timedelta(days=32)
        current = current.replace(day=1)
    
    total_inflows = sum(d["inflows"] for d in forecast_data)
    total_outflows = sum(d["outflows"] for d in forecast_data)
    
    forecast = CashFlowForecast(
        id=generate_id(),
        user_id=current_user.id,
        business_profile_id=business_profile.id,
        start_month=forecast_request.start_month,
        end_month=forecast_request.end_month,
        forecast_months=months_delta + 1,
        forecast_data=json.dumps(forecast_data),
        growth_rate=forecast_request.growth_rate,
        seasonality_factor=forecast_request.seasonality_factor,
        assumptions=json.dumps(forecast_request.assumptions or {}),
        total_inflows=total_inflows,
        total_outflows=total_outflows,
        net_cash_flow=total_inflows - total_outflows,
        ending_balance=forecast_data[-1]["closing_balance"] if forecast_data else 0,
    )
    
    db.add(forecast)
    db.commit()
    db.refresh(forecast)
    
    # Parse forecast_data back to objects
    forecast_objs = [CashFlowForecastData(**d) for d in forecast_data]
    
    response = CashFlowForecastResponse.from_orm(forecast)
    response.forecast_data = forecast_objs
    return response


@router.get("/cash-flow", response_model=List[CashFlowForecastResponse])
async def list_cash_flow_forecasts(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all cash flow forecasts"""
    
    forecasts = db.query(CashFlowForecast).filter(
        CashFlowForecast.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    result = []
    for forecast in forecasts:
        response = CashFlowForecastResponse.from_orm(forecast)
        forecast_data = json.loads(forecast.forecast_data) if forecast.forecast_data else []
        response.forecast_data = [CashFlowForecastData(**d) for d in forecast_data]
        result.append(response)
    
    return result


@router.get("/cash-flow/{forecast_id}", response_model=CashFlowForecastResponse)
async def get_cash_flow_forecast(
    forecast_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get a specific cash flow forecast"""
    
    forecast = db.query(CashFlowForecast).filter(
        CashFlowForecast.id == forecast_id,
        CashFlowForecast.user_id == current_user.id
    ).first()
    
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    response = CashFlowForecastResponse.from_orm(forecast)
    forecast_data = json.loads(forecast.forecast_data) if forecast.forecast_data else []
    response.forecast_data = [CashFlowForecastData(**d) for d in forecast_data]
    return response


# ==================== EMI PLANNING ====================

def generate_emi_schedule(principal: float, monthly_rate: float, tenure_months: int, start_date: datetime) -> List[dict]:
    """Generate EMI schedule"""
    if monthly_rate == 0:
        emi = principal / tenure_months
    else:
        emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure_months) / ((1 + monthly_rate) ** tenure_months - 1)
    
    schedule = []
    remaining_balance = principal
    
    for i in range(1, tenure_months + 1):
        interest_paid = remaining_balance * monthly_rate
        principal_paid = emi - interest_paid
        remaining_balance -= principal_paid
        
        due_date = start_date + timedelta(days=30 * i)
        
        schedule.append({
            "payment_number": i,
            "due_date": due_date.isoformat(),
            "opening_balance": round(remaining_balance + principal_paid, 2),
            "emi_amount": round(emi, 2),
            "principal_paid": round(principal_paid, 2),
            "interest_paid": round(interest_paid, 2),
            "closing_balance": round(max(0, remaining_balance), 2),
        })
    
    return schedule


@router.post("/emi", response_model=EMIPlanResponse)
async def create_emi_plan(
    emi_request: EMIPlanCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create an EMI plan"""
    
    business_profile = get_user_business_profile(current_user.id, db)
    
    # Calculate EMI
    monthly_rate = emi_request.annual_interest_rate / (100 * 12)
    
    if monthly_rate == 0:
        monthly_emi = emi_request.principal_amount / emi_request.tenure_months
    else:
        monthly_emi = (emi_request.principal_amount * monthly_rate * (1 + monthly_rate) ** emi_request.tenure_months) / ((1 + monthly_rate) ** emi_request.tenure_months - 1)
    
    total_amount_payable = monthly_emi * emi_request.tenure_months
    total_interest = total_amount_payable - emi_request.principal_amount
    
    # Generate schedule
    schedule = generate_emi_schedule(
        emi_request.principal_amount,
        monthly_rate,
        emi_request.tenure_months,
        emi_request.start_date
    )
    
    emi_plan = EMIPlan(
        id=generate_id(),
        user_id=current_user.id,
        business_profile_id=business_profile.id,
        loan_name=emi_request.loan_name,
        principal_amount=emi_request.principal_amount,
        annual_interest_rate=emi_request.annual_interest_rate,
        tenure_months=emi_request.tenure_months,
        monthly_emi=monthly_emi,
        total_amount_payable=total_amount_payable,
        total_interest=total_interest,
        start_date=emi_request.start_date,
        next_emi_date=emi_request.start_date + timedelta(days=30),
        remaining_amount=total_amount_payable,
        emi_schedule=json.dumps(schedule),
    )
    
    db.add(emi_plan)
    db.commit()
    db.refresh(emi_plan)
    
    response = EMIPlanResponse.from_orm(emi_plan)
    response.emi_schedule = [EMIScheduleItem(**item) for item in schedule]
    return response


@router.get("/emi", response_model=List[EMIPlanResponse])
async def list_emi_plans(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all EMI plans"""
    
    query = db.query(EMIPlan).filter(EMIPlan.user_id == current_user.id)
    
    if status:
        query = query.filter(EMIPlan.status == status)
    
    plans = query.offset(skip).limit(limit).all()
    
    result = []
    for plan in plans:
        response = EMIPlanResponse.from_orm(plan)
        schedule = json.loads(plan.emi_schedule) if plan.emi_schedule else []
        response.emi_schedule = [EMIScheduleItem(**item) for item in schedule]
        result.append(response)
    
    return result


@router.get("/emi/{plan_id}", response_model=EMIPlanResponse)
async def get_emi_plan(
    plan_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get a specific EMI plan"""
    
    plan = db.query(EMIPlan).filter(
        EMIPlan.id == plan_id,
        EMIPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="EMI plan not found")
    
    response = EMIPlanResponse.from_orm(plan)
    schedule = json.loads(plan.emi_schedule) if plan.emi_schedule else []
    response.emi_schedule = [EMIScheduleItem(**item) for item in schedule]
    return response
