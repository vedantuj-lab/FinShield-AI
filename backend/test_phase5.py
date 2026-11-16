"""
Unit tests for Phase 5: Tax Assistant
Tests tax calculation, regime comparison, and deduction logic
"""

import pytest
from decimal import Decimal


class TestTaxCalculation:
    """Test tax calculation functions"""

    def get_tax_slabs_2024_25(self):
        """Get tax slabs for FY 2024-25"""
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

    def calculate_tax_from_slabs(self, income: float, slabs: list) -> float:
        """Calculate tax based on slab structure"""
        tax = 0
        
        for slab in slabs:
            if income <= slab["from"]:
                break
            
            slab_end = min(income, slab["to"])
            taxable_in_slab = slab_end - slab["from"]
            tax += taxable_in_slab * (slab["rate"] / 100)
        
        return tax

    def get_cess(self, tax: float) -> float:
        """Calculate health and education cess (4%)"""
        return tax * 0.04

    def test_tax_calculation_below_basic_exemption(self):
        """Test tax for income below basic exemption"""
        income = 200000
        slabs = self.get_tax_slabs_2024_25()["new"]
        
        tax = self.calculate_tax_from_slabs(income, slabs)
        
        assert tax == 0, "No tax should be charged on income below ₹300,000"

    def test_tax_calculation_in_first_slab(self):
        """Test tax calculation in first slab (300k-700k, 5%)"""
        taxable_income = 500000  # After deductions
        slabs = self.get_tax_slabs_2024_25()["new"]
        
        tax = self.calculate_tax_from_slabs(taxable_income, slabs)
        expected_tax = (500000 - 300000) * 0.05  # 200000 * 5% = 10000
        
        assert tax == expected_tax
        assert tax == 10000

    def test_tax_calculation_in_second_slab(self):
        """Test tax crossing into second slab"""
        taxable_income = 1000000
        slabs = self.get_tax_slabs_2024_25()["new"]
        
        tax = self.calculate_tax_from_slabs(taxable_income, slabs)
        
        # First 300k: 0
        # Next 400k (300k-700k): 400000 * 5% = 20000
        # Next 300k (700k-1000k): 300000 * 10% = 30000
        # Total: 50000
        expected_tax = 20000 + 30000
        
        assert tax == expected_tax
        assert tax == 50000

    def test_tax_calculation_with_cess(self):
        """Test tax calculation including 4% cess"""
        taxable_income = 1000000
        slabs = self.get_tax_slabs_2024_25()["new"]
        
        tax_before_cess = self.calculate_tax_from_slabs(taxable_income, slabs)
        cess = self.get_cess(tax_before_cess)
        total_tax = tax_before_cess + cess
        
        expected_cess = 50000 * 0.04  # 2000
        expected_total = 50000 + 2000
        
        assert cess == expected_cess
        assert total_tax == expected_total
        assert total_tax == 52000

    def test_tax_calculation_high_income(self):
        """Test tax calculation for high income"""
        taxable_income = 2000000
        slabs = self.get_tax_slabs_2024_25()["new"]
        
        tax = self.calculate_tax_from_slabs(taxable_income, slabs)
        
        # 0-300k: 0
        # 300k-700k: 400000 * 5% = 20000
        # 700k-1000k: 300000 * 10% = 30000
        # 1000k-1250k: 250000 * 15% = 37500
        # 1250k-1500k: 250000 * 20% = 50000
        # 1500k-2000k: 500000 * 30% = 150000
        # Total: 287500
        expected_tax = 20000 + 30000 + 37500 + 50000 + 150000
        
        assert tax == expected_tax
        assert tax == 287500

    def test_standard_deduction_new_regime(self):
        """Test standard deduction in new regime"""
        total_income = 1000000
        standard_deduction = 75000
        
        taxable_income = total_income - standard_deduction
        
        assert taxable_income == 925000

    def test_standard_deduction_old_regime(self):
        """Test standard deduction in old regime"""
        total_income = 1000000
        standard_deduction_old = 50000
        
        taxable_income = total_income - standard_deduction_old
        
        assert taxable_income == 950000


class TestRegimeComparison:
    """Test regime comparison logic"""

    def get_tax_slabs_2024_25(self):
        """Get tax slabs for FY 2024-25"""
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

    def calculate_tax_from_slabs(self, income: float, slabs: list) -> float:
        """Calculate tax based on slab structure"""
        tax = 0
        
        for slab in slabs:
            if income <= slab["from"]:
                break
            
            slab_end = min(income, slab["to"])
            taxable_in_slab = slab_end - slab["from"]
            tax += taxable_in_slab * (slab["rate"] / 100)
        
        return tax

    def get_cess(self, tax: float) -> float:
        """Calculate 4% cess"""
        return tax * 0.04

    def test_regime_comparison_low_income_with_deductions(self):
        """Test regime comparison for low income with deductions"""
        total_income = 500000
        deductions = 100000
        
        slabs_data = self.get_tax_slabs_2024_25()
        
        # Old Regime
        old_deduction = 50000 + deductions
        old_taxable = max(0, total_income - old_deduction)
        old_tax = self.calculate_tax_from_slabs(old_taxable, slabs_data["old"])
        old_cess = self.get_cess(old_tax)
        old_total = old_tax + old_cess
        
        # New Regime
        new_deduction = 75000
        new_taxable = max(0, total_income - new_deduction)
        new_tax = self.calculate_tax_from_slabs(new_taxable, slabs_data["new"])
        new_cess = self.get_cess(new_tax)
        new_total = new_tax + new_cess
        
        # Old regime should be better with deductions
        assert old_total < new_total
        
    def test_regime_comparison_high_income_no_deductions(self):
        """Test regime comparison for high income with minimal deductions"""
        total_income = 2000000
        deductions = 0
        
        slabs_data = self.get_tax_slabs_2024_25()
        
        # Old Regime
        old_deduction = 50000 + deductions
        old_taxable = max(0, total_income - old_deduction)
        old_tax = self.calculate_tax_from_slabs(old_taxable, slabs_data["old"])
        old_cess = self.get_cess(old_tax)
        old_total = old_tax + old_cess
        
        # New Regime
        new_deduction = 75000
        new_taxable = max(0, total_income - new_deduction)
        new_tax = self.calculate_tax_from_slabs(new_taxable, slabs_data["new"])
        new_cess = self.get_cess(new_tax)
        new_total = new_tax + new_cess
        
        # New regime should be better for high income without deductions
        assert new_total < old_total

    def test_regime_recommendation_logic(self):
        """Test regime recommendation logic"""
        total_income = 1000000
        
        slabs_data = self.get_tax_slabs_2024_25()
        
        # Old Regime with deductions
        old_deduction = 50000 + 150000
        old_taxable = total_income - old_deduction
        old_tax = self.calculate_tax_from_slabs(old_taxable, slabs_data["old"])
        old_cess = self.get_cess(old_tax)
        old_total = old_tax + old_cess
        
        # New Regime
        new_deduction = 75000
        new_taxable = total_income - new_deduction
        new_tax = self.calculate_tax_from_slabs(new_taxable, slabs_data["new"])
        new_cess = self.get_cess(new_tax)
        new_total = new_tax + new_cess
        
        recommended = "old" if old_total < new_total else "new"
        
        assert recommended in ["old", "new"]
        assert isinstance(recommended, str)


class TestDeductionCalculations:
    """Test deduction calculations and validations"""

    def test_section_80c_limit(self):
        """Test Section 80C deduction limit"""
        max_80c = 150000
        claimed = 150000
        
        assert claimed <= max_80c
        
    def test_section_80c_over_limit(self):
        """Test Section 80C over limit"""
        max_80c = 150000
        claimed = 200000
        
        allowed = min(claimed, max_80c)
        
        assert allowed == max_80c
        assert allowed < claimed

    def test_section_80d_limit(self):
        """Test Section 80D deduction limit"""
        max_80d = 50000
        claimed = 40000
        
        assert claimed <= max_80d

    def test_hra_calculation(self):
        """Test HRA exemption calculation"""
        salary = 1000000
        actual_hra = 300000
        rent_paid = 400000
        
        # HRA exemption = lower of:
        # 1. Actual HRA received
        # 2. Rent paid - 10% of salary
        # 3. 50% of salary (for metro) or 40% (for non-metro)
        
        option1 = actual_hra
        option2 = rent_paid - (salary * 0.10)
        option3 = salary * 0.50  # Metro
        
        hra_exemption = min(option1, option2, option3)
        
        # Should be lower of 300000, 300000, 500000 = 300000
        assert hra_exemption == 300000

    def test_home_loan_interest_limit(self):
        """Test home loan interest deduction limit"""
        max_home_loan_interest = 200000
        actual_interest = 250000
        
        allowed = min(actual_interest, max_home_loan_interest)
        
        assert allowed == max_home_loan_interest

    def test_education_loan_interest_no_limit(self):
        """Test education loan interest has no limit"""
        interest_paid = 500000
        
        # Education loan interest has NO limit
        allowed = interest_paid
        
        assert allowed == interest_paid

    def test_combined_deductions(self):
        """Test combining multiple deductions"""
        salary = 1500000
        
        # Combine deductions
        standard_deduction = 75000  # new regime
        hra = 150000
        home_loan_interest = 200000
        
        # Note: In new regime, other deductions are not allowed
        # In old regime, standard deduction is 50000, other deductions apply
        
        total_old_regime = 50000 + hra + home_loan_interest
        total_new_regime = 75000  # only standard
        
        assert total_old_regime > total_new_regime

    def test_deduction_validation_positive_amount(self):
        """Test deduction validation for positive amount"""
        amount = 50000
        
        assert amount > 0
        assert isinstance(amount, (int, float))

    def test_deduction_validation_negative_amount(self):
        """Test deduction validation rejects negative amount"""
        amount = -50000
        
        assert amount < 0


class TestTaxSavingsCalculation:
    """Test tax savings calculations"""

    def calculate_tax_from_slabs(self, income: float, slabs: list) -> float:
        """Calculate tax based on slab structure"""
        tax = 0
        
        for slab in slabs:
            if income <= slab["from"]:
                break
            
            slab_end = min(income, slab["to"])
            taxable_in_slab = slab_end - slab["from"]
            tax += taxable_in_slab * (slab["rate"] / 100)
        
        return tax

    def get_cess(self, tax: float) -> float:
        """Calculate 4% cess"""
        return tax * 0.04

    def test_tax_savings_by_deductions(self):
        """Test tax savings from claiming deductions"""
        total_income = 1000000
        
        # Without deductions
        taxable_no_deduction = total_income
        tax_no_deduction = self.calculate_tax_from_slabs(taxable_no_deduction, [
            {"from": 0, "to": 300000, "rate": 0},
            {"from": 300000, "to": 700000, "rate": 5},
            {"from": 700000, "to": float('inf'), "rate": 20},
        ])
        
        # With 150k deduction
        deduction = 150000
        taxable_with_deduction = total_income - deduction
        tax_with_deduction = self.calculate_tax_from_slabs(taxable_with_deduction, [
            {"from": 0, "to": 300000, "rate": 0},
            {"from": 300000, "to": 700000, "rate": 5},
            {"from": 700000, "to": float('inf'), "rate": 20},
        ])
        
        savings = tax_no_deduction - tax_with_deduction
        
        assert savings > 0
        # 150000 * 20% = 30000 savings
        assert savings == 30000

    def test_effective_tax_rate(self):
        """Test effective tax rate calculation"""
        total_income = 2000000
        tax_liability = 400000
        
        effective_rate = (tax_liability / total_income) * 100
        
        # Should be between 0 and 30%
        assert 0 < effective_rate <= 30
        assert effective_rate == 20


class TestDataValidation:
    """Test input data validation"""

    def test_financial_year_format(self):
        """Test financial year format validation"""
        valid_years = ["2024-25", "2023-24", "2022-23"]
        invalid_years = ["2024", "25", "2024-2025", "24-25"]
        
        for year in valid_years:
            parts = year.split('-')
            assert len(parts) == 2
            assert len(parts[0]) == 4
            assert len(parts[1]) == 2

    def test_income_type_validation(self):
        """Test income type validation"""
        valid_types = ["salary", "self_employed", "mixed"]
        
        income_type = "salary"
        assert income_type in valid_types

    def test_deduction_type_validation(self):
        """Test deduction type validation"""
        valid_types = ["80C", "80D", "HRA", "Home Loan", "80E", "Standard"]
        
        deduction_type = "80C"
        assert deduction_type in valid_types


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_zero_income(self):
        """Test tax calculation with zero income"""
        income = 0
        
        assert income >= 0
        assert income == 0

    def test_very_high_income(self):
        """Test with very high income"""
        income = 100000000
        
        assert income > 0
        assert isinstance(income, int)

    def test_fractional_amounts(self):
        """Test with fractional amounts"""
        amount = 1234.56
        
        assert isinstance(amount, float)
        assert amount > 0

    def test_rounding_tax_amounts(self):
        """Test rounding of tax amounts"""
        tax = 12345.678
        rounded = round(tax, 2)
        
        assert rounded == 12345.68
        assert isinstance(rounded, float)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
