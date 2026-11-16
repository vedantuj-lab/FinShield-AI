"""
Unit tests for Phase 4: Trading & Market Insights
Tests technical indicators and backtesting engine
"""

import pytest
from datetime import datetime, timedelta
from app.services.technical_indicators import TechnicalIndicators
from app.services.backtester import BacktestEngine, create_backtest_engine


class TestTechnicalIndicators:
    """Test technical indicator calculations"""

    def test_sma_calculation(self):
        """Test Simple Moving Average calculation"""
        prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109]
        sma_5 = TechnicalIndicators.calculate_sma(prices, 5)
        
        # First 4 should be None
        assert all(v is None for v in sma_5[:4])
        
        # 5th element should be average of first 5
        expected_sma_5 = sum(prices[:5]) / 5
        assert sma_5[4] == expected_sma_5
        assert abs(sma_5[4] - 102.2) < 0.01

    def test_sma_length(self):
        """Test SMA returns same length as input"""
        prices = list(range(100, 150))
        sma = TechnicalIndicators.calculate_sma(prices, 10)
        assert len(sma) == len(prices)

    def test_ema_calculation(self):
        """Test Exponential Moving Average calculation"""
        prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109]
        ema_5 = TechnicalIndicators.calculate_ema(prices, 5)
        
        # First 4 should be None
        assert all(v is None for v in ema_5[:4])
        
        # 5th element should be SMA
        expected_sma = sum(prices[:5]) / 5
        assert ema_5[4] == expected_sma

    def test_rsi_calculation(self):
        """Test RSI calculation"""
        prices = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08]
        rsi = TechnicalIndicators.calculate_rsi_simple(prices, 14)
        
        # Should return same length
        assert len(rsi) == len(prices)
        
        # RSI should be between 0 and 100 where not None
        for value in rsi:
            if value is not None:
                assert 0 <= value <= 100

    def test_bollinger_bands(self):
        """Test Bollinger Bands calculation"""
        prices = list(range(100, 150))
        bb = TechnicalIndicators.calculate_bollinger_bands(prices, 20, 2.0)
        
        assert len(bb["upper"]) == len(prices)
        assert len(bb["middle"]) == len(prices)
        assert len(bb["lower"]) == len(prices)
        
        # Check that upper > middle > lower where all are not None
        for i in range(len(prices)):
            if bb["upper"][i] is not None:
                assert bb["upper"][i] > bb["middle"][i]
                assert bb["middle"][i] > bb["lower"][i]

    def test_macd_calculation(self):
        """Test MACD calculation"""
        prices = list(range(100, 200))
        macd = TechnicalIndicators.calculate_macd(prices)
        
        assert len(macd["macd"]) == len(prices)
        assert len(macd["signal"]) == len(prices)
        assert len(macd["histogram"]) == len(prices)


class TestBacktestEngine:
    """Test backtesting engine"""

    def test_engine_initialization(self):
        """Test backtest engine initialization"""
        engine = create_backtest_engine(100000)
        assert engine.initial_capital == 100000
        assert engine.current_cash == 100000
        assert engine.shares_held == 0

    def test_buy_order(self):
        """Test buy order execution"""
        engine = create_backtest_engine(100000)
        date = datetime.now()
        
        result = engine.buy(100.0, 100, date)
        assert result is True
        assert engine.shares_held == 100
        assert engine.current_cash == 90000

    def test_buy_order_insufficient_funds(self):
        """Test buy order with insufficient funds"""
        engine = create_backtest_engine(5000)
        date = datetime.now()
        
        result = engine.buy(100.0, 100, date)
        assert result is False
        assert engine.shares_held == 0
        assert engine.current_cash == 5000

    def test_sell_order(self):
        """Test sell order execution"""
        engine = create_backtest_engine(100000)
        date = datetime.now()
        
        # First buy
        engine.buy(100.0, 100, date)
        initial_cash = engine.current_cash
        
        # Then sell
        result = engine.sell(110.0, 100, date)
        assert result is True
        assert engine.shares_held == 0
        assert engine.current_cash == initial_cash + 11000

    def test_portfolio_value_calculation(self):
        """Test portfolio value calculation"""
        engine = create_backtest_engine(100000)
        date = datetime.now()
        
        engine.buy(100.0, 500, date)
        portfolio_value = engine.get_current_portfolio_value(110.0)
        
        expected = 50000 + (500 * 110)  # remaining cash + position value
        assert portfolio_value == expected

    def test_moving_average_crossover_strategy(self):
        """Test Moving Average Crossover strategy"""
        # Create sample price data with clear crossover pattern
        prices = [100 + i * 0.5 for i in range(50)]  # Uptrend
        dates = [datetime.now() - timedelta(days=50-i) for i in range(50)]
        
        engine = create_backtest_engine(100000)
        results = engine.run_moving_average_crossover(dates, prices, 10, 30)
        
        assert "final_value" in results
        assert "total_profit_loss" in results
        assert "total_trades" in results
        assert results["initial_capital"] == 100000

    def test_rsi_strategy(self):
        """Test RSI strategy"""
        # Create sample data
        prices = [100 + i for i in range(50)]
        dates = [datetime.now() - timedelta(days=50-i) for i in range(50)]
        
        engine = create_backtest_engine(100000)
        results = engine.run_rsi_strategy(dates, prices)
        
        assert "final_value" in results
        assert "total_profit_loss" in results
        assert results["initial_capital"] == 100000

    def test_macd_strategy(self):
        """Test MACD strategy"""
        # Create sample data
        prices = [100 + i * 0.5 for i in range(100)]
        dates = [datetime.now() - timedelta(days=100-i) for i in range(100)]
        
        engine = create_backtest_engine(100000)
        results = engine.run_macd_strategy(dates, prices)
        
        assert "final_value" in results
        assert "total_profit_loss" in results
        assert results["initial_capital"] == 100000

    def test_backtest_with_profit(self):
        """Test backtest results with profitable trades"""
        # Uptrend scenario
        prices = [100 + i for i in range(50)]
        dates = [datetime.now() - timedelta(days=50-i) for i in range(50)]
        
        engine = create_backtest_engine(100000)
        results = engine.run_moving_average_crossover(dates, prices, 5, 15)
        
        # In an uptrend, the strategy should be profitable or break even
        assert results["final_value"] >= results["initial_capital"] * 0.95

    def test_max_drawdown_calculation(self):
        """Test max drawdown calculation"""
        engine = create_backtest_engine(100000)
        
        # Simulate portfolio values: up then down then up
        engine.portfolio_values = [100000, 105000, 110000, 105000, 100000, 102000]
        
        max_dd = engine._calculate_max_drawdown()
        assert max_dd > 0
        # Drawdown from 110000 to 100000 is about 9.09%
        assert 8 < max_dd < 10

    def test_backtest_results_structure(self):
        """Test backtest results have correct structure"""
        prices = list(range(100, 150))
        dates = [datetime.now() - timedelta(days=50-i) for i in range(50)]
        
        engine = create_backtest_engine(100000)
        results = engine.run_moving_average_crossover(dates, prices, 10, 30)
        
        required_fields = [
            "initial_capital",
            "final_value",
            "total_profit_loss",
            "total_profit_loss_percent",
            "total_trades",
            "winning_trades",
            "losing_trades",
            "win_rate",
            "max_drawdown"
        ]
        
        for field in required_fields:
            assert field in results


class TestTechnicalIndicatorsAccuracy:
    """Test accuracy of technical indicators against known values"""

    def test_sma_known_values(self):
        """Test SMA against known values"""
        prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
        sma_3 = TechnicalIndicators.calculate_sma(prices, 3)
        
        # SMA at index 2 should be (10+11+12)/3 = 11
        assert sma_3[2] == 11
        # SMA at index 3 should be (11+12+13)/3 = 12
        assert sma_3[3] == 12

    def test_rsi_in_range(self):
        """Test RSI produces values in valid range"""
        prices = [100 + (10 * (i % 10)) for i in range(50)]
        rsi = TechnicalIndicators.calculate_rsi_simple(prices, 14)
        
        for value in rsi:
            if value is not None:
                assert 0 <= value <= 100

    def test_bollinger_bands_logic(self):
        """Test Bollinger Bands middle band equals SMA"""
        prices = list(range(100, 150))
        bb = TechnicalIndicators.calculate_bollinger_bands(prices, 10, 2)
        sma = TechnicalIndicators.calculate_sma(prices, 10)
        
        for i in range(len(prices)):
            if bb["middle"][i] is not None:
                assert abs(bb["middle"][i] - sma[i]) < 0.01


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
