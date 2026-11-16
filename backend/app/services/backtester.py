"""
Backtesting Engine for Strategy Testing
Simulates trading strategies on historical market data
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json
from app.services.technical_indicators import TechnicalIndicators


class Trade:
    """Represents a single trade"""
    
    def __init__(self, entry_date: datetime, entry_price: float, exit_date: Optional[datetime] = None, exit_price: Optional[float] = None):
        self.entry_date = entry_date
        self.entry_price = entry_price
        self.exit_date = exit_date
        self.exit_price = exit_price
    
    def get_profit_loss(self) -> Optional[float]:
        if self.exit_price is None:
            return None
        return (self.exit_price - self.entry_price)
    
    def get_profit_loss_percent(self) -> Optional[float]:
        if self.exit_price is None:
            return None
        return ((self.exit_price - self.entry_price) / self.entry_price) * 100


class BacktestEngine:
    """Engine for backtesting trading strategies"""
    
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.current_cash = initial_capital
        self.shares_held = 0
        self.entry_price = 0
        self.trades: List[Trade] = []
        self.portfolio_values: List[float] = []
        self.max_portfolio_value = initial_capital
        self.min_portfolio_value = initial_capital
    
    def get_current_portfolio_value(self, current_price: float) -> float:
        """Calculate current portfolio value"""
        position_value = self.shares_held * current_price
        return self.current_cash + position_value
    
    def buy(self, price: float, quantity: float, date: datetime):
        """Execute buy order"""
        cost = price * quantity
        if cost <= self.current_cash:
            self.current_cash -= cost
            self.shares_held += quantity
            self.entry_price = price
            return True
        return False
    
    def sell(self, price: float, quantity: Optional[float], date: datetime) -> bool:
        """Execute sell order"""
        if quantity is None:
            quantity = self.shares_held
        
        if quantity <= self.shares_held:
            proceeds = price * quantity
            self.current_cash += proceeds
            self.shares_held -= quantity
            
            if self.shares_held == 0:
                trade = Trade(entry_date=self.trades[-1].entry_date if self.trades else date, 
                             entry_price=self.entry_price,
                             exit_date=date,
                             exit_price=price)
                self.trades.append(trade)
            
            return True
        return False
    
    def run_moving_average_crossover(self, dates: List[datetime], prices: List[float], 
                                     fast_period: int = 10, slow_period: int = 30) -> Dict:
        """
        Run Moving Average Crossover strategy
        Buy when fast MA crosses above slow MA
        Sell when fast MA crosses below slow MA
        """
        fast_ma = TechnicalIndicators.calculate_sma(prices, fast_period)
        slow_ma = TechnicalIndicators.calculate_sma(prices, slow_period)
        
        for i in range(slow_period, len(prices)):
            current_price = prices[i]
            current_date = dates[i]
            portfolio_value = self.get_current_portfolio_value(current_price)
            self.portfolio_values.append(portfolio_value)
            
            if self.shares_held == 0 and fast_ma[i] and slow_ma[i]:
                # Check for buy signal
                if i > 0 and fast_ma[i-1] and slow_ma[i-1]:
                    if fast_ma[i-1] <= slow_ma[i-1] and fast_ma[i] > slow_ma[i]:
                        # Buy with all available capital
                        quantity = self.current_cash / current_price
                        self.buy(current_price, quantity, current_date)
            
            elif self.shares_held > 0 and fast_ma[i] and slow_ma[i]:
                # Check for sell signal
                if i > 0 and fast_ma[i-1] and slow_ma[i-1]:
                    if fast_ma[i-1] >= slow_ma[i-1] and fast_ma[i] < slow_ma[i]:
                        # Sell all holdings
                        self.sell(current_price, None, current_date)
        
        return self._calculate_results(dates[-1])
    
    def run_rsi_strategy(self, dates: List[datetime], prices: List[float],
                         oversold: int = 30, overbought: int = 70, rsi_period: int = 14) -> Dict:
        """
        Run RSI-based strategy
        Buy when RSI < oversold
        Sell when RSI > overbought
        """
        rsi = TechnicalIndicators.calculate_rsi_simple(prices, rsi_period)
        
        for i in range(rsi_period, len(prices)):
            current_price = prices[i]
            current_date = dates[i]
            portfolio_value = self.get_current_portfolio_value(current_price)
            self.portfolio_values.append(portfolio_value)
            
            if rsi[i] is not None:
                if self.shares_held == 0 and rsi[i] < oversold:
                    # Buy
                    quantity = self.current_cash / current_price
                    self.buy(current_price, quantity, current_date)
                
                elif self.shares_held > 0 and rsi[i] > overbought:
                    # Sell
                    self.sell(current_price, None, current_date)
        
        return self._calculate_results(dates[-1])
    
    def run_macd_strategy(self, dates: List[datetime], prices: List[float]) -> Dict:
        """
        Run MACD-based strategy
        Buy when MACD crosses above signal line
        Sell when MACD crosses below signal line
        """
        macd_data = TechnicalIndicators.calculate_macd(prices)
        macd_line = macd_data["macd"]
        signal_line = macd_data["signal"]
        
        for i in range(26, len(prices)):  # MACD needs at least 26 periods
            current_price = prices[i]
            current_date = dates[i]
            portfolio_value = self.get_current_portfolio_value(current_price)
            self.portfolio_values.append(portfolio_value)
            
            if macd_line[i] is not None and signal_line[i] is not None:
                if i > 0 and macd_line[i-1] is not None and signal_line[i-1] is not None:
                    # Check for buy signal
                    if self.shares_held == 0 and macd_line[i-1] <= signal_line[i-1] and macd_line[i] > signal_line[i]:
                        quantity = self.current_cash / current_price
                        self.buy(current_price, quantity, current_date)
                    
                    # Check for sell signal
                    elif self.shares_held > 0 and macd_line[i-1] >= signal_line[i-1] and macd_line[i] < signal_line[i]:
                        self.sell(current_price, None, current_date)
        
        return self._calculate_results(dates[-1])
    
    def _calculate_results(self, end_date: datetime) -> Dict:
        """Calculate backtest results"""
        if not self.portfolio_values:
            self.portfolio_values = [self.initial_capital]
        
        final_value = self.portfolio_values[-1] if self.portfolio_values else self.initial_capital
        total_profit_loss = final_value - self.initial_capital
        total_profit_loss_percent = (total_profit_loss / self.initial_capital) * 100
        
        # Calculate win rate
        winning_trades = sum(1 for trade in self.trades if trade.get_profit_loss() is not None and trade.get_profit_loss() > 0)
        losing_trades = len(self.trades) - winning_trades
        win_rate = (winning_trades / len(self.trades) * 100) if self.trades else 0
        
        # Calculate max drawdown
        max_drawdown = self._calculate_max_drawdown()
        
        return {
            "initial_capital": self.initial_capital,
            "final_value": final_value,
            "total_profit_loss": total_profit_loss,
            "total_profit_loss_percent": total_profit_loss_percent,
            "total_trades": len(self.trades),
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": win_rate,
            "max_drawdown": max_drawdown,
            "portfolio_values": self.portfolio_values,
            "trades": [
                {
                    "entry_date": trade.entry_date.isoformat(),
                    "entry_price": trade.entry_price,
                    "exit_date": trade.exit_date.isoformat() if trade.exit_date else None,
                    "exit_price": trade.exit_price,
                    "profit_loss": trade.get_profit_loss(),
                    "profit_loss_percent": trade.get_profit_loss_percent()
                }
                for trade in self.trades
            ]
        }
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown percentage"""
        if not self.portfolio_values or len(self.portfolio_values) < 2:
            return 0.0
        
        max_value = self.portfolio_values[0]
        max_drawdown = 0.0
        
        for value in self.portfolio_values:
            if value > max_value:
                max_value = value
            
            drawdown = (max_value - value) / max_value * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return max_drawdown


def create_backtest_engine(initial_capital: float = 100000) -> BacktestEngine:
    """Factory function to create a backtest engine"""
    return BacktestEngine(initial_capital)
