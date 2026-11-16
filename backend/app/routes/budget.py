"""
Budget and transaction routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import csv
import io
from datetime import datetime

from app.database import get_db
from app.models import Transaction, Budget, User
from app.schemas import TransactionCreate, TransactionResponse, BudgetResponse
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


@router.get("/summary")
async def get_budget_summary(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get budget summary for current user"""
    
    # Get income and expenses
    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "income",
    ).scalar() or 0
    
    expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense",
    ).scalar() or 0
    
    # Get category breakdown
    category_data = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense"
    ).group_by(Transaction.category).all()
    
    category_breakdown = [
        {
            "category": cat[0],
            "amount": float(cat[1])
        }
        for cat in category_data
    ]
    
    return {
        "total_income": float(income),
        "total_expenses": float(expenses),
        "balance": float(income - expenses),
        "categoryBreakdown": category_breakdown,
    }


@router.post("/import")
async def import_transactions(
    file: UploadFile = File(...),
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Import transactions from CSV file"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format")
    
    try:
        # Read CSV file
        contents = await file.read()
        text = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(text))
        
        imported_count = 0
        for row in csv_reader:
            try:
                # Parse row
                transaction_date = datetime.strptime(row.get('date', ''), '%Y-%m-%d').date()
                amount = float(row.get('amount', 0))
                description = row.get('description', '')
                category = row.get('category', 'Other')
                transaction_type = row.get('type', 'expense').lower()
                merchant = row.get('merchant', '')
                
                # Validate
                if not description or amount <= 0:
                    continue
                
                if transaction_type not in ['income', 'expense']:
                    transaction_type = 'expense'
                
                # Create transaction
                transaction = Transaction(
                    id=generate_id(),
                    user_id=current_user.id,
                    date=transaction_date,
                    amount=amount,
                    description=description,
                    category=category,
                    transaction_type=transaction_type,
                    merchant=merchant,
                )
                
                db.add(transaction)
                imported_count += 1
            except Exception as e:
                # Skip invalid rows
                continue
        
        db.commit()
        
        return {
            "success": True,
            "count": imported_count,
            "message": f"Successfully imported {imported_count} transactions"
        }
    
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Error importing file: {str(err)}")


@router.post("/transactions", response_model=TransactionResponse)
async def add_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Add a new transaction"""
    
    new_transaction = Transaction(
        id=generate_id(),
        user_id=current_user.id,
        date=transaction.date,
        amount=transaction.amount,
        description=transaction.description,
        category=transaction.category,
        transaction_type=transaction.transaction_type,
        merchant=transaction.merchant,
        reference=transaction.reference,
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return TransactionResponse.from_orm(new_transaction)


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get all transactions for current user"""
    
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return [TransactionResponse.from_orm(t) for t in transactions]


@router.get("/insights")
async def get_spending_insights(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get AI-powered spending insights"""
    
    # Get total income and expenses
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "income",
    ).scalar() or 0
    
    total_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense",
    ).scalar() or 0
    
    # Get top category
    top_category_data = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense"
    ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()
    
    insights = {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "savings_rate": ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0,
    }
    
    if top_category_data:
        insights["top_category"] = {
            "name": top_category_data[0],
            "amount": float(top_category_data[1]),
            "percent": round((top_category_data[1] / total_expenses * 100), 1) if total_expenses > 0 else 0,
        }
    
    return insights
