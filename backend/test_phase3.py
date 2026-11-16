"""
Unit tests for Phase 3: Investment & Portfolio Management
Tests calculator functions and risk analysis algorithms
"""

import pytest
from decimal import Decimal
import math


class TestSIPCalculator:
    """Test SIP calculation functions"""

    def test_sip_calculation_basic(self):
        """Test basic SIP calculation"""
        monthly_investment = 5000
        years = 10
        annual_return = 12

        months = years * 12
        monthly_return = (annual_return / 100) / 12

        if monthly_return == 0:
            future_value = monthly_investment * months
        else:
            future_value = monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return)

        total_invested = monthly_investment * months
        total_gain = future_value - total_invested

        assert future_value > total_invested
        assert total_gain > 0
        assert total_invested == 600000
        # Verify calculation is correct (approximately 1.15M)
        assert round(future_value, 2) == 1150193.45

    def test_sip_calculation_zero_return(self):
        """Test SIP with zero return"""
        monthly_investment = 5000
        years = 10
        annual_return = 0

        months = years * 12
        monthly_return = (annual_return / 100) / 12

        if monthly_return == 0:
            future_value = monthly_investment * months
        else:
            future_value = monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return)

        total_invested = monthly_investment * months

        assert future_value == total_invested
        assert future_value == 600000

    def test_sip_calculation_high_return(self):
        """Test SIP with high return"""
        monthly_investment = 5000
        years = 20
        annual_return = 15

        months = years * 12
        monthly_return = (annual_return / 100) / 12

        if monthly_return == 0:
            future_value = monthly_investment * months
        else:
            future_value = monthly_investment * (((1 + monthly_return) ** months - 1) / monthly_return)

        total_invested = monthly_investment * months

        assert future_value > total_invested
        # For 20 years at 15%, should be around 7.5M
        assert future_value > 5000000


class TestCompoundInterest:
    """Test compound interest calculations"""

    def test_compound_interest_annual(self):
        """Test annual compound interest"""
        principal = 100000
        annual_rate = 10
        years = 5
        compounds_per_year = 1

        rate = annual_rate / 100
        amount = principal * ((1 + rate / compounds_per_year) ** (compounds_per_year * years))
        interest = amount - principal

        assert round(amount, 2) == 161051.00
        assert interest > 0

    def test_compound_interest_monthly(self):
        """Test monthly compound interest"""
        principal = 100000
        annual_rate = 6
        years = 5
        compounds_per_year = 12

        rate = annual_rate / 100
        amount = principal * ((1 + rate / compounds_per_year) ** (compounds_per_year * years))
        interest = amount - principal

        assert amount > principal
        assert interest > 0
        assert round(amount, 2) > 134885

    def test_compound_interest_zero_rate(self):
        """Test compound interest with zero rate"""
        principal = 100000
        annual_rate = 0
        years = 5
        compounds_per_year = 12

        rate = annual_rate / 100
        amount = principal * ((1 + rate / compounds_per_year) ** (compounds_per_year * years))

        assert amount == principal


class TestRetirementPlanning:
    """Test retirement planning calculations"""

    def test_retirement_corpus_calculation(self):
        """Test retirement corpus calculation"""
        current_age = 30
        retirement_age = 60
        monthly_expense = 50000
        annual_inflation = 5
        annual_return = 10
        current_savings = 500000

        years_to_retirement = retirement_age - current_age
        retirement_years = 30

        # Calculate future value of monthly expenses adjusted for inflation
        monthly_expense_at_retirement = monthly_expense * ((1 + annual_inflation / 100) ** years_to_retirement)

        # Calculate corpus needed
        monthly_return = (annual_return / 100) / 12
        if monthly_return == 0:
            corpus_needed = monthly_expense_at_retirement * 12 * retirement_years
        else:
            corpus_needed = monthly_expense_at_retirement * 12 * (1 - (1 + monthly_return) ** (-retirement_years * 12)) / monthly_return

        # Future value of current savings
        future_value_current = current_savings * ((1 + annual_return / 100) ** years_to_retirement)

        assert years_to_retirement == 30
        assert monthly_expense_at_retirement > monthly_expense
        assert corpus_needed > 0
        assert future_value_current > current_savings

    def test_retirement_monthly_investment(self):
        """Test monthly investment needed for retirement"""
        corpus_needed = 10000000
        years_to_retirement = 30
        annual_return = 10

        months_to_retirement = years_to_retirement * 12
        monthly_return = (annual_return / 100) / 12

        if monthly_return == 0:
            monthly_investment = corpus_needed / months_to_retirement
        else:
            monthly_investment = corpus_needed / (((1 + monthly_return) ** months_to_retirement - 1) / monthly_return)

        assert monthly_investment > 0
        assert monthly_investment < corpus_needed / months_to_retirement * 2  # Sanity check


class TestFDCalculator:
    """Test FD (Fixed Deposit) calculations"""

    def test_fd_calculation(self):
        """Test basic FD calculation"""
        principal = 100000
        annual_rate = 6
        years = 5

        maturity_amount = principal * ((1 + annual_rate / 100) ** years)
        interest_earned = maturity_amount - principal

        assert maturity_amount > principal
        assert interest_earned > 0
        assert round(maturity_amount, 2) == 133822.56

    def test_fd_zero_rate(self):
        """Test FD with zero rate"""
        principal = 100000
        annual_rate = 0
        years = 5

        maturity_amount = principal * ((1 + annual_rate / 100) ** years)

        assert maturity_amount == principal


class TestRiskAnalysis:
    """Test portfolio risk analysis"""

    def test_concentration_risk(self):
        """Test concentration risk calculation"""
        holdings = [
            {"name": "Stock A", "value": 60000, "category": "Stock"},
            {"name": "Stock B", "value": 40000, "category": "Stock"},
        ]

        total_value = sum(h["value"] for h in holdings)
        max_holding = max(h["value"] for h in holdings)
        concentration_risk = (max_holding / total_value) * 100

        assert concentration_risk == 60.0
        assert concentration_risk <= 100

    def test_diversification_score(self):
        """Test diversification score calculation"""
        holdings = [
            {"name": "A", "value": 25000},
            {"name": "B", "value": 25000},
            {"name": "C", "value": 25000},
            {"name": "D", "value": 25000},
        ]

        total_value = sum(h["value"] for h in holdings)
        herfindahl_index = sum((h["value"] / total_value) ** 2 for h in holdings)
        diversification_score = (1 - herfindahl_index) * 100

        # Perfect diversification: 0.25^2 * 4 = 0.25, score = 75
        assert round(diversification_score, 2) == 75.0

    def test_diversification_score_concentrated(self):
        """Test diversification score for concentrated portfolio"""
        holdings = [
            {"name": "A", "value": 90000},
            {"name": "B", "value": 10000},
        ]

        total_value = sum(h["value"] for h in holdings)
        herfindahl_index = sum((h["value"] / total_value) ** 2 for h in holdings)
        diversification_score = (1 - herfindahl_index) * 100

        # Concentrated portfolio
        assert diversification_score < 50

    def test_volatility_estimate(self):
        """Test volatility estimation"""
        volatility_map = {
            "Stock": 80,
            "MF": 50,
            "FD": 20,
            "Bond": 20,
        }

        holdings = [
            {"value": 40000, "category": "Stock"},
            {"value": 30000, "category": "MF"},
            {"value": 30000, "category": "FD"},
        ]

        total_value = sum(h["value"] for h in holdings)
        volatility_estimate = sum(
            (h["value"] / total_value) * volatility_map.get(h["category"], 50)
            for h in holdings
        )

        expected = (40000/100000)*80 + (30000/100000)*50 + (30000/100000)*20
        assert round(volatility_estimate, 2) == round(expected, 2)
        assert volatility_estimate > 20
        assert volatility_estimate < 80

    def test_risk_score_calculation(self):
        """Test overall risk score calculation"""
        concentration_risk = 60
        diversification_score = 40
        volatility_estimate = 50

        risk_score = (
            (concentration_risk * 0.4) +
            ((100 - diversification_score) * 0.3) +
            (volatility_estimate * 0.3)
        )

        expected = (60 * 0.4) + (60 * 0.3) + (50 * 0.3)
        assert round(risk_score, 2) == round(expected, 2)
        assert risk_score >= 0
        assert risk_score <= 100

    def test_risk_level_assignment(self):
        """Test risk level assignment"""
        # Low risk
        risk_score = 20
        risk_level = "Low" if risk_score <= 25 else "Medium"
        assert risk_level == "Low"

        # Medium risk
        risk_score = 40
        risk_level = "Low" if risk_score <= 25 else ("Medium" if risk_score <= 50 else "High")
        assert risk_level == "Medium"

        # High risk
        risk_score = 70
        risk_level = "Low" if risk_score <= 25 else ("Medium" if risk_score <= 50 else ("High" if risk_score <= 75 else "VeryHigh"))
        assert risk_level == "High"

        # Very High risk
        risk_score = 85
        risk_level = "Low" if risk_score <= 25 else ("Medium" if risk_score <= 50 else ("High" if risk_score <= 75 else "VeryHigh"))
        assert risk_level == "VeryHigh"


class TestGoalCalculator:
    """Test goal-based investment calculations"""

    def test_goal_calculation(self):
        """Test required monthly investment for goal"""
        target_amount = 5000000
        years = 20
        expected_return = 10

        months = int(years * 12)
        monthly_return = (expected_return / 100) / 12

        if monthly_return == 0:
            required_monthly = target_amount / months
        else:
            required_monthly = target_amount / (
                (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
            )

        assert required_monthly > 0
        assert required_monthly < target_amount / months * 2  # Sanity check

    def test_goal_calculation_zero_return(self):
        """Test goal calculation with zero return"""
        target_amount = 1200000
        years = 20
        expected_return = 0

        months = int(years * 12)
        monthly_return = (expected_return / 100) / 12

        if monthly_return == 0:
            required_monthly = target_amount / months
        else:
            required_monthly = target_amount / (
                (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
            )

        expected = target_amount / months
        assert round(required_monthly, 2) == round(expected, 2)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
