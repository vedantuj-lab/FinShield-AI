"""
Tax calculation and assistance routes - Phase 5
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.database import get_db
from app.models import User, TaxProfile, TaxDeduction, TaxRegime
from app.schemas import (
    TaxCalculationRequest,
    TaxCalculationResponse,
    RegimeComparisonRequest,
    RegimeComparisonResponse,
    DeductionSuggestionRequest,
    DeductionSuggestionResponse,
    TaxDeductionCreate,
    TaxDeductionResponse,
    TaxFilingSummaryRequest,
    TaxFilingSummaryResponse,
)
from app.security import decode_token, generate_id

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


def get_tax_slabs_2024_25():
    """Get tax slabs for FY 2024-25 (both regimes)"""
    old_regime = [
        {"from": 0, "to": 300000, "rate": 0},
        {"from": 300000, "to": 700000, "rate": 5},
        {"from": 700000, "to": 1000000, "rate": 20},
        {"from": 1000000, "to": float('inf'), "rate": 30},
    ]
    
    new_regime = [
        {"from": 0, "to": 300000, "rate": 0},
        {"from": 300000, "to": 700000, "rate": 5},
        {"from": 700000, "to": 1000000, "rate": 10},
        {"from": 1000000, "to": 1250000, "rate": 15},
        {"from": 1250000, "to": 1500000, "rate": 20},
        {"from": 1500000, "to": float('inf'), "rate": 30},
    ]
    
    return {"old": old_regime, "new": new_regime}


def calculate_tax_from_slabs(income: float, slabs: list) -> float:
    """Calculate tax based on slab structure"""
    tax = 0
    
    for slab in slabs:
        if income <= slab["from"]:
            break
        
        slab_end = min(income, slab["to"])
        taxable_in_slab = slab_end - slab["from"]
        tax += taxable_in_slab * (slab["rate"] / 100)
    
    return tax


def get_cess(tax: float) -> float:
    """Calculate health and education cess (4%)"""
    return tax * 0.04


@router.post("/calculate", response_model=TaxCalculationResponse)
async def calculate_tax(
    request: TaxCalculationRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate income tax for given income"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    # Calculate total income
    total_income = request.salary_income + request.business_income + request.other_income
    
    # Apply standard deduction (new regime: 75000, old regime: 50000)
    standard_deduction = 75000  # Using new regime standard deduction
    deductions = request.deductions or standard_deduction
    
    # Calculate taxable income
    taxable_income = max(0, total_income - deductions)
    
    # Get tax slabs
    slabs_data = get_tax_slabs_2024_25()
    new_regime_slabs = slabs_data["new"]
    
    # Calculate tax
    tax_before_cess = calculate_tax_from_slabs(taxable_income, new_regime_slabs)
    cess = get_cess(tax_before_cess)
    total_tax = tax_before_cess + cess
    
    # Build breakup
    breakup = {
        "salary_income": request.salary_income,
        "business_income": request.business_income,
        "other_income": request.other_income,
        "total_income": total_income,
        "deductions": deductions,
        "taxable_income": taxable_income,
        "tax_before_cess": tax_before_cess,
        "cess_4_percent": cess,
        "total_tax": total_tax,
    }
    
    return TaxCalculationResponse(
        financial_year=request.financial_year,
        total_income=total_income,
        standard_deduction=deductions,
        taxable_income=taxable_income,
        tax_liability=total_tax,
        regime="new",
        breakup=breakup,
    )


@router.post("/regime-comparison", response_model=RegimeComparisonResponse)
async def compare_tax_regimes(
    request: RegimeComparisonRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Compare old vs new tax regime for given income"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    slabs_data = get_tax_slabs_2024_25()
    old_regime_slabs = slabs_data["old"]
    new_regime_slabs = slabs_data["new"]
    
    # Old Regime: Standard deduction 50000 + other deductions
    old_regime_deductions = 50000 + request.deductions
    old_taxable_income = max(0, request.total_income - old_regime_deductions)
    old_tax_before_cess = calculate_tax_from_slabs(old_taxable_income, old_regime_slabs)
    old_cess = get_cess(old_tax_before_cess)
    old_regime_tax = old_tax_before_cess + old_cess
    
    # New Regime: Standard deduction 75000, no other deductions
    new_regime_deductions = 75000
    new_taxable_income = max(0, request.total_income - new_regime_deductions)
    new_tax_before_cess = calculate_tax_from_slabs(new_taxable_income, new_regime_slabs)
    new_cess = get_cess(new_tax_before_cess)
    new_regime_tax = new_tax_before_cess + new_cess
    
    # Determine recommended regime
    difference = old_regime_tax - new_regime_tax
    recommended_regime = "old" if old_regime_tax < new_regime_tax else "new"
    
    explanation = ""
    if difference > 0:
        explanation = f"Old regime saves ₹{difference:,.2f} in tax."
    else:
        explanation = f"New regime saves ₹{abs(difference):,.2f} in tax."
    
    return RegimeComparisonResponse(
        financial_year=request.financial_year,
        total_income=request.total_income,
        old_regime_tax=old_regime_tax,
        new_regime_tax=new_regime_tax,
        difference=abs(difference),
        recommended_regime=recommended_regime,
        explanation=explanation,
    )


@router.post("/deductions", response_model=DeductionSuggestionResponse)
async def suggest_applicable_deductions(
    request: DeductionSuggestionRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Suggest applicable tax deductions based on income and situation"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    applicable_deductions = []
    total_possible_deduction = 0
    
    # Standard Deduction
    applicable_deductions.append({
        "type": "Standard Deduction",
        "code": "Section 16(ia)",
        "amount": 75000,
        "description": "Standard deduction under new regime or old regime applicable",
        "required_documents": ["Salary certificate"],
    })
    total_possible_deduction += 75000
    
    # Section 80C - Life Insurance, PPF, ELSS, etc.
    applicable_deductions.append({
        "type": "Life Insurance Premium",
        "code": "Section 80C",
        "max_amount": 150000,
        "description": "Life insurance premiums paid during the year (max ₹1,50,000)",
        "applicable": request.has_life_insurance,
        "required_documents": ["Insurance policy copy", "Premium receipt"],
    })
    if request.has_life_insurance:
        total_possible_deduction += 150000
    
    # Section 80D - Medical Insurance
    applicable_deductions.append({
        "type": "Health Insurance Premium",
        "code": "Section 80D",
        "max_amount": 50000,  # 25000 for employee, 25000 for dependents
        "description": "Health insurance premiums for self and family (max ₹50,000)",
        "applicable": request.has_health_insurance,
        "required_documents": ["Insurance policy", "Premium receipt"],
    })
    if request.has_health_insurance:
        total_possible_deduction += 50000
    
    # HRA - House Rent Allowance
    if request.income_type == "salary" and request.has_hra:
        applicable_deductions.append({
            "type": "House Rent Allowance",
            "code": "Section 10(13A)",
            "description": "HRA exemption (lower of salary/10, rent-10% of salary, or actual HRA)",
            "applicable": True,
            "required_documents": ["Rent receipt", "Landlord PAN", "Lease agreement"],
        })
        # Approximate HRA (typically 10-50% of salary)
        estimated_hra = request.salary * 0.25  # Assuming 25% HRA
        total_possible_deduction += estimated_hra
    
    # Interest on Home Loan
    applicable_deductions.append({
        "type": "Home Loan Interest",
        "code": "Section 24",
        "max_amount": 200000,  # For self-occupied property
        "description": "Interest on home loan for self-occupied property (max ₹2,00,000)",
        "applicable": False,
        "required_documents": ["Home loan statement", "Bank certificate"],
    })
    
    # Education Loan Interest
    applicable_deductions.append({
        "type": "Education Loan Interest",
        "code": "Section 80E",
        "description": "Full interest amount on education loan (no limit)",
        "applicable": False,
        "required_documents": ["Loan statement", "Bank certificate"],
    })
    
    explanation = f"""
    Based on your income profile, you may be eligible for the following deductions:
    
    1. **Standard Deduction**: ₹75,000 is available to all salary earners
    2. **Section 80C**: Up to ₹1,50,000 for life insurance, PPF, ELSS mutual funds, etc.
    3. **Section 80D**: Up to ₹50,000 for health insurance premiums
    4. **HRA**: Applicable if you're paying rent (lower of salary/10, rent-10% of salary, or actual HRA)
    5. **Home Loan Interest**: Up to ₹2,00,000 for self-occupied properties
    6. **Education Loan Interest**: Full interest amount on education loans
    
    Total Possible Deduction: ₹{total_possible_deduction:,.2f}
    
    Note: Deductions are cumulative where applicable. Always maintain supporting documents.
    """
    
    return DeductionSuggestionResponse(
        applicable_deductions=applicable_deductions,
        total_possible_deduction=total_possible_deduction,
        explanation=explanation,
    )


@router.get("/deductions/{user_id}", response_model=List[TaxDeductionResponse])
async def get_user_deductions(
    user_id: str,
    financial_year: str = None,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get all claimed deductions for a user"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    # Only users can view their own deductions, admins can view any
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    query = db.query(TaxDeduction).filter(TaxDeduction.user_id == user_id)
    
    if financial_year:
        tax_profile = db.query(TaxProfile).filter(
            TaxProfile.user_id == user_id,
            TaxProfile.financial_year == financial_year,
        ).first()
        if tax_profile:
            query = query.filter(TaxDeduction.tax_profile_id == tax_profile.id)
    
    deductions = query.all()
    return [TaxDeductionResponse.from_orm(d) for d in deductions]


@router.post("/save-deduction", response_model=TaxDeductionResponse)
async def save_deduction(
    financial_year: str,
    deduction: TaxDeductionCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Save a deduction claim for a user"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    # Get or create tax profile
    tax_profile = db.query(TaxProfile).filter(
        TaxProfile.user_id == current_user.id,
        TaxProfile.financial_year == financial_year,
    ).first()
    
    if not tax_profile:
        tax_profile = TaxProfile(
            id=generate_id(),
            user_id=current_user.id,
            financial_year=financial_year,
            income_type="salary",
            total_income=0,
        )
        db.add(tax_profile)
        db.commit()
        db.refresh(tax_profile)
    
    # Create deduction entry
    new_deduction = TaxDeduction(
        id=generate_id(),
        user_id=current_user.id,
        tax_profile_id=tax_profile.id,
        deduction_type=deduction.deduction_type,
        category=deduction.category,
        amount=deduction.amount,
        proof_url=deduction.proof_url,
        description=deduction.description,
        status="pending",
    )
    
    db.add(new_deduction)
    
    # Update tax profile total deductions
    tax_profile.total_deductions = (
        db.query(TaxDeduction).filter(TaxDeduction.tax_profile_id == tax_profile.id).count() * 50000
        + deduction.amount
    )
    
    db.commit()
    db.refresh(new_deduction)
    
    return TaxDeductionResponse.from_orm(new_deduction)


@router.delete("/deduction/{deduction_id}")
async def delete_deduction(
    deduction_id: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Delete a deduction entry"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    deduction = db.query(TaxDeduction).filter(TaxDeduction.id == deduction_id).first()
    if not deduction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deduction not found")
    
    # Only the user who created it or admin can delete
    if deduction.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    db.delete(deduction)
    db.commit()
    
    return {"message": "Deduction deleted successfully"}


@router.post("/filing-summary", response_model=TaxFilingSummaryResponse)
async def generate_tax_filing_summary(
    request: TaxFilingSummaryRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Generate tax filing summary and checklist"""
    
    current_user = get_current_user_from_header(authorization, db)
    
    # Get tax profile
    tax_profile = db.query(TaxProfile).filter(
        TaxProfile.user_id == current_user.id,
        TaxProfile.financial_year == request.financial_year,
    ).first()
    
    if not tax_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax profile not found")
    
    # Get all deductions
    deductions = db.query(TaxDeduction).filter(
        TaxDeduction.tax_profile_id == tax_profile.id
    ).all()
    
    # Calculate totals
    total_deductions = sum(d.amount for d in deductions)
    taxable_income = max(0, tax_profile.total_income - total_deductions)
    
    # Calculate tax
    slabs_data = get_tax_slabs_2024_25()
    new_regime_slabs = slabs_data["new"]
    tax_before_cess = calculate_tax_from_slabs(taxable_income, new_regime_slabs)
    cess = get_cess(tax_before_cess)
    tax_liability = tax_before_cess + cess
    
    # Filing checklist
    filing_checklist = [
        "Collect all salary certificates from employers",
        "Gather investment proofs for Section 80C deductions",
        "Compile health insurance documents",
        "Prepare HRA deduction documents (if applicable)",
        "Collect home loan interest statements (if applicable)",
        "Organize bank statements for interest income",
        "Prepare education loan documents (if applicable)",
        "Verify TDS certificates from employers/banks",
        "Confirm deduction amounts and claims",
        "Review total income and deductions",
        "File ITR online on e-filing portal",
        "Retain supporting documents for 3 years",
    ]
    
    # Check if ready to file (has basic info and deductions)
    ready_to_file = tax_profile.total_income > 0 and len(deductions) > 0
    
    return TaxFilingSummaryResponse(
        financial_year=request.financial_year,
        total_income=tax_profile.total_income,
        total_deductions=total_deductions,
        taxable_income=taxable_income,
        tax_liability=tax_liability,
        regime_used="new",
        deductions_list=[TaxDeductionResponse.from_orm(d) for d in deductions],
        filing_checklist=filing_checklist,
        ready_to_file=ready_to_file,
    )
