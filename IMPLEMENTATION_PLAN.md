# FinShield AI - Comprehensive Implementation Plan
## Complete Roadmap for Phases 2-10

*Last Updated: January 2024*
*Status: Phase 1 Complete - Ready for Phase 2*

---

## TABLE OF CONTENTS
1. Phase Breakdown with Dependencies
2. Backend Patterns & Standards
3. Frontend Patterns & Standards
4. Database Schema Requirements
5. Testing Strategy
6. Implementation Order & Sequencing

---

# SECTION 1: PHASE BREAKDOWN WITH DEPENDENCIES

## Overview

The project is organized into 10 phases. Phase 1 (Foundation) is complete. Phases 2-10 follow a structured sequence with clear dependencies.

**Key Principle**: Each phase builds on the previous one. No phase should be started until its dependencies are met.

---

## PHASE 2: SMART BUDGETING 📊

**Estimated Duration**: 1-2 weeks  
**Dependencies**: Phase 1 (COMPLETE)  
**Priority**: High - Foundation for financial data  

### 2.1 Transaction Import System

**Objective**: Allow users to upload and categorize financial transactions.

**Features**:
- CSV file upload UI with drag-and-drop
- Bank statement parsing (CommonWealth, ICICI, HDFC formats)
- SMS alert parsing from bank notifications
- Manual transaction entry form
- Duplicate detection and prevention
- Transaction validation and review interface
- Batch import with error reporting

**Database Changes**:
- `transactions` table: Already exists, may need additional fields for source tracking
- New: `transaction_imports` table to track import batches
- New: `duplicate_detection_rules` table for deduplication

**Backend Endpoints**:
```
POST /api/budget/import - Upload and parse CSV/statement
POST /api/budget/transactions - Add manual transaction
GET /api/budget/transactions - List user's transactions
GET /api/budget/transactions?category=X&month=YYYY-MM - Filter
DELETE /api/budget/transactions/{id} - Remove transaction
PATCH /api/budget/transactions/{id} - Update transaction
```

**Frontend Components**:
- `TransactionImport.tsx` - Upload interface (ALREADY EXISTS)
- `TransactionList.tsx` - Display transactions with filters
- `TransactionForm.tsx` - Manual entry form
- `DuplicateResolver.tsx` - Review and resolve duplicates

**Success Criteria**:
- Import 100+ transactions in < 5 seconds
- 95%+ duplication detection accuracy
- Support for 5+ bank statement formats
- Clear error messages for invalid data

### 2.2 Expense Categorization

**Objective**: Automatically and intelligently categorize expenses.

**Categories** (13 base):
1. Food & Dining
2. Shopping & Retail
3. Transportation
4. Healthcare & Wellness
5. Education
6. Housing & Rent
7. Utilities & Bills
8. Entertainment & Hobbies
9. Investments & Savings
10. Transfers & Gifts
11. Subscriptions
12. Travel
13. Other

**Features**:
- Rule-based auto-categorization (merchant, keywords, patterns)
- AI-assisted classification using Gemini API
- Manual category override by user
- Suggested categories during manual entry
- Category statistics and trends
- Custom category creation (Optional Phase 2B)

**Database Changes**:
- `categorization_rules` table - Store categorization patterns
- New fields in `transaction` model: `category_confidence`, `category_source` (auto/manual/ai)
- `category_suggestions` table (cache for performance)

**Backend Endpoints**:
```
POST /api/budget/categorize - Auto-categorize transaction
GET /api/budget/categories - List all categories
POST /api/budget/categories/rules - Add categorization rule
GET /api/budget/categories/stats - Category-wise statistics
```

**Frontend Components**:
- `CategorySelector.tsx` - Category picker with suggestions
- `CategoryAnalysis.tsx` - Category breakdown and trends
- `CategoryConfidence.tsx` - Show confidence scores

**Categorization Engine**:

Create `app/services/categorization.py`:

```python
class CategorizationService:
    def categorize_transaction(merchant: str, description: str, amount: float) -> dict:
        # Step 1: Check rule-based patterns (fast, deterministic)
        rule_category = apply_rules(merchant, description)
        if rule_category:
            return {"category": rule_category, "confidence": 0.95, "source": "rule"}
        
        # Step 2: Call AI for context-aware classification
        ai_result = call_gemini_categorize(merchant, description)
        return {"category": ai_result["category"], "confidence": ai_result["confidence"], "source": "ai"}
        
    def apply_rules(merchant: str, description: str) -> str | None:
        # Return category if matches known patterns
```

**Success Criteria**:
- 90%+ categorization accuracy
- AI categorization < 200ms per transaction
- Category suggestions appear in UI within 100ms
- Manual overrides persist across imports

### 2.3 Budget Management

**Objective**: Allow users to set and track budgets at multiple levels.

**Features**:
- Monthly income entry
- Total budget amount setting
- Category-level budget allocation
- Budget vs. actual tracking
- Remaining budget display with visual indicators
- Budget alerts (when 75%, 90%, 100% spent)
- Monthly budget history and trends

**Database Changes**:
- `budgets` table: Already exists
- `category_budgets` table: Already exists
- New: `budget_alerts` table to track alerts shown
- New: `budget_history` table for historical snapshots

**Backend Endpoints**:
```
POST /api/budget/set - Create/update budget for month
GET /api/budget/current - Get current month budget
GET /api/budget/{month} - Get budget for specific month
GET /api/budget/comparison?month1=X&month2=Y - Compare months
POST /api/budget/category - Set category budget
GET /api/budget/alerts - Get current alerts
```

**Frontend Components**:
- `BudgetSetup.tsx` - Initial budget creation wizard
- `BudgetDashboard.tsx` - Current budget overview (ALREADY EXISTS)
- `CategoryBudgets.tsx` - Category-level budget allocation
- `BudgetProgress.tsx` - Visual progress indicators
- `BudgetAlerts.tsx` - Alert display and management

**Budget Model**:
```
Budget:
  - id: UUID
  - user_id: UUID
  - month: YYYY-MM
  - total_income: float
  - total_budget: float
  - savings_target: float
  - category_budgets: [CategoryBudget]
```

**Success Criteria**:
- Budget CRUD operations work smoothly
- Real-time calculation of remaining budget
- Alerts trigger correctly at thresholds
- Budget history available for 12 months

### 2.4 Spending Analysis & Insights

**Objective**: Provide AI-powered analysis of spending patterns.

**Features**:
- Category-wise spending breakdown with charts
- Month-to-month spending comparisons
- Trend analysis (increasing/decreasing categories)
- Anomaly detection (unusual spending)
- Recurring expense identification
- Expense suggestions for reduction
- Savings opportunity identification

**Database Changes**:
- New: `spending_anomalies` table to cache detected anomalies
- New: `recurring_expenses` table to store identified patterns
- New: `spending_insights` table to cache AI insights

**Backend Endpoints**:
```
GET /api/budget/insights - AI spending insights (ALREADY EXISTS)
POST /api/budget/analysis - Detailed spending analysis
GET /api/budget/anomalies - Detected unusual spending
GET /api/budget/recurring - Identified recurring expenses
POST /api/budget/suggestions - Get AI reduction suggestions
```

**Frontend Components**:
- `SpendingInsights.tsx` - Insights display (ALREADY EXISTS)
- `CategoryChart.tsx` - Category breakdown visualization
- `TrendChart.tsx` - Month-to-month comparison
- `AnomalyAlerts.tsx` - Alert on unusual patterns
- `SavingsSuggestions.tsx` - Actionable recommendations

**Insights Engine**:

Create `app/services/insights.py`:

```python
class InsightsService:
    def generate_insights(user_id: str, db: Session) -> dict:
        # Analyze spending patterns
        categories = get_category_breakdown(user_id)
        trends = analyze_trends(user_id)
        anomalies = detect_anomalies(user_id)
        recurring = identify_recurring(user_id)
        
        return {
            "top_categories": categories[:5],
            "trends": trends,
            "anomalies": anomalies,
            "recurring_expenses": recurring,
            "saving_opportunities": generate_suggestions(...)
        }
    
    def detect_anomalies(user_id: str) -> list:
        # Find transactions that deviate from patterns
        # Use statistical methods + AI analysis
```

**Success Criteria**:
- Insights generate in < 2 seconds
- 80%+ accuracy in anomaly detection
- Recurring expense identification works
- Insights appear immediately after transaction import

### 2.5 Financial Reports

**Objective**: Generate comprehensive, exportable financial reports.

**Features**:
- Monthly budget report (PDF, CSV)
- Expense breakdown report
- Income vs. Expense report
- Savings report
- Category-wise detailed report
- Custom date range reports
- Report scheduling/automation

**Backend Endpoints**:
```
POST /api/budget/reports/monthly - Generate monthly report
POST /api/budget/reports/expense-breakdown - Expense report
POST /api/budget/reports/custom - Custom date range report
GET /api/budget/reports - List available reports
POST /api/budget/reports/{id}/export?format=pdf|csv - Download
```

**Frontend Components**:
- `ReportGenerator.tsx` - Report creation wizard
- `ReportPreview.tsx` - Preview before download
- `ReportHistory.tsx` - Past reports list
- `ReportDownload.tsx` - Export interface

**Database Changes**:
- New: `financial_reports` table to store generated reports

**Success Criteria**:
- PDF generation < 5 seconds
- Reports include all relevant data
- Export formats: PDF, CSV working
- Report history accessible

---

## PHASE 3: INVESTMENT & PORTFOLIO 📈

**Estimated Duration**: 2-3 weeks  
**Dependencies**: Phase 1 (Complete), Phase 2 (Complete)  
**Priority**: High - Core financial module  

### 3.1 Investment Education Hub

**Objective**: Build comprehensive, beginner-friendly investment education.

**Content Topics**:
- What is SIP (Systematic Investment Plan)
- Mutual Funds explained
- Index Funds and ETFs
- Fixed Deposits (FD) and Recurring Deposits
- Stock Market basics
- Bonds and Fixed Income
- Diversification principles
- Compound interest
- Risk and Volatility
- Asset classes overview

**Features**:
- Interactive lessons with examples
- Real numbers calculator demonstrations
- Visual diagrams and explanations
- Interactive quizzes
- Glossary of terms
- Use-case scenarios

**Backend Endpoints**:
```
GET /api/investments/education/topics - List topics
GET /api/investments/education/topic/{slug} - Get topic content
POST /api/investments/education/quiz/{topic_id} - Submit quiz
```

**Database Changes**:
- New: `education_topics` table
- New: `education_content` table (HTML/Markdown)
- New: `education_quizzes` table
- New: `user_education_progress` table (track user progress)

**Frontend Components**:
- `EducationHub.tsx` - Main learning interface
- `LessonView.tsx` - Individual lesson display
- `InteractiveCalculator.tsx` - Calculator demos
- `QuizComponent.tsx` - Quiz display and submission
- `GlossarySearch.tsx` - Term search

**Success Criteria**:
- All 10 topics covered comprehensively
- Interactive calculators working
- Quiz completion tracking functional

### 3.2 Portfolio Management

**Objective**: Allow users to input, track, and analyze investments.

**Features**:
- Manual investment entry (category, name, purchase value, units, date)
- Portfolio statement upload and parsing
- Current portfolio dashboard
- Asset allocation visualization
- Portfolio value tracking
- Historical performance tracking
- Valuation alerts

**Database Changes**:
- `investments` table: Already exists, may need enhancement
- New: `portfolio_snapshots` table - Daily snapshots for tracking
- New: `portfolio_statements` table - Uploaded statements
- New: `investment_valuations` table - Current values

**Backend Endpoints**:
```
GET /api/investments/portfolio - Get full portfolio
POST /api/investments/holdings - Add investment
PATCH /api/investments/holdings/{id} - Update investment
DELETE /api/investments/holdings/{id} - Remove investment
GET /api/investments/portfolio/valuation - Get current valuation
POST /api/investments/portfolio/statement - Upload statement
GET /api/investments/portfolio/allocation - Asset allocation
GET /api/investments/portfolio/performance - Performance metrics
```

**Frontend Components**:
- `PortfolioDashboard.tsx` - Portfolio overview
- `HoldingsTable.tsx` - Detailed holdings list
- `AllocationChart.tsx` - Pie chart of asset allocation
- `PerformanceChart.tsx` - Historical performance graph
- `InvestmentForm.tsx` - Add/edit investment
- `PortfolioSummary.tsx` - Summary statistics

**Portfolio Model**:
```
Portfolio:
  - total_invested: float
  - current_value: float
  - total_gain_loss: float
  - gain_loss_percentage: float
  - holdings: [Investment]
  - allocation: {category: percentage}
```

**Success Criteria**:
- Portfolio CRUD operations work
- Valuation calculation accurate
- Performance metrics display correctly
- Upload and parse portfolio statements

### 3.3 Risk Analysis Engine

**Objective**: Analyze and explain portfolio risks.

**Risk Metrics**:
- Concentration risk (% in single investment)
- Diversification score (0-100)
- Asset allocation review
- Volatility analysis
- Liquidity considerations

**Features**:
- Risk score calculation
- Concentration analysis
- Diversification recommendations
- Risk-level assignment (Low/Moderate/High/Severe)
- Explanation of each risk factor
- Actionable recommendations

**Backend Endpoints**:
```
GET /api/investments/risk - Get portfolio risk analysis
POST /api/investments/risk/analyze - Detailed risk analysis
GET /api/investments/risk/recommendations - Risk mitigation suggestions
```

**Frontend Components**:
- `RiskDashboard.tsx` - Risk overview
- `RiskMetrics.tsx` - Individual risk metrics
- `ConcentrationAnalysis.tsx` - Concentration risk visual
- `DiversificationScore.tsx` - Diversification gauge
- `RiskRecommendations.tsx` - Suggestions

**Risk Analysis Engine**:

Create `app/services/risk_analyzer.py`:

```python
class RiskAnalyzer:
    def calculate_portfolio_risk(portfolio: Portfolio) -> dict:
        concentration_risk = calculate_concentration(portfolio)
        diversification_score = calculate_diversification(portfolio)
        volatility = estimate_volatility(portfolio)
        
        overall_risk = aggregate_risks(concentration, diversification, volatility)
        
        return {
            "concentration_risk": concentration_risk,
            "diversification_score": diversification_score,
            "volatility": volatility,
            "overall_risk_level": overall_risk["level"],
            "recommendations": generate_recommendations(...)
        }
```

**Success Criteria**:
- Risk scores calculated correctly
- Recommendations are actionable
- Risk level assignments appropriate
- Explanations clear and educational

### 3.4 Investment Calculators

**Objective**: Provide calculators for investment planning.

**Calculators**:
1. **SIP Calculator** - Calculate returns from regular investments
2. **Lumpsum Calculator** - Calculate returns from one-time investment
3. **FD Calculator** - Fixed deposit returns
4. **Compound Interest Calculator** - General CI calculation
5. **Goal-Based Calculator** - How much to invest to reach goal

**Features**:
- Input validation
- Real-time calculation
- Multiple scenarios
- Assumption display
- Result export

**Backend Endpoints**:
```
POST /api/investments/calculators/sip - SIP calculation
POST /api/investments/calculators/lumpsum - Lumpsum calculation
POST /api/investments/calculators/fd - FD calculation
POST /api/investments/calculators/compound-interest - CI calculation
POST /api/investments/calculators/goal - Goal-based calculation
```

**Frontend Components**:
- `SIPCalculator.tsx`
- `LumpsumCalculator.tsx`
- `FDCalculator.tsx`
- `CompoundInterestCalculator.tsx`
- `GoalBasedCalculator.tsx`
- `CalculatorResults.tsx`

**Calculator Service**:

Create `app/services/calculators.py`:

```python
class CalculatorService:
    @staticmethod
    def sip_calculator(monthly_investment: float, rate_of_return: float, years: int) -> dict:
        # Calculate future value of SIP
        months = years * 12
        monthly_rate = rate_of_return / 12 / 100
        fv = monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
        invested = monthly_investment * months
        gain = fv - invested
        return {"future_value": fv, "invested": invested, "gain": gain}
```

**Success Criteria**:
- All 5 calculators working correctly
- Results match standard formulas
- UI is intuitive
- Assumptions clearly displayed

### 3.5 Portfolio Reports

**Objective**: Generate comprehensive portfolio reports.

**Report Types**:
- Holdings report (list of all investments)
- Performance report (gains/losses)
- Risk assessment report
- Diversification report
- Comparison report (period-to-period)

**Features**:
- PDF generation
- CSV export
- Snapshot at report date
- Historical comparison

**Backend Endpoints**:
```
POST /api/investments/reports/holdings - Holdings report
POST /api/investments/reports/performance - Performance report
POST /api/investments/reports/risk - Risk report
POST /api/investments/reports/diversification - Diversification report
```

**Success Criteria**:
- Reports generate correctly
- PDF export working
- Historical data available
- Reports are professionally formatted

---

## PHASE 4: TRADING & MARKET INSIGHTS 📊

**Estimated Duration**: 2-3 weeks  
**Dependencies**: Phase 3 (Complete)  
**Priority**: Medium - Advanced/optional feature  

### 4.1 Market Data Integration

**Objective**: Provide historical market data and charts.

**Features**:
- Historical price data for NSE stocks
- OHLCV data (Open, High, Low, Close, Volume)
- Chart rendering (line, candlestick)
- Technical indicator support
- Data attribution
- Last update timestamp

**Data Source**:
- NSE historical data (verified/licensed source)
- Daily updates at market close
- 5-year historical minimum

**Backend Endpoints**:
```
GET /api/markets/historical?symbol=INFY&from=X&to=Y - Get historical data
GET /api/markets/symbols - List available symbols
GET /api/markets/data/{symbol} - Latest data for symbol
```

**Database Changes**:
- New: `market_data` table - Store OHLCV data
- New: `market_symbols` table - List of available symbols
- Indexes on symbol and date for performance

**Frontend Components**:
- `HistoricalChart.tsx` - Price chart visualization
- `SymbolSearch.tsx` - Symbol search and selection
- `DataAttribution.tsx` - Show data source info
- `ChartControls.tsx` - Chart type selector, zoom, etc.

**Success Criteria**:
- Data loads for all NSE stocks
- Charts render smoothly
- Data is current (updated daily)
- Attribution clear

### 4.2 Technical Indicators

**Objective**: Calculate and display technical indicators.

**Indicators**:
1. Simple Moving Average (SMA)
2. Exponential Moving Average (EMA)
3. Relative Strength Index (RSI)
4. MACD (Moving Average Convergence Divergence)
5. Bollinger Bands
6. Volume analysis

**Features**:
- Customizable periods
- Multiple indicators simultaneously
- Explanation of each indicator
- Formula display
- Historical calculation

**Backend Endpoints**:
```
POST /api/markets/indicators/sma - Calculate SMA
POST /api/markets/indicators/ema - Calculate EMA
POST /api/markets/indicators/rsi - Calculate RSI
POST /api/markets/indicators/macd - Calculate MACD
POST /api/markets/indicators/bollinger - Calculate Bollinger Bands
```

**Frontend Components**:
- `TechnicalIndicators.tsx` - Indicator selector
- `IndicatorChart.tsx` - Display on chart
- `IndicatorExplanation.tsx` - How indicator works
- `IndicatorFormula.tsx` - Mathematical formula

**Indicator Calculation Service**:

Create `app/services/technical_indicators.py`:

```python
class TechnicalIndicators:
    @staticmethod
    def calculate_sma(data: list, period: int) -> list:
        return [sum(data[i:i+period])/period for i in range(len(data)-period+1)]
    
    @staticmethod
    def calculate_rsi(data: list, period: int = 14) -> list:
        # Calculate RSI using gain/loss averages
        pass
    
    @staticmethod
    def calculate_macd(data: list) -> dict:
        # Calculate MACD line, signal line, histogram
        pass
```

**Success Criteria**:
- All indicators calculate correctly
- Formulas match technical analysis standards
- Performance acceptable (< 500ms)
- Explanations are clear

### 4.3 Strategy Backtesting

**Objective**: Allow users to test trading strategies on historical data.

**Features**:
- Strategy selector (Moving Average Crossover, RSI-based, MACD-based)
- Parameter configuration
- Date range selection
- Backtesting engine execution
- Results display (trades, P&L, metrics)
- Drawdown analysis
- Transaction history

**Strategies Implemented**:
1. **Moving Average Crossover**: Buy when fast MA crosses above slow MA
2. **RSI Strategy**: Buy when RSI < 30 (oversold), Sell when RSI > 70 (overbought)
3. **MACD Strategy**: Buy when MACD crosses signal line upward

**Database Changes**:
- New: `backtest_results` table
- New: `backtest_trades` table

**Backend Endpoints**:
```
POST /api/trading/backtest - Run backtest
GET /api/trading/backtest/{id} - Get backtest results
POST /api/trading/backtest/{id}/trades - Get trades from backtest
```

**Frontend Components**:
- `BacktestSetup.tsx` - Strategy and parameter selection
- `BacktestResults.tsx` - Results display
- `PerformanceMetrics.tsx` - Backtest metrics
- `TradeHistory.tsx` - List of trades executed
- `DrawdownAnalysis.tsx` - Drawdown visualization

**Backtesting Engine**:

Create `app/services/backtester.py`:

```python
class BacktestEngine:
    def run_backtest(symbol: str, strategy_name: str, params: dict, from_date: str, to_date: str) -> dict:
        # Get historical data
        data = get_market_data(symbol, from_date, to_date)
        
        # Initialize portfolio
        portfolio = {"cash": 100000, "shares": 0, "trades": []}
        
        # Run strategy on each day
        for i in range(len(data)):
            signal = strategy.evaluate(data[:i+1], params)
            if signal == "BUY":
                # Execute buy
            elif signal == "SELL":
                # Execute sell
        
        return calculate_metrics(portfolio)
```

**Success Criteria**:
- Backtests run successfully
- Metrics calculated correctly
- Performance metrics accurate
- Results clearly displayed

### 4.4 Paper Trading

**Objective**: Simulate trading without real money.

**Features**:
- Virtual starting capital (e.g., ₹100,000)
- Buy/Sell order execution
- Open positions tracking
- Closed positions with P&L
- Trading history
- Performance dashboard
- Clear "SIMULATED" labeling

**Database Changes**:
- New: `paper_trading_accounts` table
- New: `paper_orders` table
- New: `paper_positions` table

**Backend Endpoints**:
```
POST /api/trading/paper/account - Create paper trading account
GET /api/trading/paper/account - Get account details
POST /api/trading/paper/orders - Place order
GET /api/trading/paper/orders - Get order history
GET /api/trading/paper/positions - Get open positions
GET /api/trading/paper/closed - Get closed positions
GET /api/trading/paper/performance - Performance metrics
```

**Frontend Components**:
- `PaperTradingDashboard.tsx` - Account overview
- `OrderPlacement.tsx` - Buy/Sell form
- `OpenPositions.tsx` - Current holdings
- `ClosedPositions.tsx` - Historical trades
- `PerformanceDashboard.tsx` - P&L tracking

**Success Criteria**:
- Paper trading accounts create successfully
- Orders execute correctly
- P&L calculations accurate
- "SIMULATED" labeling prominent

### 4.5 Market Analysis

**Objective**: Analyze historical market trends and patterns.

**Features**:
- Price trend analysis
- Volume analysis
- Pattern recognition (head and shoulders, triangles, etc.)
- Comparison with indices
- Historical events correlation
- Market sentiment analysis

**Backend Endpoints**:
```
GET /api/markets/analysis/{symbol} - Market analysis
POST /api/markets/patterns - Pattern detection
```

**Success Criteria**:
- Analysis generates correctly
- Patterns detected accurately
- Comparisons meaningful

---

## PHASE 5: TAX ASSISTANT 💰

**Estimated Duration**: 2-3 weeks  
**Dependencies**: Phase 1 (Complete), Phase 2 (Complete)  
**Priority**: Medium-High - India-specific, regulatory  

### 5.1 Tax Profile Setup

**Objective**: Collect user tax information.

**Features**:
- Financial year selection (FY 2023-24, etc.)
- Residency status (Resident Indian, NRI, etc.)
- Salary income entry
- Other income forms (freelance, business, rental, etc.)
- Deduction tracking
- Exemption management

**Database Changes**:
- New: `tax_profiles` table
- New: `tax_income` table
- New: `tax_deductions` table
- New: `tax_exemptions` table

**Backend Endpoints**:
```
POST /api/tax/profile - Create tax profile
GET /api/tax/profile - Get tax profile
PATCH /api/tax/profile - Update tax profile
POST /api/tax/income - Add income
GET /api/tax/income - List income
```

**Frontend Components**:
- `TaxProfileSetup.tsx` - Initial setup wizard
- `IncomeEntry.tsx` - Income entry form
- `DeductionTracker.tsx` - Deduction management
- `ProfileSummary.tsx` - Profile overview

**Success Criteria**:
- Tax profile CRUD working
- All income types supported
- Data validation working

### 5.2 Tax Calculation Engine

**Objective**: Calculate accurate income tax based on Indian tax law.

**Features**:
- Tax slab implementation (current FY)
- Old regime calculation
- New regime calculation
- Deduction application
- Tax liability calculation
- Assumptions display
- Multiple scenario support

**Database Changes**:
- New: `tax_slabs` table (versioned)
- New: `tax_rules` table (versioned)
- New: `tax_calculations` table (store results)

**Tax Calculation Logic**:

Create `app/services/tax_calculator.py`:

```python
class TaxCalculator:
    # For 2023-24 (Example)
    OLD_REGIME_SLABS = [
        (250000, 0),
        (500000, 0.05),
        (1000000, 0.20),
        (float('inf'), 0.30)
    ]
    
    NEW_REGIME_SLABS = [
        (300000, 0),
        (600000, 0.05),
        (900000, 0.10),
        (1200000, 0.15),
        (1500000, 0.20),
        (2500000, 0.30),
        (float('inf'), 0.35)
    ]
    
    def calculate_old_regime_tax(income: float, deductions: float) -> float:
        taxable_income = income - deductions
        tax = 0
        for limit, rate in OLD_REGIME_SLABS:
            if taxable_income <= limit:
                tax += taxable_income * rate
                break
            else:
                tax += limit * rate
                taxable_income -= limit
        return tax + (tax * 0.04)  # + Health and Education Cess
    
    def calculate_new_regime_tax(income: float) -> float:
        # New regime: No deductions except basic
        taxable_income = income
        tax = 0
        for limit, rate in NEW_REGIME_SLABS:
            if taxable_income <= limit:
                tax += taxable_income * rate
                break
            else:
                tax += limit * rate
                taxable_income -= limit
        return tax + (tax * 0.04)
```

**Backend Endpoints**:
```
POST /api/tax/calculate - Calculate tax
POST /api/tax/compare-regimes - Compare old vs new regime
GET /api/tax/rules - Get applicable tax rules
```

**Frontend Components**:
- `TaxCalculator.tsx` - Calculation interface
- `RegimeComparison.tsx` - Old vs New comparison
- `TaxSummary.tsx` - Results display
- `AssumptionsDisplay.tsx` - Show assumptions

**Success Criteria**:
- Tax calculations match official guidelines
- Both regimes calculated correctly
- Comparison is accurate
- Assumptions clearly shown

### 5.3 Deduction Assistant

**Objective**: Guide users through available deductions.

**Deduction Categories**:
- Section 80C (Life insurance, PF, education, etc.) - Max ₹1.5 lakh
- Section 80D (Health insurance) - ₹25K-₹75K
- Section 80E (Education loan interest) - No limit
- Section 80TTA (Savings interest) - Max ₹10K
- Standard deduction (FY 2023-24: ₹50K)
- HRA deduction
- Interest deductions
- Loss from house property

**Features**:
- Deduction eligibility checker
- Deduction optimizer
- Missing information alerts
- Proof requirements checklist
- Deduction explanation
- "What-if" scenarios

**Backend Endpoints**:
```
GET /api/tax/deductions - List available deductions
POST /api/tax/deductions/optimizer - Optimize deductions
POST /api/tax/deductions/check - Check eligibility
```

**Frontend Components**:
- `DeductionGuide.tsx` - Guide interface
- `EligibilityChecker.tsx` - Check deductions
- `DeductionOptimizer.tsx` - Suggestions
- `ProofChecklist.tsx` - Required documents
- `DeductionExplainer.tsx` - Educational content

**Success Criteria**:
- Deduction calculation correct
- Eligibility checking accurate
- Optimizer suggestions valuable
- UI is easy to use

### 5.4 Regime Comparison

**Objective**: Help users choose the better tax regime.

**Features**:
- Side-by-side comparison
- Tax difference highlighting
- Recommendation (with reasoning)
- Break-even analysis
- Year-over-year comparison
- Scenario modeling

**Frontend Components**:
- `RegimeComparison.tsx` - Main comparison UI
- `ComparisonChart.tsx` - Visual comparison
- `Recommendation.tsx` - AI recommendation
- `BreakEvenAnalysis.tsx` - Break-even point

**Success Criteria**:
- Comparison clear and accurate
- Recommendation helpful
- Break-even point calculated correctly

### 5.5 Tax Reports

**Objective**: Generate comprehensive tax reports.

**Report Types**:
- Tax summary report
- Deduction breakdown
- Regime comparison report
- Calculation breakdown
- Compliance checklist

**Backend Endpoints**:
```
POST /api/tax/reports/summary - Generate summary
POST /api/tax/reports/export?format=pdf - Export report
```

**Success Criteria**:
- Reports generate correctly
- PDF export working
- Reports are comprehensive

---

## PHASE 6: FRAUD DETECTION 🚨

**Estimated Duration**: 3-4 weeks  
**Dependencies**: Phase 1 (Complete)  
**Priority**: High - Security-critical  

### 6.1 Evidence Upload System

**Objective**: Allow users to submit various types of evidence.

**Supported Evidence Types**:
- SMS text (copy/paste)
- WhatsApp message
- Screenshot (JPG/PNG)
- URL
- Call transcript
- Audio file (converted to text)
- Email text

**Features**:
- Multi-format support
- Drag-and-drop upload
- OCR for images
- Speech-to-text for audio
- File validation
- Evidence review before submission

**Database Changes**:
- New: `evidence` table
- New: `evidence_attachments` table (for files)

**Backend Endpoints**:
```
POST /api/fraud/evidence/upload - Upload evidence
GET /api/fraud/evidence/{id} - Get evidence details
DELETE /api/fraud/evidence/{id} - Remove evidence
```

**Frontend Components**:
- `EvidenceUpload.tsx` - Upload interface
- `EvidenceReview.tsx` - Review before submit
- `EvidenceGallery.tsx` - Display uploaded evidence

**File Processing**:

Create `app/services/file_processor.py`:

```python
class FileProcessor:
    @staticmethod
    def extract_text_from_image(image_path: str) -> str:
        # Use OCR (pytesseract or similar)
        pass
    
    @staticmethod
    def transcribe_audio(audio_path: str) -> str:
        # Use speech-to-text (Google Cloud or similar)
        pass
    
    @staticmethod
    def parse_email(email_text: str) -> dict:
        # Parse email structure
        pass
```

**Success Criteria**:
- All file types upload successfully
- OCR and transcription working
- Evidence stored securely
- Review interface intuitive

### 6.2 Fraud Analysis Engine

**Objective**: Detect and explain suspicious patterns.

**Scam Indicators to Detect**:
1. **Urgency** - "Act now", "Limited time", "Immediate action required"
2. **Authority Impersonation** - Claims to be bank, govt, police
3. **Fear/Threats** - "Account will be closed", "Legal action"
4. **Secrecy Requests** - "Don't tell anyone", "Keep it secret"
5. **OTP/PIN Request** - Banks never ask for OTP/PIN/CVV
6. **Unusual Account Requests** - "Transfer to different account"
7. **Phishing Links** - Suspicious URLs, URL shorteners
8. **Investment Promises** - "Guaranteed returns", "Quick money"
9. **Overpayment Scams** - "Refund excess amount"
10. **Social Engineering** - Building trust before request
11. **Tech Support Scams** - "Your device has virus"
12. **Romance/Catfishing** - Emotional manipulation

**Features**:
- Indicator detection
- Risk scoring (Low/Moderate/High/Critical)
- Explanation generation
- Related indicators display
- Confidence levels
- Suspicious URL detection

**Database Changes**:
- New: `fraud_indicators` table (reference table)
- New: `fraud_detections` table (detection results)
- New: `scam_patterns` table (known patterns)

**Backend Endpoints**:
```
POST /api/fraud/analyze - Analyze evidence
GET /api/fraud/indicators - List indicators
POST /api/fraud/url-check - Check URL safety
```

**Fraud Detection Service**:

Create `app/services/fraud_detector.py`:

```python
class FraudDetector:
    INDICATORS = {
        "urgency": ["act now", "limited time", "immediately", "urgent"],
        "authority": ["bank", "rbi", "police", "cyber crime", "official"],
        "threat": ["close account", "legal action", "police case"],
        "secrecy": ["don't tell", "keep secret", "confidential"],
        "otp_request": ["otp", "pin", "cvv", "password"],
        ...
    }
    
    def analyze_text(text: str) -> dict:
        detected_indicators = []
        risk_score = 0
        
        text_lower = text.lower()
        
        for indicator_type, keywords in INDICATORS.items():
            if any(kw in text_lower for kw in keywords):
                detected_indicators.append(indicator_type)
                risk_score += get_weight(indicator_type)
        
        risk_level = calculate_risk_level(risk_score, len(detected_indicators))
        
        return {
            "indicators": detected_indicators,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "explanation": generate_explanation(detected_indicators)
        }
    
    def calculate_risk_level(score: float, indicator_count: int) -> str:
        if score >= 8 or (indicator_count >= 3 and score >= 5):
            return "CRITICAL"
        elif score >= 5:
            return "HIGH"
        elif score >= 3:
            return "MODERATE"
        else:
            return "LOW"
```

**Frontend Components**:
- `FraudAnalysis.tsx` - Analysis results
- `IndicatorList.tsx` - Detected indicators
- `RiskIndicator.tsx` - Risk level display
- `Explanation.tsx` - Why it's flagged
- `ActionRecommendations.tsx` - What to do

**Success Criteria**:
- Fraud detection accuracy > 80%
- Analysis generates < 500ms
- Risk levels appropriate
- Explanations clear and helpful

### 6.3 Investigation Tools

**Objective**: Help users investigate suspected scams.

**Features**:
- Link related evidence
- Build timeline
- Map relationships
- Display patterns
- Identify gaps
- Export investigation

**Database Changes**:
- New: `investigations` table (already exists, enhance)
- New: `investigation_evidence` table (junction)
- New: `evidence_relationships` table

**Backend Endpoints**:
```
POST /api/fraud/investigations - Create investigation
POST /api/fraud/investigations/{id}/link - Link evidence
GET /api/fraud/investigations/{id} - Get investigation
POST /api/fraud/investigations/{id}/analyze - Analyze pattern
```

**Frontend Components**:
- `InvestigationView.tsx` - Investigation display
- `EvidenceTimeline.tsx` - Chronological timeline
- `RelationshipGraph.tsx` - Evidence connections
- `GapAnalysis.tsx` - Missing information

**Success Criteria**:
- Investigations organize evidence well
- Timeline accurate
- Relationships displayed clearly
- Pattern analysis working

### 6.4 Pre-Payment Safety Checkpoint

**Objective**: Verify payment safety before transactions.

**Features**:
- Amount entry
- Recipient familiarity assessment
- Payment purpose verification
- Source verification
- Communication method review
- Urgency assessment
- Independent verification checklist

**Backend Endpoints**:
```
POST /api/fraud/payment-check - Check payment safety
```

**Frontend Components**:
- `PaymentCheckForm.tsx` - Questionnaire
- `SafetyCheckResults.tsx` - Results
- `VerificationChecklist.tsx` - Items to verify
- `RedFlags.tsx` - Warning signs detected

**Safety Checklist Model**:

```
Payment Safety Checklist:
☐ Do you know the recipient personally?
☐ Have you verified contact through official channel?
☐ Is the payment request expected?
☐ Is there unusual urgency?
☐ Is OTP/PIN/CVV requested?
☐ Is amount different from agreed?
☐ Can you verify through official number?
☐ Have others warned you?
```

**Success Criteria**:
- Checklist comprehensive
- Red flags detected
- Recommendations actionable
- Results clear

### 6.5 FINSHIELD RESCUE

**Objective**: Provide emergency assistance if fraud occurred.

**Features**:
- Incident details collection
- Evidence attachment
- Actions taken tracking
- Bank contact information
- Official authority contacts
- Recovery guidance
- Incident report generation

**Workflow**:

```
1. User reports incident
2. System collects details (date, amount, method, etc.)
3. Evidence upload and analysis
4. Automatic guidance generation
5. Bank/authority contact info provided
6. Recovery steps outlined
7. Report generated for record
```

**Database Changes**:
- New: `rescue_cases` table
- New: `rescue_case_evidence` table
- New: `rescue_actions_taken` table

**Backend Endpoints**:
```
POST /api/fraud/rescue - Create rescue case
GET /api/fraud/rescue/{id} - Get case details
POST /api/fraud/rescue/{id}/action - Record action taken
GET /api/fraud/rescue/{id}/report - Generate report
```

**Frontend Components**:
- `RescueWizard.tsx` - Multi-step incident form
- `RescueGuidance.tsx` - Guidance display
- `BankContacts.tsx` - Contact information
- `RecoverySteps.tsx` - Step-by-step instructions
- `IncidentReport.tsx` - Downloadable report

**Guidance Template**:

```
IMMEDIATE ACTIONS:
1. Stop further transactions
2. Note transaction reference/UPI ID
3. Don't delete any evidence
4. Collect bank transaction details

BANK CONTACT:
- [Bank name] Customer Care: [Phone]
- File complaint through: [URL]
- Reference: [transaction details]

AUTHORITIES TO CONTACT:
- National Cyber Crime Portal: https://www.cybercrime.gov.in/
- Local Police: File FIR
- RBI: File complaint at https://www.rbi.org.in/

RECOVERY PROCESS:
- Banks typically respond within 10 days
- Follow up if no response in 15 days
- Document all communications
- Escalate to ombudsman if needed
```

**Success Criteria**:
- Rescue workflow smooth and clear
- Guidance comprehensive
- Contact info accurate and current
- Reports helpful for authorities

---

## PHASE 7: SMALL BUSINESS FINANCE 💼

**Estimated Duration**: 2-3 weeks  
**Dependencies**: Phase 1 (Complete), Phase 2 (Complete)  
**Priority**: Medium - Specialized module  

### 7.1 Business Profile Setup

**Objective**: Configure business information.

**Features**:
- Business name and category
- GST registration details
- Contact information
- Financial year setup
- Bank details (optional)

**Database Changes**:
- `business_profiles` table: Already exists, enhance

**Backend Endpoints**:
```
POST /api/business/profile - Create profile
GET /api/business/profile - Get profile
PATCH /api/business/profile - Update profile
```

**Frontend Components**:
- `BusinessProfileSetup.tsx` - Setup wizard
- `ProfileView.tsx` - Profile display

**Success Criteria**:
- Profile CRUD working
- All fields validated
- GST number validated

### 7.2 GST Invoice Generator

**Objective**: Generate compliant GST invoices.

**Features**:
- Invoice creation form
- Customer details
- Product/service entry
- Quantity and price
- GST rate selection
- Automatic tax calculation
- Invoice PDF generation
- Invoice numbering
- Duplicate prevention

**Database Changes**:
- New: `invoices` table
- New: `invoice_items` table
- New: `invoice_templates` table (for customization)

**Backend Endpoints**:
```
POST /api/business/invoices - Create invoice
GET /api/business/invoices - List invoices
GET /api/business/invoices/{id} - Get invoice details
POST /api/business/invoices/{id}/pdf - Generate PDF
DELETE /api/business/invoices/{id} - Delete invoice
```

**Frontend Components**:
- `InvoiceCreator.tsx` - Invoice creation form
- `ItemEntry.tsx` - Line item entry
- `InvoicePreview.tsx` - Preview before generation
- `InvoiceGallery.tsx` - List of invoices
- `InvoicePDF.tsx` - PDF display

**GST Calculation Engine**:

Create `app/services/gst_calculator.py`:

```python
class GSTCalculator:
    # Standard GST rates for 2024
    GST_RATES = {
        "0": 0.00,      # Essential items
        "5": 0.05,      # Common items
        "12": 0.12,     # Regular items
        "18": 0.18,     # Most items
        "28": 0.28,     # Luxury items
    }
    
    def calculate_invoice_tax(items: list) -> dict:
        """
        items = [
            {"description": "...", "quantity": 1, "unit_price": 100, "gst_rate": "18"},
            ...
        ]
        """
        subtotal = 0
        sgst_total = 0
        cgst_total = 0
        igst_total = 0
        
        line_items_calc = []
        
        for item in items:
            line_total = item["quantity"] * item["unit_price"]
            gst_rate = GST_RATES[str(item["gst_rate"])]
            gst_amount = line_total * gst_rate
            
            sgst = gst_amount / 2  # SGST = 50%
            cgst = gst_amount / 2  # CGST = 50%
            
            line_items_calc.append({
                "subtotal": line_total,
                "sgst": sgst,
                "cgst": cgst,
                "total": line_total + gst_amount
            })
            
            subtotal += line_total
            sgst_total += sgst
            cgst_total += cgst
        
        return {
            "subtotal": subtotal,
            "sgst": sgst_total,
            "cgst": cgst_total,
            "total_gst": sgst_total + cgst_total,
            "grand_total": subtotal + sgst_total + cgst_total,
            "items": line_items_calc
        }
```

**Invoice Template**:

```
INVOICE

[Business Name]
[Address]
GST: [GST Number]

Date: [Date]
Invoice No.: [Number]

BILL TO:
[Customer Name]
[Address]
[Email]

ITEMS:
| Item | Qty | Price | Amount | GST% | SGST | CGST | Total |
|------|-----|-------|--------|------|------|------|-------|
| ... | ... | ...   | ...    | ...  | ...  | ...  | ...   |

Subtotal: ₹X
SGST (50%): ₹X
CGST (50%): ₹X
Grand Total: ₹X

Terms: [Payment terms]
```

**Success Criteria**:
- Invoice generation smooth
- GST calculations accurate
- PDF export working
- Invoice numbering automatic
- Duplicate prevention working

### 7.3 Business Financial Tracking

**Objective**: Track income and expenses.

**Features**:
- Income entry
- Expense entry
- Category assignment
- Payment status tracking
- Outstanding receivables/payables
- Monthly summary
- Category breakdown

**Database Changes**:
- New: `business_income` table
- New: `business_expenses` table
- New: `business_outstanding` table

**Backend Endpoints**:
```
POST /api/business/income - Record income
POST /api/business/expenses - Record expense
GET /api/business/summary - Financial summary
GET /api/business/outstanding - Outstanding items
```

**Frontend Components**:
- `IncomeTracker.tsx` - Income entry
- `ExpenseTracker.tsx` - Expense entry
- `FinancialSummary.tsx` - Summary display
- `OutstandingItems.tsx` - Receivables/Payables

**Success Criteria**:
- CRUD operations working
- Calculations accurate
- Summary updates in real-time

### 7.4 Cash Flow Forecasting

**Objective**: Forecast cash flow based on historical data.

**Features**:
- Historical analysis
- Scenario modeling (optimistic, baseline, conservative)
- Income/expense projection
- Cash balance forecast
- Cash gap identification
- Shortage alerts

**Backend Endpoints**:
```
POST /api/business/cashflow/forecast - Generate forecast
GET /api/business/cashflow/scenarios - Get scenarios
```

**Frontend Components**:
- `CashFlowForecast.tsx` - Forecast display
- `ScenarioComparison.tsx` - Compare scenarios
- `ShortageAlerts.tsx` - Alert on shortages

**Forecasting Service**:

Create `app/services/cashflow_forecaster.py`:

```python
class CashFlowForecaster:
    def forecast_cashflow(business_id: str, months: int = 12) -> dict:
        # Analyze historical income/expense patterns
        history = get_business_history(business_id)
        
        # Calculate averages and growth
        avg_monthly_income = calculate_average_income(history)
        avg_monthly_expense = calculate_average_expense(history)
        growth_rate = calculate_growth(history)
        
        # Project forward
        baseline = project_baseline(avg_monthly_income, avg_monthly_expense, months)
        optimistic = project_optimistic(baseline, growth_rate)
        conservative = project_conservative(baseline, growth_rate)
        
        # Identify cash gaps
        cash_gaps = identify_shortages(baseline)
        
        return {
            "baseline": baseline,
            "optimistic": optimistic,
            "conservative": conservative,
            "cash_gaps": cash_gaps
        }
```

**Success Criteria**:
- Forecasts based on actual patterns
- Multiple scenarios provided
- Cash gaps identified
- Alerts functional

### 7.5 EMI & Loan Planning

**Objective**: Help plan loans and EMI.

**Features**:
- EMI calculation
- Repayment schedule generation
- Interest breakdown
- Loan comparison
- Affordability analysis

**Backend Endpoints**:
```
POST /api/business/loan/emi - Calculate EMI
POST /api/business/loan/schedule - Get repayment schedule
POST /api/business/loan/compare - Compare loans
```

**Frontend Components**:
- `EMICalculator.tsx` - EMI calculation
- `RepaymentSchedule.tsx` - Schedule table
- `LoanComparison.tsx` - Compare options
- `Affordability.tsx` - Can you afford it?

**EMI Calculator**:

Create `app/services/emi_calculator.py`:

```python
class EMICalculator:
    @staticmethod
    def calculate_emi(principal: float, rate_of_interest: float, tenure_months: int) -> dict:
        """
        EMI = P * [r(1+r)^n] / [(1+r)^n-1]
        where P = Principal, r = monthly rate, n = number of months
        """
        monthly_rate = rate_of_interest / 12 / 100
        
        if monthly_rate == 0:
            emi = principal / tenure_months
        else:
            emi = principal * (monthly_rate * (1 + monthly_rate) ** tenure_months) / \
                  ((1 + monthly_rate) ** tenure_months - 1)
        
        total_amount = emi * tenure_months
        total_interest = total_amount - principal
        
        return {
            "emi": round(emi, 2),
            "total_amount": round(total_amount, 2),
            "total_interest": round(total_interest, 2),
            "monthly_rate": monthly_rate
        }
    
    @staticmethod
    def generate_repayment_schedule(principal: float, rate: float, months: int) -> list:
        # Generate month-by-month breakdown
        pass
```

**Success Criteria**:
- EMI calculations correct
- Schedule generation working
- Loan comparison helpful
- Affordability assessment accurate

---

## PHASE 8: UNIFIED AI ASSISTANT 🤖

**Estimated Duration**: 2-3 weeks  
**Dependencies**: All modules Phase 2-7 (Complete)  
**Priority**: High - Core feature connecting everything  

### 8.1 Chat Interface

**Objective**: Build conversational AI interface.

**Features**:
- Chat input and message display
- Conversation history
- Context persistence
- Clear conversation button
- Export conversation
- Responsive design

**Database Changes**:
- New: `ai_conversations` table
- New: `ai_messages` table

**Frontend Components**:
- `ChatInterface.tsx` - Main chat UI
- `MessageBubble.tsx` - Individual message display
- `ConversationHistory.tsx` - Past conversations
- `ExportChat.tsx` - Export option

**Success Criteria**:
- Chat UI responsive
- History persists
- Export working

### 8.2 Intent Detection & Routing

**Objective**: Understand user queries and route to correct module.

**Intent Categories**:
- **Budgeting**: "Where did my money go", "How much did I spend"
- **Investment**: "Explain SIPs", "What's my portfolio risk"
- **Trading**: "Backtest strategy", "Historical prices"
- **Tax**: "Calculate tax", "Compare regimes"
- **Fraud**: "Is this message suspicious", "I got scammed"
- **Business**: "Create invoice", "Cash flow forecast"
- **General**: "Help", "Navigation"

**Backend Endpoints**:
```
POST /api/assistant/chat - Send message and get response
GET /api/assistant/history - Get conversation history
```

**Intent Detection Service**:

Create `app/services/intent_detector.py`:

```python
class IntentDetector:
    INTENT_KEYWORDS = {
        "budget": ["spend", "expense", "money go", "budget", "transaction"],
        "investment": ["portfolio", "sip", "mutual fund", "risk", "invest"],
        "trading": ["backtest", "strategy", "chart", "price", "technical"],
        "tax": ["tax", "deduction", "regime", "income", "calculate"],
        "fraud": ["scam", "fraud", "suspicious", "message", "payment"],
        "business": ["invoice", "business", "gst", "cashflow", "emi"],
    }
    
    def detect_intent(query: str) -> dict:
        query_lower = query.lower()
        
        intent_scores = {}
        for intent, keywords in INTENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in query_lower)
            intent_scores[intent] = score
        
        top_intent = max(intent_scores, key=intent_scores.get)
        
        return {
            "intent": top_intent,
            "confidence": intent_scores[top_intent],
            "scores": intent_scores
        }
```

**Success Criteria**:
- Intent detection > 85% accurate
- Routing to correct module working
- Fallback for unclear intents

### 8.3 Module-Specific AI Assistants

**Objective**: Provide context-aware assistance for each module.

**Module Assistants**:

1. **Budget Assistant**:
   - "Analyze my spending"
   - "Where did most money go"
   - "How's my budget"
   - "Suggestions to save money"

2. **Investment Assistant**:
   - "Explain investment concept"
   - "Analyze my portfolio"
   - "Is my portfolio diversified"
   - "Risk recommendations"

3. **Trading Assistant**:
   - "What strategy should I test"
   - "Explain this indicator"
   - "Historical analysis"

4. **Tax Assistant**:
   - "Calculate my tax"
   - "Which regime is better"
   - "What deductions can I claim"

5. **Fraud Assistant**:
   - "Is this message suspicious"
   - "What should I do"
   - "How to recover"

6. **Business Assistant**:
   - "What's my business summary"
   - "Generate invoice"
   - "Cash flow forecast"

**Prompts Storage**:

Create `app/prompts/module_prompts.py`:

```python
MODULE_PROMPTS = {
    "budget": """You are a financial advisor helping users manage their budget.
    You have access to their transaction data and budget information.
    Help them understand their spending patterns, identify savings opportunities,
    and provide actionable recommendations.
    Be encouraging but realistic.
    Always cite specific numbers from their data.
    """,
    
    "investment": """You are an investment educator helping users understand portfolio management.
    Explain concepts in simple language.
    Analyze their portfolio objectively.
    Never guarantee returns or make unsupported recommendations.
    Show your calculations and assumptions.
    Help them learn, not make decisions for them.
    """,
    # ... more modules
}
```

**Backend Endpoints**:
```
POST /api/assistant/chat - Send message (already defined)
```

**Frontend Components**:
- `ModuleAssistant.tsx` - Module-specific assistant interface
- `QuickActions.tsx` - Quick action buttons for common queries
- `AssistantResponse.tsx` - Response display with formatting

**Success Criteria**:
- Module-specific prompts working
- Responses contextually appropriate
- Data accuracy verified

### 8.4 Data Access & Authorization

**Objective**: Safely access user data for AI.

**Features**:
- Retrieve user's relevant data
- Verify authorization
- Aggregate information
- Only use data user owns
- Log data access for audit

**Backend Implementation**:

```python
@app.post("/api/assistant/chat")
async def chat(
    message: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Detect intent
    intent = detect_intent(message)
    
    # Retrieve authorized data
    user_data = {}
    
    if intent == "budget":
        transactions = db.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).all()
        budgets = db.query(Budget).filter(
            Budget.user_id == current_user.id
        ).all()
        user_data = {
            "transactions": [t.to_dict() for t in transactions],
            "budgets": [b.to_dict() for b in budgets]
        }
    
    # Generate response
    response = call_gemini_with_context(message, intent, user_data)
    
    # Save to history
    save_to_conversation_history(current_user.id, message, response, intent)
    
    return response
```

**Success Criteria**:
- Data access secure
- Only user's data accessed
- Authorization verified
- Audit logging working

### 8.5 Language Support

**Objective**: Support multiple languages.

**Languages**:
- English
- Hindi (Devanagari)
- Marathi
- Hinglish (Hindi + English mix)

**Implementation**:
- Language selection in settings
- All responses in selected language
- Use Gemini's multilingual capabilities
- Maintain glossary of financial terms

**Backend Endpoints**:
```
PATCH /api/user/settings/language - Set preferred language
GET /api/languages - List supported languages
```

**Frontend Components**:
- `LanguageSelector.tsx` - Language selection in settings
- `MultilingualResponse.tsx` - Display in selected language

**Language Configuration**:

Create `app/config/languages.py`:

```python
SUPPORTED_LANGUAGES = {
    "en": {"name": "English", "code": "en", "direction": "ltr"},
    "hi": {"name": "हिंदी", "code": "hi", "direction": "ltr"},
    "mr": {"name": "मराठी", "code": "mr", "direction": "ltr"},
    "hi-en": {"name": "Hinglish", "code": "hi-en", "direction": "ltr"},
}

LANGUAGE_PROMPTS = {
    "hi": "तुम एक वित्तीय सलाहकार हो...",
    "mr": "तुम एक वित्तीय सलाहकार हो...",
}
```

**Success Criteria**:
- All languages translate correctly
- Cultural context respected
- Financial terms translated accurately
- Language switching works

---

## PHASE 9: ADMIN & MONITORING 👨‍💼

**Estimated Duration**: 1-2 weeks  
**Dependencies**: All user-facing modules (Phases 2-8 Complete)  
**Priority**: Medium - Operational necessity  

### 9.1 User Management Dashboard

**Objective**: Admin ability to manage users.

**Features**:
- User list with search/filter
- View user details
- Suspend/reactivate accounts
- View user activity
- Manage support requests

**Database Changes**:
- New: `admin_actions` table (for audit)
- New: `support_requests` table

**Backend Endpoints**:
```
GET /api/admin/users - List users
GET /api/admin/users/{id} - Get user details
PATCH /api/admin/users/{id} - Update user (suspend/activate)
POST /api/admin/users/{id}/suspend - Suspend user
POST /api/admin/users/{id}/activate - Reactivate user
GET /api/admin/users/{id}/activity - User activity log
```

**Frontend Components**:
- `UserList.tsx` - Users table with pagination
- `UserDetails.tsx` - Individual user view
- `UserActions.tsx` - Suspend/activate buttons
- `ActivityLog.tsx` - User activity timeline

**Success Criteria**:
- User CRUD operations working
- Suspend/activate functions properly
- Activity log comprehensive

### 9.2 Platform Analytics

**Objective**: Monitor platform metrics and usage.

**Metrics**:
- Total registered users
- Active users (last 7/30 days)
- Module usage statistics
- Analyses performed
- Reports generated
- Feature usage trends
- Error rates

**Backend Endpoints**:
```
GET /api/admin/analytics - Platform analytics
GET /api/admin/analytics/users - User statistics
GET /api/admin/analytics/usage - Feature usage
GET /api/admin/analytics/errors - Error statistics
```

**Frontend Components**:
- `AnalyticsDashboard.tsx` - Dashboard with key metrics
- `UserGrowth.tsx` - Growth chart
- `ModuleUsage.tsx` - Feature usage breakdown
- `ErrorMetrics.tsx` - Error rate monitoring

**Analytics Service**:

Create `app/services/analytics.py`:

```python
class AnalyticsService:
    @staticmethod
    def get_platform_stats(db: Session) -> dict:
        total_users = db.query(User).count()
        active_users_7d = db.query(User).filter(
            User.updated_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        active_users_30d = db.query(User).filter(
            User.updated_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        # Module usage
        transaction_count = db.query(Transaction).count()
        investigation_count = db.query(Investigation).count()
        
        return {
            "total_users": total_users,
            "active_users_7d": active_users_7d,
            "active_users_30d": active_users_30d,
            "transactions": transaction_count,
            "investigations": investigation_count,
        }
```

**Success Criteria**:
- Metrics calculated accurately
- Dashboard refreshes regularly
- Data is meaningful

### 9.3 AI Service Monitoring

**Objective**: Monitor AI service health.

**Metrics**:
- API availability
- Response times
- Error rates
- Cost tracking (Gemini API)
- Quality metrics

**Features**:
- Service status display
- Error log viewer
- Performance metrics
- Cost dashboard

**Backend Endpoints**:
```
GET /api/admin/ai/health - AI service health
GET /api/admin/ai/metrics - Performance metrics
GET /api/admin/ai/errors - Error logs
GET /api/admin/ai/costs - Cost tracking
```

**Frontend Components**:
- `AIHealthDashboard.tsx` - Service status
- `PerformanceMetrics.tsx` - Response times, error rates
- `CostTracker.tsx` - API costs
- `ErrorLogs.tsx` - Recent errors

**Success Criteria**:
- Health status accurate
- Metrics meaningful
- Error logging comprehensive

### 9.4 Financial Data Management

**Objective**: Manage external data sources.

**Features**:
- Data source status
- Update timestamps
- Data freshness indicators
- Manual refresh capability
- Integration health

**Backend Endpoints**:
```
GET /api/admin/data-sources - List data sources
GET /api/admin/data-sources/{id}/status - Source status
POST /api/admin/data-sources/{id}/refresh - Manual refresh
```

**Frontend Components**:
- `DataSourceStatus.tsx` - Status display
- `RefreshControl.tsx` - Manual refresh buttons
- `FreshnessIndicator.tsx` - Data age display

**Success Criteria**:
- Data source status accurate
- Manual refresh working
- Freshness indicators helpful

### 9.5 Audit Logs

**Objective**: Track all administrative actions.

**Logged Actions**:
- User creation/deletion
- Account suspension/activation
- Data exports
- Admin actions
- System changes
- Error events

**Backend Endpoints**:
```
GET /api/admin/audit-logs - Get audit logs
GET /api/admin/audit-logs?filter=X - Filter logs
POST /api/admin/audit-logs/export - Export logs
```

**Frontend Components**:
- `AuditLogViewer.tsx` - Log display with filters
- `LogDetails.tsx` - Individual log details
- `FilterControls.tsx` - Search and filter

**Success Criteria**:
- All actions logged
- Logs searchable
- Export functionality working
- Log retention policy met

---

## PHASE 10: FINAL INTEGRATION & LAUNCH 🚀

**Estimated Duration**: 2-3 weeks  
**Dependencies**: All modules complete (Phases 1-9)  
**Priority**: Critical - Final phase  

### 10.1 End-to-End Testing

**Test Coverage**:
- Functional testing (all features)
- Integration testing (cross-module)
- Security testing (auth, data isolation)
- Performance testing (load, response time)
- UX testing (mobile, responsive)

**Testing Matrix**:
- All 6 modules fully functional
- All calculations verified
- All workflows complete
- Cross-module data flow working
- No broken links or non-functional buttons

**Success Criteria**:
- 100+ test scenarios passing
- Zero critical bugs
- < 100ms API latency (95th percentile)
- Mobile responsive working

### 10.2 Security Hardening

**Security Checks**:
- HTTPS enforcement
- CORS configuration
- SQL injection prevention (via ORM)
- XSS prevention
- CSRF protection
- Authentication/Authorization enforcement
- Rate limiting
- Dependency vulnerabilities

**Testing**:
- OWASP Top 10 validation
- Penetration testing
- Data isolation verification
- Secret management audit

**Success Criteria**:
- All security checks passed
- No exposed secrets
- Data properly isolated per user
- Rate limiting functional

### 10.3 Performance Optimization

**Optimization Areas**:
- Database query optimization (indexes, N+1 prevention)
- Frontend code splitting (lazy loading)
- Image optimization
- CSS/JS minification
- Caching strategy
- CDN configuration
- API response optimization

**Performance Targets**:
- Frontend load time: < 2 seconds
- API response time: < 500ms (95th percentile)
- Database query time: < 100ms
- Report generation: < 5 seconds

**Tools**:
- Chrome DevTools Performance
- Lighthouse
- Database query analyzer
- Load testing tools

**Success Criteria**:
- All targets met
- Lighthouse score > 90
- No memory leaks
- Smooth animations and interactions

### 10.4 Deployment

**Frontend Deployment** (Vercel):
- GitHub integration
- Automatic builds
- Environment variables
- CDN configuration
- Custom domain

**Backend Deployment** (Render or similar):
- GitHub integration
- Environment variables
- Database migrations
- API documentation
- Monitoring setup

**Database Setup**:
- Production database created
- Backup strategy configured
- Migration scripts tested
- Replication setup (if applicable)

**Success Criteria**:
- Both frontend and backend deployed
- CI/CD pipeline working
- Automated deployments functional
- Rollback procedures tested

### 10.5 Documentation

**User Documentation**:
- Setup guide
- Feature tutorials
- FAQ
- Glossary
- Video tutorials
- Troubleshooting guide

**Technical Documentation**:
- API documentation (auto-generated at /docs)
- Deployment guide
- Architecture documentation
- Database schema documentation
- Security documentation

**Success Criteria**:
- All documentation complete
- Examples working
- Documentation searchable
- Video tutorials created

### 10.6 Launch Preparation

**Pre-Launch**:
- Beta testing (internal)
- User feedback collection
- Final bug fixes
- Performance tuning
- Security audit
- Backup verification

**Launch**:
- Go-live execution
- System monitoring
- Support team ready
- User communication
- Performance monitoring

**Post-Launch**:
- Bug monitoring
- User feedback collection
- Performance optimization
- Feature updates

**Success Criteria**:
- Smooth launch
- < 99.9% uptime
- < 1% error rate
- User satisfaction > 4/5

---

# SECTION 2: BACKEND PATTERNS & STANDARDS

## Architecture Overview

**Framework**: FastAPI (Python web framework)
**Pattern**: REST API with Layered Architecture

```
Request → Router (routes/*.py) → Service Layer → Data Layer (ORM) → Database
Response ← Schema Validation ← Business Logic ← Models
```

## File Organization

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entry point (already in backend/)
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── security.py          # Auth utilities
│   ├── api.py               # Router aggregation
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── budget.py        # Budgeting endpoints (Pattern example)
│   │   ├── investments.py   # Investment endpoints
│   │   ├── trading.py       # Trading endpoints
│   │   ├── tax.py           # Tax endpoints
│   │   ├── fraud.py         # Fraud detection endpoints
│   │   ├── business.py      # Business finance endpoints
│   │   ├── admin.py         # Admin endpoints
│   │   └── assistant.py     # AI Assistant endpoints
│   └── services/            # Business logic (NEW - to add)
│       ├── __init__.py
│       ├── categorization.py
│       ├── insights.py
│       ├── fraud_detector.py
│       ├── technical_indicators.py
│       ├── backtester.py
│       ├── tax_calculator.py
│       ├── gst_calculator.py
│       ├── cashflow_forecaster.py
│       ├── emi_calculator.py
│       ├── risk_analyzer.py
│       ├── calculators.py
│       ├── analytics.py
│       ├── intent_detector.py
│       └── file_processor.py
└── requirements.txt         # Python dependencies

main.py                       # Backend entry point (EXISTING)
```

## Code Patterns

### 1. Route Pattern

**Standard Route Structure** (from budget.py):

```python
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Transaction
from app.schemas import TransactionCreate, TransactionResponse
from app.security import decode_token

router = APIRouter()

def get_current_user_from_header(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Extract user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/summary")
async def get_summary(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get user summary"""
    # Implementation
    return {"data": "..."}

@router.post("/create", response_model=ResponseSchema)
async def create_item(
    item: CreateSchema,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create new item"""
    # Validation
    # Business logic
    # Database operation
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
```

**Key Patterns**:
- Use Bearer token in Authorization header
- Always validate user ownership
- Use Pydantic schemas for request/response
- Use dependency injection for authentication
- Commit and refresh database operations
- Return status-appropriate HTTP codes

### 2. Authentication Pattern

**Token-Based Authentication** (from security.py):

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Key Patterns**:
- Use bcrypt for password hashing
- Use JWT tokens with 30-minute expiration
- Store user ID in token's "sub" claim
- Always validate token before processing

### 3. Model Pattern (SQLAlchemy)

**Standard Model Structure**:

```python
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

class MyModel(Base):
    __tablename__ = "my_models"
    
    # Primary Key
    id = Column(String, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Data Fields
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="my_models")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
```

**Key Patterns**:
- Use UUID strings for IDs
- Always include user_id for multi-tenant isolation
- Include created_at and updated_at timestamps
- Use back_populates for bidirectional relationships
- Use cascade for automatic deletion

### 4. Schema Pattern (Pydantic)

**Standard Schema Structure**:

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ItemCreate(BaseModel):
    """Request schema for creating item"""
    name: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None

class ItemResponse(ItemCreate):
    """Response schema for item"""
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # ORM mode for SQLAlchemy

class ItemList(BaseModel):
    """Response schema for list of items"""
    items: list[ItemResponse]
    total: int
    page: int
```

**Key Patterns**:
- Separate schemas for Create, Read, Update
- Use Field() for validation
- Use from_attributes = True for ORM compatibility
- Include appropriate fields in each schema
- Validate constraints at schema level

### 5. Error Handling Pattern

```python
from fastapi import HTTPException, status

# Validation Error
if not item.name:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Item name is required"
    )

# Not Found
item = db.query(Item).filter(Item.id == item_id).first()
if not item:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Item not found"
    )

# Unauthorized
if item.user_id != current_user.id:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied"
    )

# Server Error
try:
    # Operation
except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An error occurred"
    )
```

### 6. Service Layer Pattern

**Business Logic Separation** (NEW PATTERN TO ADOPT):

```python
# app/services/my_service.py
class MyService:
    @staticmethod
    def calculate_something(input_data: dict) -> dict:
        """Business logic here"""
        # Calculations
        # Data transformations
        # Complex operations
        return result

# app/routes/my_route.py
from app.services.my_service import MyService

@router.post("/calculate")
async def calculate(data: InputSchema, current_user: User = Depends(...)):
    result = MyService.calculate_something(data.dict())
    return result
```

**Benefits**:
- Separation of concerns
- Easier testing
- Reusable logic across routes
- Cleaner route code

## Database Access Patterns

### Query Patterns

```python
# Single item by ID
item = db.query(Item).filter(Item.id == item_id).first()

# Multiple items with conditions
items = db.query(Item).filter(
    Item.user_id == user_id,
    Item.status == "active"
).all()

# Count
count = db.query(Item).filter(Item.user_id == user_id).count()

# Aggregation
total = db.query(func.sum(Item.amount)).filter(...).scalar()

# Group by
grouped = db.query(Item.category, func.sum(Item.amount)).group_by(Item.category).all()

# Order and limit
items = db.query(Item).order_by(Item.created_at.desc()).limit(10).all()

# Join
results = db.query(Item, User).join(User).filter(...).all()
```

### Create/Update/Delete Patterns

```python
# Create
item = Item(id=generate_id(), user_id=user_id, name="...", amount=100)
db.add(item)
db.commit()
db.refresh(item)

# Update
item.name = "new name"
item.updated_at = datetime.utcnow()
db.commit()
db.refresh(item)

# Delete
db.delete(item)
db.commit()

# Bulk operations
db.query(Item).filter(Item.status == "old").delete()
db.commit()
```

## API Response Patterns

```python
# Success with data
return {"status": "success", "data": {...}}

# List with pagination
return {
    "status": "success",
    "data": items,
    "total": total,
    "page": page,
    "per_page": per_page
}

# Error
raise HTTPException(status_code=400, detail="Error message")

# Created
return {
    "status": "created",
    "data": new_item,
    "message": "Item created successfully"
}
```

---

# SECTION 3: FRONTEND PATTERNS & STANDARDS

## Architecture Overview

**Framework**: React 18 with TypeScript  
**Styling**: Tailwind CSS  
**Navigation**: React Router v6  
**Form Handling**: React Hook Form  

```
Component → State (hook) → API Call → Display
  ↓         ↓
Context    Form Handler
```

## File Organization

```
frontend/
├── src/
│   ├── pages/                  # Page components (route destinations)
│   │   ├── modules/            # Feature modules
│   │   │   ├── BudgetingModule.tsx       (EXISTING pattern)
│   │   │   ├── InvestmentModule.tsx
│   │   │   ├── MarketInsightsModule.tsx
│   │   │   ├── TaxModule.tsx
│   │   │   ├── FraudDetectorModule.tsx
│   │   │   ├── BusinessFinanceModule.tsx
│   │   │   └── AIAssistantModule.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── AIAssistant.tsx
│   ├── components/             # Reusable components
│   │   ├── budgeting/          # Feature-specific components
│   │   │   ├── TransactionImport.tsx    (EXISTING)
│   │   │   ├── BudgetDashboard.tsx      (EXISTING)
│   │   │   ├── ExpenseCategories.tsx    (EXISTING)
│   │   │   └── SpendingInsights.tsx     (EXISTING)
│   │   ├── investment/
│   │   ├── trading/
│   │   ├── tax/
│   │   ├── fraud/
│   │   ├── business/
│   │   ├── common/             # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── PrivateRoute.tsx    (EXISTING)
│   │   └── Sidebar.tsx         (EXISTING)
│   ├── context/                # Context API (state management)
│   │   ├── AuthContext.tsx     (EXISTING pattern)
│   │   └── NotificationContext.tsx (NEW)
│   ├── layouts/                # Layout components
│   │   ├── DashboardLayout.tsx (EXISTING)
│   │   └── AdminLayout.tsx
│   ├── hooks/                  # Custom hooks (NEW)
│   │   ├── useApi.ts           # API calling hook
│   │   ├── useForm.ts          # Form handling
│   │   └── useLocalStorage.ts  # Local storage hook
│   ├── services/               # API services (NEW)
│   │   ├── api.ts              # Axios instance
│   │   ├── authService.ts
│   │   ├── budgetService.ts
│   │   ├── investmentService.ts
│   │   ├── tradingService.ts
│   │   ├── taxService.ts
│   │   ├── fraudService.ts
│   │   ├── businessService.ts
│   │   ├── assistantService.ts
│   │   └── adminService.ts
│   ├── types/                  # TypeScript types (NEW)
│   │   ├── index.ts
│   │   ├── budget.ts
│   │   ├── investment.ts
│   │   └── ...
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── App.tsx                 (EXISTING)
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Component Patterns

### 1. Functional Component Pattern

**Example from BudgetingModule.tsx**:

```typescript
import { useState, useEffect } from 'react'
import { Upload, Plus } from 'lucide-react'
import TransactionImport from '../../components/budgeting/TransactionImport'

interface TabType {
  id: string
  label: string
  icon: any
}

export default function BudgetingModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import'>('dashboard')
  const [refreshData, setRefreshData] = useState(0)

  const tabs: TabType[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Upload },
    // ... more tabs
  ]

  const handleImportSuccess = () => {
    setRefreshData(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Content */}
    </div>
  )
}
```

**Key Patterns**:
- Use TypeScript for type safety
- Destructure imports
- Use useState for local state
- Use callbacks for child communication
- Use Tailwind for styling

### 2. Form Component Pattern

**New Pattern to Adopt**:

```typescript
import { useForm } from 'react-hook-form'
import { InputField } from '../common/Input'

interface FormData {
  email: string
  password: string
}

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <InputField
        label="Email"
        {...register('email', { required: 'Email is required' })}
        error={errors.email?.message}
      />
      <InputField
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={errors.password?.message}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  )
}
```

**Key Patterns**:
- Use react-hook-form for form management
- Use TypeScript interfaces for form data
- Use controlled component pattern
- Show validation errors
- Disable button while loading

### 3. API Integration Pattern

**New Hook Pattern**:

```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react'
import { AxiosError } from 'axios'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const result = await fetchFn()
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError((err as AxiosError).message)
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, dependencies)

  return { data, loading, error }
}

// Usage in component
export function MyComponent() {
  const { data, loading, error } = useApi(() => budgetService.getSummary(), [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  return <div>{/* Display data */}</div>
}
```

### 4. API Service Pattern

**New Pattern for API Services**:

```typescript
// services/api.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

// services/budgetService.ts
export const budgetService = {
  getSummary: () => api.get('/budget/summary'),
  getTransactions: () => api.get('/budget/transactions'),
  addTransaction: (data: TransactionCreate) => api.post('/budget/transactions', data),
  importTransactions: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/budget/import', formData)
  },
  getInsights: () => api.get('/budget/insights'),
}
```

**Key Patterns**:
- Centralized axios instance
- Automatic token injection
- Service organization by feature
- Error handling in interceptor
- Return Promise for easy async/await

### 5. State Management with Context

**Pattern from AuthContext.tsx**:

```typescript
import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

## Styling Patterns

### Tailwind CSS Usage

**Common Component Styles**:

```typescript
// Button
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

// Card
className="bg-white rounded-lg shadow-md p-6"

// Input
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Flex center
className="flex items-center justify-center"
```

**Common Utility Classes**:
- `space-y-4` - Vertical spacing between children
- `space-x-4` - Horizontal spacing between children
- `gap-4` - Grid/flex gap
- `p-6`, `px-4`, `py-2` - Padding
- `m-4`, `mx-auto` - Margin
- `text-center` - Text alignment
- `text-lg`, `text-sm` - Font sizes
- `font-bold`, `font-semibold` - Font weights
- `text-gray-700` - Text color
- `bg-blue-600` - Background color
- `rounded-lg` - Border radius
- `shadow-md` - Box shadow

## TypeScript Patterns

### Type Definitions

```typescript
// types/index.ts

// Enums
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Interfaces
export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  date: string
  amount: number
  description: string
  category: string
  transaction_type: TransactionType
  merchant?: string
  reference?: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: string
  total_income: number
  total_budget: number
  savings_target: number
  category_budgets: CategoryBudget[]
  created_at: string
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
  error?: string
}
```

---

# SECTION 4: DATABASE SCHEMA REQUIREMENTS

## Core Tables (Phase 1 - Already Exist)

### users
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  hashed_password VARCHAR NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(email),
  INDEX(created_at)
)
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  user_id VARCHAR,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(action),
  INDEX(created_at)
)
```

## Phase 2: Smart Budgeting Tables

### transactions (Existing - May need updates)
```sql
CREATE TABLE transactions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL,
  amount FLOAT NOT NULL,
  description VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  transaction_type VARCHAR DEFAULT 'expense',
  merchant VARCHAR,
  reference VARCHAR,
  category_confidence FLOAT DEFAULT 1.0,
  category_source VARCHAR DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(category),
  INDEX(date),
  INDEX(created_at),
  UNIQUE(user_id, reference)
)
```

### budgets (Existing)
```sql
CREATE TABLE budgets (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  month VARCHAR NOT NULL,
  total_income FLOAT DEFAULT 0,
  total_budget FLOAT NOT NULL,
  savings_target FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(month),
  UNIQUE(user_id, month)
)
```

### category_budgets (Existing)
```sql
CREATE TABLE category_budgets (
  id VARCHAR PRIMARY KEY,
  budget_id VARCHAR NOT NULL REFERENCES budgets(id),
  category VARCHAR NOT NULL,
  allocated_amount FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(budget_id),
  INDEX(category)
)
```

### transaction_imports (NEW)
```sql
CREATE TABLE transaction_imports (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  file_name VARCHAR NOT NULL,
  imported_count INT,
  duplicate_count INT,
  error_count INT,
  status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(created_at)
)
```

### categorization_rules (NEW)
```sql
CREATE TABLE categorization_rules (
  id VARCHAR PRIMARY KEY,
  merchant_keyword VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  confidence FLOAT DEFAULT 0.95,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(merchant_keyword),
  INDEX(category)
)
```

### spending_anomalies (NEW)
```sql
CREATE TABLE spending_anomalies (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  transaction_id VARCHAR REFERENCES transactions(id),
  anomaly_type VARCHAR,
  description TEXT,
  severity VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(created_at)
)
```

### recurring_expenses (NEW)
```sql
CREATE TABLE recurring_expenses (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  category VARCHAR NOT NULL,
  avg_amount FLOAT,
  frequency VARCHAR,
  next_expected_date DATE,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id)
)
```

## Phase 3: Investment Tables

### investments (Existing - Already present)
```sql
CREATE TABLE investments (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  category VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  purchase_value FLOAT NOT NULL,
  units FLOAT NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  current_value FLOAT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(category)
)
```

### portfolio_snapshots (NEW)
```sql
CREATE TABLE portfolio_snapshots (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  snapshot_date DATE NOT NULL,
  total_invested FLOAT,
  current_value FLOAT,
  total_gain_loss FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(snapshot_date),
  UNIQUE(user_id, snapshot_date)
)
```

### investment_valuations (NEW)
```sql
CREATE TABLE investment_valuations (
  id VARCHAR PRIMARY KEY,
  investment_id VARCHAR NOT NULL REFERENCES investments(id),
  valuation_date DATE NOT NULL,
  value FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(investment_id),
  INDEX(valuation_date)
)
```

## Phase 4: Trading Tables

### market_data (NEW)
```sql
CREATE TABLE market_data (
  id VARCHAR PRIMARY KEY,
  symbol VARCHAR NOT NULL,
  trade_date DATE NOT NULL,
  open_price FLOAT,
  high_price FLOAT,
  low_price FLOAT,
  close_price FLOAT,
  volume INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(symbol),
  INDEX(trade_date),
  UNIQUE(symbol, trade_date)
)
```

### market_symbols (NEW)
```sql
CREATE TABLE market_symbols (
  id VARCHAR PRIMARY KEY,
  symbol VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  exchange VARCHAR DEFAULT 'NSE',
  sector VARCHAR,
  active BOOLEAN DEFAULT TRUE,
  INDEX(symbol)
)
```

### backtest_results (NEW)
```sql
CREATE TABLE backtest_results (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  symbol VARCHAR NOT NULL,
  strategy_name VARCHAR NOT NULL,
  from_date DATE,
  to_date DATE,
  initial_capital FLOAT,
  final_value FLOAT,
  total_return FLOAT,
  win_rate FLOAT,
  max_drawdown FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(created_at)
)
```

### paper_trading_accounts (NEW)
```sql
CREATE TABLE paper_trading_accounts (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
  initial_capital FLOAT DEFAULT 100000,
  current_balance FLOAT,
  invested_amount FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id)
)
```

### paper_orders (NEW)
```sql
CREATE TABLE paper_orders (
  id VARCHAR PRIMARY KEY,
  account_id VARCHAR NOT NULL REFERENCES paper_trading_accounts(id),
  symbol VARCHAR NOT NULL,
  order_type VARCHAR, -- BUY, SELL
  quantity INT,
  price FLOAT,
  status VARCHAR DEFAULT 'executed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(account_id),
  INDEX(created_at)
)
```

## Phase 5: Tax Tables

### tax_profiles (NEW)
```sql
CREATE TABLE tax_profiles (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  financial_year VARCHAR NOT NULL,
  residency_status VARCHAR,
  total_income FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  UNIQUE(user_id, financial_year)
)
```

### tax_slabs (NEW)
```sql
CREATE TABLE tax_slabs (
  id VARCHAR PRIMARY KEY,
  financial_year VARCHAR NOT NULL,
  regime VARCHAR, -- old, new
  from_amount FLOAT,
  to_amount FLOAT,
  tax_rate FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(financial_year, regime)
)
```

### tax_calculations (NEW)
```sql
CREATE TABLE tax_calculations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  profile_id VARCHAR REFERENCES tax_profiles(id),
  regime VARCHAR,
  taxable_income FLOAT,
  tax_amount FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id)
)
```

## Phase 6: Fraud Tables

### evidence (NEW)
```sql
CREATE TABLE evidence (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  investigation_id VARCHAR REFERENCES investigations(id),
  evidence_type VARCHAR, -- sms, whatsapp, screenshot, url, email, call
  content TEXT,
  file_path VARCHAR,
  extracted_text TEXT,
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(investigation_id),
  INDEX(created_at)
)
```

### fraud_detections (NEW)
```sql
CREATE TABLE fraud_detections (
  id VARCHAR PRIMARY KEY,
  evidence_id VARCHAR NOT NULL REFERENCES evidence(id),
  risk_level VARCHAR, -- LOW, MODERATE, HIGH, CRITICAL
  indicators JSONB,
  confidence FLOAT,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(evidence_id),
  INDEX(risk_level)
)
```

### rescue_cases (NEW)
```sql
CREATE TABLE rescue_cases (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  incident_date TIMESTAMP,
  amount FLOAT,
  payment_method VARCHAR,
  description TEXT,
  status VARCHAR DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(status)
)
```

## Phase 7: Business Finance Tables

### business_profiles (Existing)
```sql
CREATE TABLE business_profiles (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  business_name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  gst_number VARCHAR,
  contact_email VARCHAR NOT NULL,
  contact_phone VARCHAR,
  financial_year VARCHAR DEFAULT '2024-25',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id)
)
```

### invoices (NEW)
```sql
CREATE TABLE invoices (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  business_id VARCHAR NOT NULL REFERENCES business_profiles(id),
  invoice_number VARCHAR NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR,
  invoice_date DATE,
  due_date DATE,
  subtotal FLOAT,
  sgst FLOAT,
  cgst FLOAT,
  total FLOAT,
  status VARCHAR DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  UNIQUE(business_id, invoice_number)
)
```

### invoice_items (NEW)
```sql
CREATE TABLE invoice_items (
  id VARCHAR PRIMARY KEY,
  invoice_id VARCHAR NOT NULL REFERENCES invoices(id),
  description VARCHAR NOT NULL,
  quantity FLOAT,
  unit_price FLOAT,
  gst_rate FLOAT,
  total FLOAT,
  INDEX(invoice_id)
)
```

### business_income (NEW)
```sql
CREATE TABLE business_income (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  business_id VARCHAR REFERENCES business_profiles(id),
  amount FLOAT NOT NULL,
  source VARCHAR,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(date)
)
```

### business_expenses (NEW)
```sql
CREATE TABLE business_expenses (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  business_id VARCHAR REFERENCES business_profiles(id),
  category VARCHAR,
  amount FLOAT NOT NULL,
  description VARCHAR,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(date)
)
```

## Phase 8: AI Assistant Tables

### ai_conversations (NEW)
```sql
CREATE TABLE ai_conversations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title VARCHAR,
  language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(created_at)
)
```

### ai_messages (NEW)
```sql
CREATE TABLE ai_messages (
  id VARCHAR PRIMARY KEY,
  conversation_id VARCHAR NOT NULL REFERENCES ai_conversations(id),
  role VARCHAR, -- user, assistant
  content TEXT NOT NULL,
  intent VARCHAR,
  module_routed VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(conversation_id),
  INDEX(created_at)
)
```

## Phase 9: Admin Tables

### support_requests (NEW)
```sql
CREATE TABLE support_requests (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  subject VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR DEFAULT 'open',
  assigned_to VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(status)
)
```

### admin_actions (NEW)
```sql
CREATE TABLE admin_actions (
  id VARCHAR PRIMARY KEY,
  admin_id VARCHAR NOT NULL REFERENCES users(id),
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(admin_id),
  INDEX(created_at)
)
```

---

# SECTION 5: TESTING STRATEGY

## Testing Pyramid

```
        /\
       /  \  Integration Tests (20%)
      /────\
     /      \  API Tests (30%)
    /────────\
   /          \ Unit Tests (50%)
  /────────────\
```

## Unit Testing

**Backend Unit Tests** (using pytest):

```python
# tests/test_services/test_categorization.py
import pytest
from app.services.categorization import CategorizationService

class TestCategorization:
    def test_categorize_food_expense(self):
        result = CategorizationService.categorize_transaction(
            "Zomato", "Food delivery", 500
        )
        assert result["category"] == "Food & Dining"
    
    def test_categorize_transport_expense(self):
        result = CategorizationService.categorize_transaction(
            "Uber", "Ride", 200
        )
        assert result["category"] == "Transportation"

# tests/test_services/test_tax_calculator.py
def test_old_regime_calculation():
    tax = TaxCalculator.calculate_old_regime_tax(
        income=1000000, 
        deductions=150000
    )
    assert tax > 0
    assert tax < 1000000
```

**Frontend Unit Tests** (using vitest):

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## API Testing

**Backend API Tests** (using pytest):

```python
# tests/test_routes/test_budget.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestBudgetAPI:
    def test_get_summary_requires_auth(self):
        response = client.get("/api/budget/summary")
        assert response.status_code == 401
    
    def test_get_summary_with_auth(self, auth_header):
        response = client.get(
            "/api/budget/summary",
            headers=auth_header
        )
        assert response.status_code == 200
        assert "total_income" in response.json()
    
    def test_import_transactions(self, auth_header):
        with open("test_data.csv", "rb") as f:
            response = client.post(
                "/api/budget/import",
                headers=auth_header,
                files={"file": f}
            )
        assert response.status_code == 200
        assert response.json()["count"] > 0
```

## Integration Testing

**Cross-Module Integration**:

```python
# tests/integration/test_budget_to_tax.py
def test_expense_data_flows_to_tax_module():
    # Create transaction
    transaction = create_transaction(user_id, amount=100000)
    
    # Verify it appears in budget summary
    summary = get_budget_summary(user_id)
    assert summary["total_expenses"] == 100000
    
    # Verify it could be used in tax calculation
    # (without explicitly calculating tax)
    transactions = get_transactions_for_tax(user_id)
    assert transaction.id in [t.id for t in transactions]
```

## Test Structure

**Backend Test Organization**:

```
tests/
├── conftest.py                  # Shared fixtures
├── test_routes/
│   ├── test_auth.py
│   ├── test_budget.py
│   ├── test_investments.py
│   └── ...
├── test_services/
│   ├── test_categorization.py
│   ├── test_fraud_detector.py
│   └── ...
└── integration/
    ├── test_auth_to_budget.py
    └── test_budget_to_tax.py
```

**Frontend Test Organization**:

```
src/
├── components/
│   └── __tests__/
│       ├── Button.test.tsx
│       ├── Input.test.tsx
│       └── ...
├── services/
│   └── __tests__/
│       └── apiService.test.ts
└── hooks/
    └── __tests__/
        └── useApi.test.ts
```

## Test Coverage Goals

| Layer | Target Coverage |
|-------|-----------------|
| Unit Tests | 80%+ |
| Services | 85%+ |
| Routes | 70%+ |
| Integration | Critical paths only |

---

# SECTION 6: IMPLEMENTATION ORDER & SEQUENCING

## Phase Sequencing Rules

1. **Each phase depends on all previous phases** - Don't start Phase 3 until Phase 2 is complete
2. **Database first** - Add new tables before implementing features
3. **Backend first** - Implement routes before frontend
4. **Services first** - Extract business logic to services before using in routes
5. **Tests alongside** - Write tests as you implement features

## Recommended Weekly Schedule

### Week 1-2: Phase 2 (Budgeting)
- Database: transactions, budgets, categorization_rules
- Backend: Transaction import, categorization, budget management
- Frontend: Import UI, dashboard, insights
- Tests: All endpoints, categorization logic

### Week 3-4: Phase 2 Continued (Reports)
- Database: financial_reports table
- Backend: Report generation
- Frontend: Report viewer, export
- Tests: Report accuracy

### Week 5-6: Phase 3 (Investment)
- Database: portfolio tables, snapshots
- Backend: Portfolio management, risk analysis
- Frontend: Portfolio dashboard, risk display
- Tests: Calculations, risk scoring

### Week 7-8: Phase 3 Continued (Calculators)
- Backend: SIP, FD, CI calculators
- Frontend: Calculator interfaces
- Tests: Formula accuracy

### Week 9-10: Phase 4 (Trading)
- Database: market_data, backtesting tables
- Backend: Technical indicators, backtesting engine
- Frontend: Charts, strategy setup
- Tests: Indicator accuracy, backtest results

### Week 11-12: Phase 4 Continued (Paper Trading)
- Database: paper trading tables
- Backend: Virtual portfolio management
- Frontend: Trading interface
- Tests: Order execution, P&L calculation

### Week 13-14: Phase 5 (Tax)
- Database: Tax tables
- Backend: Tax calculation engine
- Frontend: Tax calculator
- Tests: Tax calculation accuracy

### Week 15-16: Phase 6 (Fraud Detection)
- Database: Evidence, fraud detection tables
- Backend: Fraud analysis engine
- Frontend: Evidence upload, analysis display
- Tests: Fraud detection accuracy

### Week 17-18: Phase 7 (Business Finance)
- Database: Business tables
- Backend: Invoice generation, GST calculation
- Frontend: Invoice creator, business dashboard
- Tests: GST calculations, invoice generation

### Week 19-20: Phase 8 (AI Assistant)
- Database: Conversation tables
- Backend: Intent detection, module routing
- Frontend: Chat interface
- Tests: Intent detection, routing accuracy

### Week 21: Phase 9 (Admin)
- Database: Admin tables
- Backend: Admin endpoints
- Frontend: Admin dashboard
- Tests: Admin operations

### Week 22-23: Phase 10 (Integration & Testing)
- End-to-end testing
- Performance optimization
- Security hardening
- Deployment preparation

### Week 24: Launch
- Production deployment
- Monitoring setup
- Support activation

---

## Critical Path Items

**Must Complete in Order**:
1. Phase 1 Foundation ✅
2. Phase 2 Budgeting (Needs to complete before others work well)
3. Phase 8 AI Assistant (Needs multiple modules to reference)
4. Phase 10 Integration (Final validation)

**Can Proceed in Parallel** (with caution):
- Phase 3 & 4 (Investment & Trading) - Independent
- Phase 5 & 6 (Tax & Fraud) - Independent
- Phase 7 (Business) - Independent

---

## Success Metrics by Phase

### Phase 2
- ✅ 100+ transactions importable
- ✅ 90%+ categorization accuracy
- ✅ Budget CRUD functional
- ✅ Reports generate correctly

### Phase 3
- ✅ Portfolio CRUD working
- ✅ Risk calculations accurate
- ✅ All 5 calculators working
- ✅ Portfolio value tracking functional

### Phase 4
- ✅ Technical indicators calculate correctly
- ✅ Backtests run < 2 seconds
- ✅ Paper trading accounts functional
- ✅ Charts render smoothly

### Phase 5
- ✅ Tax calculations match official standards
- ✅ Both regimes calculated correctly
- ✅ Deduction optimizer working
- ✅ Reports generated accurately

### Phase 6
- ✅ Fraud detection > 80% accuracy
- ✅ Analysis < 500ms per item
- ✅ Risk levels appropriate
- ✅ RESCUE workflow functional

### Phase 7
- ✅ Invoice generation working
- ✅ GST calculations accurate
- ✅ Cash flow forecasts reasonable
- ✅ EMI calculations correct

### Phase 8
- ✅ Intent detection > 85% accurate
- ✅ Module routing working
- ✅ Chat interface responsive
- ✅ Conversation history persisting

### Phase 9
- ✅ User management CRUD working
- ✅ Analytics calculating accurately
- ✅ Audit logs comprehensive
- ✅ Admin dashboard functional

### Phase 10
- ✅ All modules integrated
- ✅ < 100ms API latency (95th percentile)
- ✅ Mobile responsive
- ✅ Zero critical security issues
- ✅ Deployed and live

---

## End of Implementation Plan

This document provides the complete architectural guidance and implementation sequencing for FinShield AI Phases 2-10.

**Key References**:
- ROADMAP.md - Timeline overview
- MASTER_SPEC.md - Detailed functional specifications
- README.md - Setup and development guide

**Next Steps**:
1. Review this plan with the development team
2. Identify any missing dependencies
3. Begin Phase 2 - Smart Budgeting
4. Use this document as reference during implementation

**Plan Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Ready for Phase 2 Implementation  

---

*For questions or updates to this plan, refer to the MASTER_SPEC.md and ROADMAP.md files.*
