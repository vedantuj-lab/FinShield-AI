# PHASE 3: INVESTMENT & PORTFOLIO GUIDE - IMPLEMENTATION PLAN

**Goal**: Complete the 4-tab Investment Module interface with Risk Analysis and Investment Calculators components, and enhance backend investment endpoints.

**Timeline**: 3-4 days  
**Status**: 🚀 READY FOR IMPLEMENTATION

---

## Architecture Overview

### Frontend Component Hierarchy
```
InvestmentModule.tsx (main container with 4 tabs)
├── InvestmentEducation.tsx ✅ (already complete)
├── PortfolioManager.tsx ✅ (partially complete, minimal refinement)
├── RiskAnalysis.tsx 🆕 (needs creation)
└── InvestmentCalculators.tsx 🆕 (needs creation)
```

### Data Flow
- **RiskAnalysis**: Reads portfolio holdings from PortfolioManager, calls POST `/api/investments/analyze` for risk metrics
- **InvestmentCalculators**: Each calculator calls respective POST endpoint independently
- **Authentication**: All API calls use `Bearer <token>` from Authorization header

### Risk Scoring Algorithm (0-100 scale)
```
Risk Score = (Concentration Risk × 0.4) + (Volatility Factor × 0.4) + (Diversification Penalty × 0.2)

Where:
- Concentration Risk = max(holding_weight_percent) * 1.25 (0-100)
- Volatility Factor = (1 - diversification_score/100) * 80 (0-80)
- Diversification Penalty = (1 - num_holdings/10) * 100 (0-100)

Risk Levels:
- 0-20: Low Risk ✅
- 21-50: Medium Risk ⚠️
- 51-80: High Risk ⚠️⚠️
- 81-100: Very High Risk 🔴
```

### Calculator Formulas

**SIP Calculator**:
```
FV = P × [((1 + r)^n - 1) / r] × (1 + r)

Where:
- P = Monthly Investment
- r = Monthly return rate (annual_return% / 12 / 100)
- n = Total months (years × 12)
- Total Invested = P × n
- Estimated Returns = FV - Total Invested
```

**FD Calculator**:
```
Amount = P × (1 + rate/100)^years

Where:
- P = Principal
- rate = Annual interest rate
- years = Tenure
- Interest Earned = Amount - P
```

**Lump Sum Calculator**:
```
FV = P × (1 + r)^n

Where:
- P = Initial Investment
- r = Annual return rate / 100
- n = Years
- Gain = FV - P
```

**Goal-Based Calculator**:
```
Required Monthly = [Target × r] / [((1 + r)^n - 1) × (1 + r)]

Where:
- Target = Target Amount
- r = Monthly return rate
- n = Total months
- Total Invested = Required Monthly × n
```

---

## Implementation Sequence

### Phase 3A: Backend Enhancement

#### 1. Enhance /api/investments/analyze Endpoint
**File**: `backend/app/routes/investments.py`
**Status**: New endpoint to add

**Request Schema**:
```json
{
  "holdings": [
    {
      "name": "HDFC Index Fund",
      "value": 50000,
      "category": "Index Fund",
      "sector": "Mixed"
    },
    {
      "name": "Axis Bank",
      "value": 30000,
      "category": "Stock",
      "sector": "Banking"
    }
  ]
}
```

**Response Schema**:
```json
{
  "risk_score": 45,
  "risk_level": "MEDIUM",
  "concentration_risk": 50,
  "diversification_score": 65,
  "volatility_estimate": 18.5,
  "holdings_analysis": [
    {
      "name": "HDFC Index Fund",
      "weight_percent": 62.5,
      "category": "Index Fund"
    },
    {
      "name": "Axis Bank",
      "weight_percent": 37.5,
      "category": "Stock"
    }
  ],
  "sector_breakdown": [
    {
      "sector": "Mixed",
      "value": 50000,
      "percent": 62.5
    },
    {
      "sector": "Banking",
      "value": 30000,
      "percent": 37.5
    }
  ],
  "recommendations": [
    "Your portfolio has moderate concentration risk in HDFC Index Fund (62.5%)",
    "Consider adding more asset classes to improve diversification"
  ]
}
```

**Implementation Notes**:
- Calculate concentration risk as percentage of largest holding
- Diversification score based on Herfindahl index: 1 - Σ(wi²) * 100
- Volatility estimate from category (mock: MF=15%, Stock=22%, FD=2%, SIP=12%)
- Generate 2-3 recommendations based on risk thresholds

#### 2. Enhance /api/investments/calculate-sip Endpoint
**File**: `backend/app/routes/investments.py`
**Status**: Already skeleton exists, needs completion

**Request**:
```json
{
  "monthly_investment": 5000,
  "annual_return": 12,
  "years": 10
}
```

**Response**:
```json
{
  "monthly_investment": 5000,
  "total_invested": 600000,
  "estimated_returns": 519359,
  "future_value": 1119359,
  "breakdown": {
    "principal": 600000,
    "interest": 519359
  }
}
```

**Implementation**: Already partially done; ensure formula correctness and proper rounding.

#### 3. Enhance /api/investments/calculate-fd Endpoint
**File**: `backend/app/routes/investments.py`
**Status**: Already skeleton exists, needs completion

**Request**:
```json
{
  "principal": 100000,
  "annual_rate": 6.5,
  "years": 5
}
```

**Response**:
```json
{
  "principal": 100000,
  "annual_rate": 6.5,
  "years": 5,
  "interest_earned": 36766.07,
  "maturity_amount": 136766.07,
  "breakdown": {
    "principal": 100000,
    "interest": 36766.07
  }
}
```

**Implementation**: Already partially done; ensure compound interest formula is correct.

#### 4. Add /api/investments/calculate-lumpsum Endpoint
**File**: `backend/app/routes/investments.py`
**Status**: New endpoint to add

**Request**:
```json
{
  "principal": 100000,
  "annual_return": 12,
  "years": 20
}
```

**Response**:
```json
{
  "principal": 100000,
  "annual_return": 12,
  "years": 20,
  "final_amount": 9646293,
  "gain": 9546293,
  "breakdown": {
    "principal": 100000,
    "gains": 9546293
  }
}
```

#### 5. Add /api/investments/calculate-goal Endpoint
**File**: `backend/app/routes/investments.py`
**Status**: New endpoint to add

**Request**:
```json
{
  "target_amount": 1000000,
  "annual_return": 12,
  "years": 10
}
```

**Response**:
```json
{
  "target_amount": 1000000,
  "annual_return": 12,
  "years": 10,
  "required_monthly_investment": 5675.33,
  "total_invested": 681039.6,
  "breakdown": {
    "total_invested": 681039.6,
    "returns": 318960.4
  }
}
```

### Phase 3B: Frontend Components

#### 6. Create RiskAnalysis.tsx Component
**File**: `frontend/src/components/investment/RiskAnalysis.tsx`
**Status**: New component

**Features**:
- Display portfolio holdings with concentration percentages
- Risk score badge (0-100) with color coding
- Risk level indicator (Low/Medium/High/Very High)
- Concentration risk metric (0-100)
- Diversification score (0-100)
- Volatility estimate (%)
- Holdings table with weight %
- Sector/asset class breakdown pie chart
- 2-3 recommendations based on risk analysis
- Loading states and error handling
- Responsive mobile-first design

**UI Components**:
- Summary metrics cards (4-5 cards in grid)
- Holdings analysis table
- Sector breakdown pie chart (using Recharts)
- Recommendations card with icon indicators
- Risk level color coding:
  - Low: Green (#10b981)
  - Medium: Orange (#f59e0b)
  - High: Red (#ef4444)
  - Very High: Dark Red (#7f1d1d)

**Props/Context**:
- Accept portfolio data via prop or fetch from PortfolioManager context
- Call `POST /api/investments/analyze` on mount and when holdings change
- Use Bearer token from localStorage for auth

#### 7. Create InvestmentCalculators.tsx Component
**File**: `frontend/src/components/investment/InvestmentCalculators.tsx`
**Status**: New component

**Features**:
- 4 calculator tabs (nested tabs within the calculators tab)
- Each calculator with:
  - Input fields with validation
  - Real-time calculation display
  - Result card showing breakdown
  - Copy to clipboard for results
  - Reset form button

**Calculators**:

**a) SIP Calculator Tab**:
- Inputs: Monthly Investment, Years, Annual Return %
- Outputs: Total Invested, Estimated Returns, Future Value
- Step-by-step calculation display
- Format: Currency with ₹ symbol

**b) FD Calculator Tab**:
- Inputs: Principal, Annual Rate %, Years
- Outputs: Interest Earned, Maturity Amount
- Break down principal + interest
- Format: Currency with ₹ symbol

**c) Lump Sum Calculator Tab**:
- Inputs: Initial Investment, Years, Annual Return %
- Outputs: Final Amount, Gain/Loss
- Show multiplier effect (final/principal ratio)
- Format: Currency with ₹ symbol

**d) Goal-Based Calculator Tab**:
- Inputs: Target Amount, Years, Expected Return %
- Outputs: Required Monthly Investment, Total Invested
- Show years to target
- Format: Currency with ₹ symbol

**UI Design**:
- Card-based layout with subtle shadows
- Input cards with labels and placeholders
- Result cards with bold value display
- Mini breakdown showing components
- Responsive: Full width on mobile, side-by-side on desktop
- Icons for each calculator (calculator icon from lucide-react)
- Color-coded result cards (blue theme)

**Styling Pattern** (from InvestmentEducation.tsx):
```typescript
// Card class: "card" - used for all cards
// Button class: "btn-primary", "btn-secondary"
// Input class: "input-field"
// Colors: Blue theme (#3b82f6), green for positive, red for negative
```

---

## File Modification Details

### Backend Files

#### `backend/app/routes/investments.py`
**Changes Required**:
1. Import required modules (math, datetime)
2. Update existing SIP and FD calculator endpoints
3. Add three new endpoints (lumpsum, goal, analyze)
4. Add risk analysis calculation function
5. Add recommendation generation function
6. Ensure all endpoints handle Bearer token authentication
7. Add proper error handling and validation

**Dependencies**: No new imports needed beyond what's available

#### `backend/app/schemas.py`
**Changes Required** (if needed):
1. Optional: Add RiskAnalysisRequest and RiskAnalysisResponse schemas
2. Optional: Add calculator request/response schemas
3. Current implementation can work with dict responses, but schemas make it cleaner

### Frontend Files

#### `frontend/src/components/investment/RiskAnalysis.tsx`
**New File - Key Imports**:
```typescript
import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import axios from 'axios'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
```

**Key Functions**:
- `fetchRiskAnalysis()` - Call POST /api/investments/analyze
- `getRiskColor()` - Return color based on risk score
- `getRiskLabel()` - Return text label for risk level
- `generateRecommendations()` - Format recommendations with icons

#### `frontend/src/components/investment/InvestmentCalculators.tsx`
**New File - Key Imports**:
```typescript
import { useState } from 'react'
import { Calculator, Copy, RotateCcw } from 'lucide-react'
import axios from 'axios'
```

**Key Functions**:
- `calculateSIP()` - Local calculation + API call
- `calculateFD()` - Local calculation + API call
- `calculateLumpSum()` - Local calculation + API call
- `calculateGoal()` - Local calculation + API call
- `formatCurrency()` - Format numbers with ₹ symbol
- `copyToClipboard()` - Copy result text

---

## Testing Strategy

### Backend Testing

#### Endpoint Tests (via curl/Postman):

**1. Test RiskAnalysis Endpoint**:
```bash
curl -X POST http://localhost:8000/api/investments/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "holdings": [
      {"name": "HDFC Fund", "value": 50000, "category": "MF", "sector": "Mixed"},
      {"name": "Axis Bank", "value": 30000, "category": "Stock", "sector": "Banking"},
      {"name": "FD", "value": 20000, "category": "FD", "sector": "Fixed"}
    ]
  }'
```

Expected: Risk score between 0-100, risk_level in [Low, Medium, High, VeryHigh]

**2. Test SIP Calculator**:
```bash
curl -X POST http://localhost:8000/api/investments/calculate-sip \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_investment": 5000,
    "annual_return": 12,
    "years": 10
  }'
```

Expected: future_value ≈ 1,119,359

**3. Test FD Calculator**:
```bash
curl -X POST http://localhost:8000/api/investments/calculate-fd \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 100000,
    "annual_rate": 6.5,
    "years": 5
  }'
```

Expected: maturity_amount ≈ 136,766

**4. Test Lump Sum Calculator**:
```bash
curl -X POST http://localhost:8000/api/investments/calculate-lumpsum \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 100000,
    "annual_return": 12,
    "years": 20
  }'
```

Expected: final_amount ≈ 9,646,293

**5. Test Goal Calculator**:
```bash
curl -X POST http://localhost:8000/api/investments/calculate-goal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_amount": 1000000,
    "annual_return": 12,
    "years": 10
  }'
```

Expected: required_monthly_investment ≈ 5,675

### Frontend Testing

**1. Build & Type Check**:
```bash
cd frontend
npm run build
npm run type-check
```

Expected: No TypeScript errors, successful build

**2. Component Rendering Tests** (manual):
- RiskAnalysis tab loads without errors
- Shows sample portfolio data (if available) or empty state
- Risk score displays with proper color coding
- Pie chart renders sector breakdown
- InvestmentCalculators tab shows 4 sub-tabs
- Each calculator tab has input fields and submit button
- Results display after calculation

**3. Calculator Validation Tests**:
- SIP Calculator: 5000/month, 12%, 10 years → ₹11,19,359
- FD Calculator: 1,00,000, 6.5%, 5 years → ₹1,36,766
- Lump Sum: 1,00,000, 12%, 20 years → ₹96,46,293
- Goal: ₹10,00,000, 12%, 10 years → ₹5,675/month

**4. User Isolation Test**:
- Backend: Verify portfolio data returned only for authenticated user
- Check Authorization header required on all endpoints
- Test with different user tokens

### Integration Tests

**1. End-to-End: Add Investment → View Risk Analysis**:
- Add investment via PortfolioManager
- Switch to RiskAnalysis tab
- Verify holdings appear in analysis
- Risk score calculated correctly

**2. Calculator Result Storage** (optional):
- Calculate via frontend calculator
- Verify results displayed correctly
- Optional: Store calculations via backend for history

---

## Styling & Design Reference

### Design System (from existing components)
- **Blue Theme**: #3b82f6 (primary), #0ea5e9 (hover)
- **Green**: #10b981 (positive, success)
- **Orange**: #f59e0b (warning, medium risk)
- **Red**: #ef4444 (error, high risk)
- **Card**: `card` class - white bg, shadow, rounded
- **Buttons**: `btn-primary` (blue), `btn-secondary` (gray)
- **Inputs**: `input-field` class - gray border, rounded
- **Typography**: Bold titles, gray text for labels
- **Spacing**: 6px gap, 24px padding in cards
- **Border Radius**: 8px standard, 12px for cards

### Component Layout Patterns
- Summary metrics: 4-col grid (md), 2-col (mobile)
- Charts: Responsive container with 300px height
- Forms: Space-y-4 for sections
- Tables: Overflow-x-auto for mobile
- Tabs: Horizontal scroll on mobile, normal on desktop

---

## API Request/Response Contracts

### Authentication
**All endpoints require**:
```
Header: Authorization: Bearer <JWT_TOKEN>
```

### Error Responses (Standard)
```json
{
  "detail": "Error message describing the issue"
}
```

### Success Format
```json
{
  "key": "value",
  "nested": {
    "key": "value"
  }
}
```

---

## File Checklist

### Files to Create
- [ ] `frontend/src/components/investment/RiskAnalysis.tsx`
- [ ] `frontend/src/components/investment/InvestmentCalculators.tsx`

### Files to Modify
- [ ] `backend/app/routes/investments.py` (enhance with 5 endpoints)
- [ ] `backend/app/schemas.py` (optional: add request/response schemas)

### Files to Verify (No Changes)
- [ ] `frontend/src/pages/modules/InvestmentModule.tsx` (already imports both components)
- [ ] `frontend/src/components/investment/InvestmentEducation.tsx`
- [ ] `frontend/src/components/investment/PortfolioManager.tsx`

---

## Documentation

### PHASE_3_IMPLEMENTATION.md Structure
```markdown
# PHASE 3: INVESTMENT & PORTFOLIO GUIDE - IMPLEMENTATION GUIDE

## What's New in Phase 3
### ✅ Completed
- Frontend components list
- Backend endpoints list

## Features Implemented
1. Risk Analysis Component
2. Investment Calculators Component
3. Analysis Endpoints
4. Calculator Endpoints

## Testing Guide
### Backend API Testing
- Endpoint URLs
- Sample curl requests
- Expected responses

### Frontend Component Testing
- Component tree
- Feature verification
- Edge cases

## Key Metrics
- Risk Score Algorithm
- Calculator Formulas
- Design System

## Sample API Calls
- Risk Analysis request/response
- Each calculator request/response

## Troubleshooting
- Common errors
- Debug tips
```

---

## Completion Criteria

### ✅ Phase 3A Complete When:
1. All 5 backend endpoints implemented and tested
2. Risk analysis calculations accurate (verified with manual calculation)
3. Calculator formulas verified with sample inputs
4. API responses match documented schemas
5. User isolation verified (user_id from token)

### ✅ Phase 3B Complete When:
1. Both new components created and render without errors
2. Frontend build succeeds: `npm run build` with no TypeScript errors
3. RiskAnalysis tab displays risk metrics and recommendations
4. InvestmentCalculators tab shows all 4 calculators functional
5. All 4 calculators return correct results for sample inputs
6. Responsive design verified on mobile and desktop
7. PHASE_3_IMPLEMENTATION.md created with testing guide

### ✅ Phase 3 Complete When:
1. All backend + frontend work above completed
2. End-to-end integration tested (add investment → analyze risk)
3. No console errors or warnings
4. All tests from testing strategy pass
5. Documentation complete with sample API calls

---

## Notes & Constraints

- **No Database Changes**: Use existing `investments` table
- **No Real Market Data**: Use static/mock data for volatility estimates
- **No New External APIs**: Work with existing dependencies
- **User Isolation**: Always filter by `user_id` from token
- **Error Handling**: Return 401 if unauthorized, 400 if bad data
- **Formula Accuracy**: Verify formulas with online calculators before finalizing
- **Styling**: Match existing Tailwind setup, no new CSS needed
- **Mobile-First**: All components responsive by default

---

## Reference: Existing Implementation Patterns

### Backend Pattern (from budget.py)
```python
def get_current_user_from_header(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Extract user from Bearer token"""
    # ... implementation ...

@router.post("/endpoint")
async def endpoint_handler(
    data: RequestSchema,
    current_user: User = Depends(...),
    db: Session = Depends(get_db),
):
    # Filter by current_user.id
    # Return response
```

### Frontend Pattern (from PortfolioManager.tsx)
```typescript
const [data, setData] = useState<Type[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData()
}, [])

const fetchData = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const response = await axios.get('/api/endpoint', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    setData(response.data)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    setLoading(false)
  }
}
```

---

## Next Steps After Implementation

1. Run backend tests with provided curl commands
2. Build frontend and fix any TypeScript errors
3. Test each calculator with sample data
4. Verify RiskAnalysis with multi-holding portfolio
5. Test user isolation (different tokens should see different data)
6. Create final documentation
7. Prepare for Phase 4 (if applicable)

---

**Created**: January 2024  
**Phase**: 3 of N  
**Status**: Planning Complete - Ready for Implementation
