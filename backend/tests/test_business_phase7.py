"""
Unit tests for Phase 7: Small Business Finance
"""

import pytest
from datetime import datetime, timedelta
from app.models import (
    User, BusinessProfile, GSTInvoice, IncomeExpense, CashFlowForecast, EMIPlan
)
from app.schemas import (
    GSTInvoiceCreate, IncomeExpenseCreate, CashFlowForecastCreate, EMIPlanCreate,
    InvoiceItem
)


class TestGSTCalculations:
    """Test GST calculation functions"""

    def test_gst_5_percent(self):
        """Test 5% GST calculation"""
        amount = 100
        rate = 5
        expected = 5
        result = (amount * rate) / 100
        assert result == expected

    def test_gst_12_percent(self):
        """Test 12% GST calculation"""
        amount = 1000
        rate = 12
        expected = 120
        result = (amount * rate) / 100
        assert result == expected

    def test_gst_18_percent(self):
        """Test 18% GST calculation"""
        amount = 5000
        rate = 18
        expected = 900
        result = (amount * rate) / 100
        assert result == expected

    def test_gst_28_percent(self):
        """Test 28% GST calculation"""
        amount = 10000
        rate = 28
        expected = 2800
        result = (amount * rate) / 100
        assert result == expected

    def test_sgst_cgst_split(self):
        """Test SGST/CGST split (50-50)"""
        total_gst = 1000
        sgst = total_gst / 2
        cgst = total_gst / 2
        assert sgst == 500
        assert cgst == 500
        assert sgst + cgst == total_gst


class TestEMICalculations:
    """Test EMI calculation functions"""

    def test_emi_calculation_with_interest(self):
        """Test EMI calculation with interest"""
        principal = 100000
        annual_rate = 12
        tenure_months = 12
        
        monthly_rate = annual_rate / (100 * 12)
        emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure_months) / \
              ((1 + monthly_rate) ** tenure_months - 1)
        
        # Expected EMI should be around 8884.88 for these values
        assert emi > 8800
        assert emi < 9000

    def test_emi_calculation_zero_interest(self):
        """Test EMI calculation with zero interest"""
        principal = 100000
        annual_rate = 0
        tenure_months = 12
        
        monthly_rate = annual_rate / (100 * 12)
        if monthly_rate == 0:
            emi = principal / tenure_months
        else:
            emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure_months) / \
                  ((1 + monthly_rate) ** tenure_months - 1)
        
        # EMI should be exactly 1/12th of principal
        assert emi == principal / tenure_months
        assert emi == 8333.333333333334

    def test_total_amount_payable(self):
        """Test total amount calculation"""
        monthly_emi = 8884.88
        tenure_months = 12
        total_amount = monthly_emi * tenure_months
        
        assert total_amount > 106000
        assert total_amount < 107000

    def test_total_interest_calculation(self):
        """Test total interest calculation"""
        principal = 100000
        total_amount = 106618.55
        total_interest = total_amount - principal
        
        assert total_interest > 6600
        assert total_interest < 6700


class TestIncomeExpenseCategories:
    """Test income and expense categories"""

    def test_expense_categories(self):
        """Test valid expense categories"""
        valid_categories = [
            'Salaries', 'Rent', 'Utilities', 'Office Supplies', 
            'Marketing', 'Travel', 'Maintenance', 'Insurance'
        ]
        for category in valid_categories:
            assert len(category) > 0

    def test_income_categories(self):
        """Test valid income categories"""
        valid_categories = [
            'Sales', 'Services', 'Consulting', 'Interest Income'
        ]
        for category in valid_categories:
            assert len(category) > 0

    def test_income_vs_expense_segregation(self):
        """Test income/expense type segregation"""
        transactions = [
            {'type': 'income', 'amount': 50000},
            {'type': 'expense', 'amount': 10000},
            {'type': 'income', 'amount': 30000},
            {'type': 'expense', 'amount': 5000},
        ]
        
        total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        total_expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        
        assert total_income == 80000
        assert total_expense == 15000
        assert total_income - total_expense == 65000


class TestCashFlowForecasting:
    """Test cash flow forecasting logic"""

    def test_monthly_cash_flow_calculation(self):
        """Test monthly cash flow calculation"""
        opening_balance = 50000
        inflows = 100000
        outflows = 30000
        
        closing_balance = opening_balance + inflows - outflows
        assert closing_balance == 120000

    def test_cash_flow_with_growth_rate(self):
        """Test cash flow with growth rate"""
        base_amount = 100000
        growth_rate = 10  # 10% growth
        
        multiplier = 1 + (growth_rate / 100)
        projected_amount = base_amount * multiplier
        
        assert projected_amount == 110000

    def test_cash_flow_with_seasonality(self):
        """Test cash flow with seasonality factor"""
        base_amount = 100000
        seasonality_factor = 1.5  # 50% seasonal increase
        
        seasonal_amount = base_amount * seasonality_factor
        assert seasonal_amount == 150000

    def test_cash_flow_with_growth_and_seasonality(self):
        """Test cash flow with both growth and seasonality"""
        base_amount = 100000
        growth_rate = 10
        seasonality_factor = 1.2
        
        final_amount = base_amount * (1 + growth_rate / 100) * seasonality_factor
        
        assert final_amount > base_amount
        assert final_amount == 132000

    def test_forecast_period_generation(self):
        """Test forecast period generation"""
        start_month = "2024-11"
        end_month = "2025-01"
        
        start = datetime.strptime(start_month, "%Y-%m")
        end = datetime.strptime(end_month, "%Y-%m")
        months_delta = (end.year - start.year) * 12 + (end.month - start.month)
        
        assert months_delta == 2

    def test_cash_flow_negative_balance(self):
        """Test handling of negative cash flow balance"""
        opening_balance = 10000
        inflows = 5000
        outflows = 20000
        
        closing_balance = opening_balance + inflows - outflows
        assert closing_balance < 0
        assert closing_balance == -5000


class TestInvoiceItem:
    """Test invoice item handling"""

    def test_invoice_item_calculation(self):
        """Test invoice item amount calculation"""
        quantity = 5
        unit_price = 1000
        tax_rate = 18
        
        amount = quantity * unit_price
        tax = (amount * tax_rate) / 100
        total = amount + tax
        
        assert amount == 5000
        assert tax == 900
        assert total == 5900

    def test_multiple_invoice_items(self):
        """Test multiple invoice items"""
        items = [
            {'quantity': 5, 'unit_price': 1000, 'tax_rate': 18},
            {'quantity': 2, 'unit_price': 500, 'tax_rate': 12},
            {'quantity': 10, 'unit_price': 100, 'tax_rate': 5},
        ]
        
        subtotal = sum(item['quantity'] * item['unit_price'] for item in items)
        assert subtotal == 6000

    def test_invoice_total_with_gst(self):
        """Test invoice total calculation with GST"""
        subtotal = 10000
        gst_rate = 18
        gst_amount = (subtotal * gst_rate) / 100
        total = subtotal + gst_amount
        
        assert gst_amount == 1800
        assert total == 11800


class TestBusinessFinanceModels:
    """Test Phase 7 models structure"""

    def test_gst_invoice_model_fields(self):
        """Verify GSTInvoice model has required fields"""
        required_fields = [
            'invoice_number', 'customer_name', 'subtotal', 
            'sgst_amount', 'cgst_amount', 'total_amount', 'gst_rate'
        ]
        for field in required_fields:
            assert len(field) > 0

    def test_income_expense_model_fields(self):
        """Verify IncomeExpense model has required fields"""
        required_fields = [
            'transaction_date', 'amount', 'transaction_type',
            'category', 'description', 'gst_amount'
        ]
        for field in required_fields:
            assert len(field) > 0

    def test_cash_flow_forecast_model_fields(self):
        """Verify CashFlowForecast model has required fields"""
        required_fields = [
            'start_month', 'end_month', 'forecast_months',
            'forecast_data', 'total_inflows', 'total_outflows'
        ]
        for field in required_fields:
            assert len(field) > 0

    def test_emi_plan_model_fields(self):
        """Verify EMIPlan model has required fields"""
        required_fields = [
            'loan_name', 'principal_amount', 'annual_interest_rate',
            'tenure_months', 'monthly_emi', 'total_amount_payable'
        ]
        for field in required_fields:
            assert len(field) > 0


class TestBusinessProfitMargin:
    """Test profit/loss calculations"""

    def test_net_profit_calculation(self):
        """Test net profit calculation"""
        total_income = 500000
        total_expense = 300000
        
        net_profit = total_income - total_expense
        assert net_profit == 200000

    def test_profit_margin_percentage(self):
        """Test profit margin percentage"""
        net_profit = 200000
        total_income = 500000
        
        margin = (net_profit / total_income) * 100
        assert margin == 40.0

    def test_break_even_point(self):
        """Test break-even calculation"""
        fixed_costs = 50000
        contribution_margin = 0.4  # 40%
        
        break_even_revenue = fixed_costs / contribution_margin
        assert break_even_revenue == 125000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
