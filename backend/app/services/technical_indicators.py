"""
Technical Indicators Calculation Service
Calculates various technical indicators for market analysis
"""

import math
from typing import List, Dict, Optional, Tuple


class TechnicalIndicators:
    """Service for calculating technical indicators"""

    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Simple Moving Average (SMA)
        
        Args:
            prices: List of prices
            period: Number of periods for the average
            
        Returns:
            List of SMA values (None for insufficient data)
        """
        sma_values = []
        
        for i in range(len(prices)):
            if i < period - 1:
                sma_values.append(None)
            else:
                sma = sum(prices[i - period + 1:i + 1]) / period
                sma_values.append(sma)
        
        return sma_values

    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Exponential Moving Average (EMA)
        
        Args:
            prices: List of prices
            period: Number of periods for the average
            
        Returns:
            List of EMA values (None for insufficient data)
        """
        ema_values = []
        multiplier = 2 / (period + 1)
        
        for i in range(len(prices)):
            if i < period - 1:
                ema_values.append(None)
            elif i == period - 1:
                # First EMA is SMA
                sma = sum(prices[0:period]) / period
                ema_values.append(sma)
            else:
                # Subsequent EMAs use the multiplier
                prev_ema = ema_values[i - 1]
                ema = prices[i] * multiplier + prev_ema * (1 - multiplier)
                ema_values.append(ema)
        
        return ema_values

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        Calculate Relative Strength Index (RSI)
        
        Args:
            prices: List of prices
            period: Number of periods (default 14)
            
        Returns:
            List of RSI values (0-100, None for insufficient data)
        """
        rsi_values = []
        gains = []
        losses = []
        
        # Calculate gains and losses
        for i in range(len(prices)):
            if i == 0:
                gains.append(0)
                losses.append(0)
            else:
                change = prices[i] - prices[i - 1]
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(abs(change))
        
        # Calculate RSI
        for i in range(len(prices)):
            if i < period:
                rsi_values.append(None)
            elif i == period:
                avg_gain = sum(gains[1:period + 1]) / period
                avg_loss = sum(losses[1:period + 1]) / period
                
                if avg_loss == 0:
                    rsi = 100 if avg_gain > 0 else 0
                else:
                    rs = avg_gain / avg_loss
                    rsi = 100 - (100 / (1 + rs))
                
                rsi_values.append(rsi)
            else:
                avg_gain = (rsi_values[i - 1] * (100 - (prices[i] - prices[i - 1]) / prices[i - 1] * 100)) + (gains[i] * 100 / prices[i - 1]) / period
                avg_loss = (rsi_values[i - 1] * (100 - (prices[i] - prices[i - 1]) / prices[i - 1] * 100)) + (losses[i] * 100 / prices[i - 1]) / period
                
                if avg_loss == 0:
                    rsi = 100 if avg_gain > 0 else 0
                else:
                    rs = avg_gain / avg_loss
                    rsi = 100 - (100 / (1 + rs))
                
                rsi_values.append(rsi)
        
        return rsi_values

    @staticmethod
    def calculate_rsi_simple(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        Calculate RSI using simplified method (more reliable)
        """
        if len(prices) < period + 1:
            return [None] * len(prices)
        
        rsi_values = [None] * (period)
        
        # Calculate gains and losses
        deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        gains = [delta if delta > 0 else 0 for delta in deltas]
        losses = [abs(delta) if delta < 0 else 0 for delta in deltas]
        
        # Calculate first RSI (using SMA)
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        if avg_loss == 0:
            rsi = 100 if avg_gain > 0 else 0
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        rsi_values.append(rsi)
        
        # Calculate subsequent RSI values (using EMA-like smoothing)
        for i in range(period + 1, len(prices)):
            avg_gain = (avg_gain * (period - 1) + gains[i - 1]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i - 1]) / period
            
            if avg_loss == 0:
                rsi = 100 if avg_gain > 0 else 0
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
            
            rsi_values.append(rsi)
        
        return rsi_values

    @staticmethod
    def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Optional[float]]]:
        """
        Calculate MACD (Moving Average Convergence Divergence)
        
        Args:
            prices: List of prices
            fast: Fast EMA period (default 12)
            slow: Slow EMA period (default 26)
            signal: Signal line period (default 9)
            
        Returns:
            Dictionary with 'macd', 'signal', and 'histogram' lists
        """
        # Calculate EMAs
        fast_ema = TechnicalIndicators.calculate_ema(prices, fast)
        slow_ema = TechnicalIndicators.calculate_ema(prices, slow)
        
        # Calculate MACD line
        macd_line = []
        for i in range(len(prices)):
            if fast_ema[i] is None or slow_ema[i] is None:
                macd_line.append(None)
            else:
                macd_line.append(fast_ema[i] - slow_ema[i])
        
        # Calculate signal line
        signal_line = []
        valid_macd = [m for m in macd_line if m is not None]
        signal_ema = TechnicalIndicators.calculate_ema(valid_macd, signal) if len(valid_macd) > signal else []
        
        # Align signal line with original prices
        signal_index = 0
        for i in range(len(macd_line)):
            if macd_line[i] is None:
                signal_line.append(None)
            else:
                if signal_index < len(signal_ema):
                    signal_line.append(signal_ema[signal_index])
                    signal_index += 1
                else:
                    signal_line.append(None)
        
        # Calculate histogram
        histogram = []
        for i in range(len(macd_line)):
            if macd_line[i] is None or signal_line[i] is None:
                histogram.append(None)
            else:
                histogram.append(macd_line[i] - signal_line[i])
        
        return {
            "macd": macd_line,
            "signal": signal_line,
            "histogram": histogram
        }

    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20, std_dev: float = 2.0) -> Dict[str, List[Optional[float]]]:
        """
        Calculate Bollinger Bands
        
        Args:
            prices: List of prices
            period: SMA period (default 20)
            std_dev: Number of standard deviations (default 2)
            
        Returns:
            Dictionary with 'upper', 'middle', and 'lower' bands
        """
        # Calculate SMA
        sma = TechnicalIndicators.calculate_sma(prices, period)
        
        upper_band = []
        middle_band = []
        lower_band = []
        
        for i in range(len(prices)):
            if i < period - 1:
                upper_band.append(None)
                middle_band.append(None)
                lower_band.append(None)
            else:
                # Calculate standard deviation
                window = prices[i - period + 1:i + 1]
                mean = sum(window) / period
                variance = sum((x - mean) ** 2 for x in window) / period
                std = math.sqrt(variance)
                
                middle = sma[i]
                upper = middle + (std * std_dev)
                lower = middle - (std * std_dev)
                
                upper_band.append(upper)
                middle_band.append(middle)
                lower_band.append(lower)
        
        return {
            "upper": upper_band,
            "middle": middle_band,
            "lower": lower_band
        }

    @staticmethod
    def calculate_volume_sma(volumes: List[int], period: int = 20) -> List[Optional[float]]:
        """
        Calculate Volume Simple Moving Average
        """
        return TechnicalIndicators.calculate_sma([float(v) for v in volumes], period)

    @staticmethod
    def get_all_indicators(prices: List[float], volumes: List[int]) -> Dict[str, any]:
        """
        Calculate all technical indicators for a price series
        
        Args:
            prices: List of prices
            volumes: List of volumes
            
        Returns:
            Dictionary with all indicators
        """
        return {
            "sma_20": TechnicalIndicators.calculate_sma(prices, 20),
            "sma_50": TechnicalIndicators.calculate_sma(prices, 50),
            "ema_12": TechnicalIndicators.calculate_ema(prices, 12),
            "ema_26": TechnicalIndicators.calculate_ema(prices, 26),
            "rsi": TechnicalIndicators.calculate_rsi_simple(prices, 14),
            "macd": TechnicalIndicators.calculate_macd(prices),
            "bollinger_bands": TechnicalIndicators.calculate_bollinger_bands(prices),
            "volume_sma": TechnicalIndicators.calculate_volume_sma(volumes)
        }
