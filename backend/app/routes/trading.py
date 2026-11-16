"""
Trading and market insights routes
Phase 4: Trading & Market Insights Implementation
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db
from app.models import (
    User, MarketData, TechnicalIndicator, PaperTrade, BacktestResult,
    PaperPortfolio, PaperHolding
)
from app.schemas import (
    MarketDataResponse, TechnicalIndicatorResponse, PaperTradeResponse,
    PaperPortfolioResponse, BacktestResultResponse, BacktestRequest,
    TechnicalAnalysisRequest
)
from app.security import decode_token, generate_id
from app.services.technical_indicators import TechnicalIndicators
from app.services.backtester import create_backtest_engine

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


# ==================== MARKET DATA ROUTES ====================

@router.get("/api/market/history/{symbol}", response_model=List[MarketDataResponse])
async def get_historical_data(
    symbol: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 100,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get historical market data for a symbol"""
    current_user = get_current_user_from_header(authorization, db)
    
    query = db.query(MarketData).filter(MarketData.symbol == symbol.upper())
    
    if from_date:
        from_datetime = datetime.fromisoformat(from_date)
        query = query.filter(MarketData.date >= from_datetime)
    
    if to_date:
        to_datetime = datetime.fromisoformat(to_date)
        query = query.filter(MarketData.date <= to_datetime)
    
    data = query.order_by(MarketData.date.desc()).limit(limit).all()
    return list(reversed(data))


@router.get("/api/market/symbols", response_model=List[str])
async def get_available_symbols(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get list of available symbols"""
    current_user = get_current_user_from_header(authorization, db)
    
    symbols = db.query(MarketData.symbol).distinct().all()
    return [s[0] for s in symbols]


# ==================== TECHNICAL ANALYSIS ROUTES ====================

@router.post("/api/market/technical-analysis")
async def calculate_technical_analysis(
    request: TechnicalAnalysisRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Calculate technical indicators for a symbol"""
    current_user = get_current_user_from_header(authorization, db)
    
    # Get historical data
    market_data = db.query(MarketData).filter(
        MarketData.symbol == request.symbol.upper()
    ).order_by(MarketData.date).limit(200).all()
    
    if not market_data:
        raise HTTPException(status_code=404, detail="No market data found for symbol")
    
    prices = [d.close_price for d in market_data]
    volumes = [d.volume for d in market_data]
    
    # Calculate indicators
    indicators = TechnicalIndicators.get_all_indicators(prices, volumes)
    
    # Get latest values
    latest_data = market_data[-1]
    latest_sma20 = indicators["sma_20"][-1] if indicators["sma_20"][-1] is not None else None
    latest_sma50 = indicators["sma_50"][-1] if indicators["sma_50"][-1] is not None else None
    latest_rsi = indicators["rsi"][-1] if indicators["rsi"][-1] is not None else None
    
    macd_data = indicators["macd"]
    latest_macd = macd_data["macd"][-1] if macd_data["macd"][-1] is not None else None
    latest_macd_signal = macd_data["signal"][-1] if macd_data["signal"][-1] is not None else None
    
    bb_data = indicators["bollinger_bands"]
    latest_bb_upper = bb_data["upper"][-1] if bb_data["upper"][-1] is not None else None
    latest_bb_lower = bb_data["lower"][-1] if bb_data["lower"][-1] is not None else None
    
    # Store or update technical indicator
    existing = db.query(TechnicalIndicator).filter(
        TechnicalIndicator.symbol == request.symbol.upper(),
        TechnicalIndicator.date == latest_data.date
    ).first()
    
    if not existing:
        indicator = TechnicalIndicator(
            id=generate_id(),
            symbol=request.symbol.upper(),
            date=latest_data.date,
            ma20=latest_sma20,
            ma50=latest_sma50,
            rsi=latest_rsi,
            macd=latest_macd,
            macd_signal=latest_macd_signal,
            bbands_upper=latest_bb_upper,
            bbands_lower=latest_bb_lower
        )
        db.add(indicator)
        db.commit()
    
    return {
        "symbol": request.symbol.upper(),
        "date": latest_data.date.isoformat(),
        "close_price": latest_data.close_price,
        "sma_20": latest_sma20,
        "sma_50": latest_sma50,
        "rsi": latest_rsi,
        "macd": latest_macd,
        "macd_signal": latest_macd_signal,
        "bollinger_bands_upper": latest_bb_upper,
        "bollinger_bands_lower": latest_bb_lower,
        "signal": generate_trading_signal(latest_sma20, latest_sma50, latest_rsi, latest_macd, latest_macd_signal)
    }


# ==================== BACKTESTING ROUTES ====================

@router.post("/api/trading/backtest", response_model=BacktestResultResponse)
async def run_backtest(
    request: BacktestRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Run a backtest for a trading strategy"""
    current_user = get_current_user_from_header(authorization, db)
    
    # Get historical data
    market_data = db.query(MarketData).filter(
        MarketData.symbol == request.symbol.upper(),
        MarketData.date >= request.start_date,
        MarketData.date <= request.end_date
    ).order_by(MarketData.date).all()
    
    if not market_data:
        raise HTTPException(status_code=404, detail="No market data found for the specified date range")
    
    dates = [d.date for d in market_data]
    prices = [d.close_price for d in market_data]
    
    # Create backtest engine
    engine = create_backtest_engine(request.initial_capital)
    
    # Run strategy
    if request.strategy_name == "moving_average_crossover":
        results = engine.run_moving_average_crossover(dates, prices, request.fast_ma, request.slow_ma)
    elif request.strategy_name == "rsi_strategy":
        results = engine.run_rsi_strategy(dates, prices, request.rsi_oversold, request.rsi_overbought)
    elif request.strategy_name == "macd_strategy":
        results = engine.run_macd_strategy(dates, prices)
    else:
        raise HTTPException(status_code=400, detail="Unknown strategy")
    
    # Store results
    backtest = BacktestResult(
        id=generate_id(),
        user_id=current_user.id,
        symbol=request.symbol.upper(),
        strategy_name=request.strategy_name,
        start_date=request.start_date,
        end_date=request.end_date,
        initial_capital=request.initial_capital,
        final_value=results["final_value"],
        total_profit_loss=results["total_profit_loss"],
        total_profit_loss_percent=results["total_profit_loss_percent"],
        total_trades=results["total_trades"],
        winning_trades=results["winning_trades"],
        losing_trades=results["losing_trades"],
        win_rate=results["win_rate"],
        max_drawdown=results["max_drawdown"],
        result_json=json.dumps({
            "portfolio_values": results["portfolio_values"],
            "trades": results["trades"]
        })
    )
    db.add(backtest)
    db.commit()
    db.refresh(backtest)
    
    return backtest


@router.get("/api/trading/backtest/{backtest_id}", response_model=BacktestResultResponse)
async def get_backtest_result(
    backtest_id: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get a specific backtest result"""
    current_user = get_current_user_from_header(authorization, db)
    
    backtest = db.query(BacktestResult).filter(
        BacktestResult.id == backtest_id,
        BacktestResult.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    return backtest


@router.get("/api/trading/backtest", response_model=List[BacktestResultResponse])
async def list_backtests(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get user's backtest history"""
    current_user = get_current_user_from_header(authorization, db)
    
    backtests = db.query(BacktestResult).filter(
        BacktestResult.user_id == current_user.id
    ).order_by(BacktestResult.created_at.desc()).all()
    
    return backtests


# ==================== PAPER TRADING ROUTES ====================

@router.post("/api/trading/paper/account")
async def create_paper_trading_account(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Create or get paper trading account"""
    current_user = get_current_user_from_header(authorization, db)
    
    # Check if account exists
    existing = db.query(PaperPortfolio).filter(
        PaperPortfolio.user_id == current_user.id
    ).first()
    
    if existing:
        return {"id": existing.id, "message": "Paper trading account already exists"}
    
    # Create new account
    portfolio = PaperPortfolio(
        id=generate_id(),
        user_id=current_user.id,
        starting_capital=100000,
        current_cash=100000
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    
    return {"id": portfolio.id, "message": "Paper trading account created"}


@router.get("/api/trading/paper/account", response_model=PaperPortfolioResponse)
async def get_paper_trading_account(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get user's paper trading account"""
    current_user = get_current_user_from_header(authorization, db)
    
    portfolio = db.query(PaperPortfolio).filter(
        PaperPortfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Paper trading account not found")
    
    return portfolio


@router.post("/api/trading/paper/orders")
async def place_paper_order(
    symbol: str,
    order_type: str,
    quantity: float,
    price: float,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Place a paper trading order"""
    current_user = get_current_user_from_header(authorization, db)
    
    portfolio = db.query(PaperPortfolio).filter(
        PaperPortfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Paper trading account not found")
    
    if order_type == "buy":
        cost = price * quantity
        if cost > portfolio.current_cash:
            raise HTTPException(status_code=400, detail="Insufficient cash")
        
        # Update cash
        portfolio.current_cash -= cost
        portfolio.total_invested += cost
        
        # Find or create holding
        holding = db.query(PaperHolding).filter(
            PaperHolding.portfolio_id == portfolio.id,
            PaperHolding.symbol == symbol.upper()
        ).first()
        
        if holding:
            # Average cost calculation
            total_shares = holding.quantity + quantity
            total_cost = holding.total_cost + cost
            avg_price = total_cost / total_shares
            
            holding.quantity = total_shares
            holding.buy_price = avg_price
            holding.total_cost = total_cost
            holding.current_price = price
            holding.current_value = total_shares * price
            holding.profit_loss = holding.current_value - holding.total_cost
            holding.profit_loss_percent = (holding.profit_loss / holding.total_cost) * 100
        else:
            holding = PaperHolding(
                id=generate_id(),
                portfolio_id=portfolio.id,
                symbol=symbol.upper(),
                quantity=quantity,
                buy_price=price,
                current_price=price,
                total_cost=cost,
                current_value=cost,
                profit_loss=0,
                profit_loss_percent=0
            )
            db.add(holding)
        
        # Create trade record
        trade = PaperTrade(
            id=generate_id(),
            user_id=current_user.id,
            symbol=symbol.upper(),
            trade_type="buy",
            quantity=quantity,
            entry_price=price,
            entry_date=datetime.utcnow(),
            status="open"
        )
        db.add(trade)
    
    elif order_type == "sell":
        holding = db.query(PaperHolding).filter(
            PaperHolding.portfolio_id == portfolio.id,
            PaperHolding.symbol == symbol.upper()
        ).first()
        
        if not holding or holding.quantity < quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        proceeds = price * quantity
        portfolio.current_cash += proceeds
        
        # Update holding
        if holding.quantity == quantity:
            # Close position
            profit_loss = proceeds - holding.total_cost
            profit_loss_percent = (profit_loss / holding.total_cost) * 100
            
            # Create trade record
            trade = PaperTrade(
                id=generate_id(),
                user_id=current_user.id,
                symbol=symbol.upper(),
                trade_type="sell",
                quantity=quantity,
                entry_price=holding.buy_price,
                exit_price=price,
                entry_date=datetime.utcnow(),
                exit_date=datetime.utcnow(),
                status="closed",
                profit_loss=profit_loss,
                profit_loss_percent=profit_loss_percent
            )
            db.add(trade)
            db.delete(holding)
        else:
            # Partial close
            remaining_quantity = holding.quantity - quantity
            remaining_cost = holding.total_cost * (remaining_quantity / holding.quantity)
            
            holding.quantity = remaining_quantity
            holding.total_cost = remaining_cost
            holding.current_value = remaining_quantity * price
            holding.profit_loss = holding.current_value - remaining_cost
            holding.profit_loss_percent = (holding.profit_loss / remaining_cost) * 100
            
            trade = PaperTrade(
                id=generate_id(),
                user_id=current_user.id,
                symbol=symbol.upper(),
                trade_type="sell",
                quantity=quantity,
                entry_price=holding.buy_price,
                exit_price=price,
                entry_date=datetime.utcnow(),
                exit_date=datetime.utcnow(),
                status="closed",
                profit_loss=(proceeds - (quantity * holding.buy_price)),
                profit_loss_percent=((proceeds - (quantity * holding.buy_price)) / (quantity * holding.buy_price)) * 100
            )
            db.add(trade)
    
    # Update portfolio totals
    portfolio.current_value = portfolio.current_cash
    for holding in portfolio.holdings:
        portfolio.current_value += holding.current_value
    
    portfolio.total_profit_loss = portfolio.current_value - portfolio.starting_capital
    portfolio.total_profit_loss_percent = (portfolio.total_profit_loss / portfolio.starting_capital) * 100
    
    db.commit()
    
    return {
        "order_id": generate_id(),
        "symbol": symbol.upper(),
        "order_type": order_type,
        "quantity": quantity,
        "price": price,
        "status": "executed"
    }


@router.get("/api/trading/paper/portfolio", response_model=PaperPortfolioResponse)
async def get_paper_portfolio(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get paper trading portfolio"""
    current_user = get_current_user_from_header(authorization, db)
    
    portfolio = db.query(PaperPortfolio).filter(
        PaperPortfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Paper trading account not found")
    
    return portfolio


@router.get("/api/trading/paper/orders", response_model=List[PaperTradeResponse])
async def get_paper_orders(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get user's paper trading orders"""
    current_user = get_current_user_from_header(authorization, db)
    
    trades = db.query(PaperTrade).filter(
        PaperTrade.user_id == current_user.id
    ).order_by(PaperTrade.entry_date.desc()).all()
    
    return trades


# ==================== MARKET SIGNALS ====================

@router.get("/api/market/signals/{symbol}")
async def get_market_signals(
    symbol: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get buy/sell signals for a symbol"""
    current_user = get_current_user_from_header(authorization, db)
    
    # Get latest indicator data
    indicator = db.query(TechnicalIndicator).filter(
        TechnicalIndicator.symbol == symbol.upper()
    ).order_by(TechnicalIndicator.date.desc()).first()
    
    if not indicator:
        raise HTTPException(status_code=404, detail="No technical indicators found")
    
    signal = generate_trading_signal(
        indicator.ma20, indicator.ma50, indicator.rsi,
        indicator.macd, indicator.macd_signal
    )
    
    return {
        "symbol": symbol.upper(),
        "signal": signal,
        "indicators": {
            "ma20": indicator.ma20,
            "ma50": indicator.ma50,
            "rsi": indicator.rsi,
            "macd": indicator.macd,
            "macd_signal": indicator.macd_signal
        },
        "timestamp": indicator.date.isoformat()
    }


# ==================== HELPER FUNCTIONS ====================

def generate_trading_signal(sma20: Optional[float], sma50: Optional[float], 
                          rsi: Optional[float], macd: Optional[float], 
                          macd_signal: Optional[float]) -> str:
    """Generate trading signal based on technical indicators"""
    signals = []
    
    # MA crossover signal
    if sma20 is not None and sma50 is not None:
        if sma20 > sma50:
            signals.append("buy")
        elif sma20 < sma50:
            signals.append("sell")
    
    # RSI signal
    if rsi is not None:
        if rsi < 30:
            signals.append("buy")
        elif rsi > 70:
            signals.append("sell")
    
    # MACD signal
    if macd is not None and macd_signal is not None:
        if macd > macd_signal:
            signals.append("buy")
        elif macd < macd_signal:
            signals.append("sell")
    
    # Determine overall signal
    if not signals:
        return "hold"
    
    buy_count = signals.count("buy")
    sell_count = signals.count("sell")
    
    if buy_count > sell_count:
        return "buy"
    elif sell_count > buy_count:
        return "sell"
    else:
        return "hold"
