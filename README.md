# FinShield AI
## AI-Powered Financial Intelligence, Management, Analysis and Protection Platform

**Plan Smarter. Invest Wiser. Detect Fraud. Protect Your Financial Future.**

---

## Project Overview

FinShield AI is a comprehensive AI-powered financial intelligence and protection platform designed for individuals, investors, traders, and small businesses in India.

The platform unifies six financial activities:
1. **Smart Budgeting** - Track expenses, set budgets, get AI-powered insights
2. **Investment Guide** - Learn about investments, analyze portfolios, understand risks
3. **Market Insights** - Backtest strategies, practice paper trading with historical data
4. **Tax Assistant** - Calculate taxes, compare regimes, understand deductions
5. **Fraud Detector** - Identify scams, analyze evidence, get emergency assistance
6. **Business Finance** - Generate invoices, forecast cash flow, plan loans

All connected through a unified AI Financial Assistant.

---

## Features

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Frontend setup (React, TypeScript, Vite, Tailwind CSS)
- [x] Backend setup (FastAPI, Python, PostgreSQL)
- [x] Authentication system (User login/registration)
- [x] Role-based access control (User & Admin)
- [x] Landing page
- [x] Dashboard
- [x] Navigation & Layout
- [x] Database models for all modules
- [x] API endpoint structure

### 🚀 Upcoming Phases
- Phase 2: Smart Budgeting
- Phase 3: Investment & Portfolio
- Phase 4: Trading & Market Insights
- Phase 5: Tax Assistant
- Phase 6: Fraud Detection
- Phase 7: Small Business Finance
- Phase 8: AI Assistant
- Phase 9: Admin & Monitoring
- Phase 10: Final Integration

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hook Form** - Form management
- **Axios** - HTTP client

### Backend
- **Python 3.9+** - Language
- **FastAPI** - API framework
- **SQLAlchemy** - ORM
- **PostgreSQL/Supabase** - Database
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Google Generative AI** - AI integration

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: Supabase / PostgreSQL

---

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.9+
- PostgreSQL 12+ (or Supabase)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database tables
# (Tables are auto-created on first run via SQLAlchemy)

# Run development server
python main.py
```

The backend will start at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Configure API endpoint (should be http://localhost:8000/api)

# Run development server
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## Project Structure

```
FinShield-AI-main/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── context/            # Context (Auth)
│   │   ├── layouts/            # Layout components
│   │   ├── App.tsx             # Main app
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── routes/             # API endpoints
│   │   ├── models.py           # Database models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── database.py         # Database config
│   │   ├── security.py         # Auth utilities
│   │   └── config.py           # Settings
│   ├── main.py                 # Entry point
│   └── requirements.txt
│
├── MASTER_SPEC.md              # Complete specification
└── README.md                    # This file
```

---

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **audit_logs** - System audit trail

### Budgeting Module
- **transactions** - Financial transactions
- **budgets** - Monthly budgets
- **category_budgets** - Category-level budgets

### Investment Module
- **investments** - User investments

### Fraud Module
- **investigations** - Fraud investigations

### Business Module
- **business_profiles** - Business information

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Budgeting
- `GET /api/budget/summary` - Budget summary
- `POST /api/budget/transactions` - Add transaction
- `GET /api/budget/transactions` - List transactions
- `GET /api/budget/insights` - AI spending insights

### Investments
- `GET /api/investments/portfolio` - Get portfolio
- `POST /api/investments/holdings` - Add holding
- `POST /api/investments/calculators/sip` - SIP calculator
- `POST /api/investments/calculators/fd` - FD calculator

### Trading
- `GET /api/markets/historical` - Historical data
- `POST /api/trading/backtest` - Backtest strategy
- `POST /api/trading/paper-orders` - Place paper order

### Tax
- `POST /api/tax/calculate` - Calculate tax
- `POST /api/tax/compare-regimes` - Compare regimes
- `GET /api/tax/rules` - Tax rules

### Fraud
- `POST /api/fraud/analyze` - Analyze evidence
- `POST /api/fraud/investigations` - Create investigation
- `POST /api/fraud/rescue/create` - Create rescue case

### Business
- `POST /api/business/profile` - Create business profile
- `POST /api/business/invoices` - Create invoice
- `POST /api/business/loan/emi` - Calculate EMI

### Admin
- `GET /api/admin/overview` - Admin dashboard
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/{id}` - Update user
- `GET /api/admin/audit-logs` - Audit logs

---

## Environment Configuration

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finshield_db

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI
GEMINI_API_KEY=your-gemini-api-key

# Admin
ADMIN_EMAIL=admin@finshield.ai
ADMIN_PASSWORD=admin123

# URLs
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
DEBUG=true
```

---

## User Roles & Permissions

### User Role
- Access all six financial modules
- Create and manage personal financial data
- Use AI assistant
- View personal reports
- Access profile and settings

### Admin Role
- User management (view, suspend/activate)
- Platform analytics
- AI service monitoring
- Fraud detection management
- System administration
- Audit logs

---

## Authentication Flow

1. **Registration**: New users register with name, email, password
2. **Login**: Users login and receive JWT token
3. **Token Storage**: Token stored in localStorage
4. **Protected Routes**: Token required for authenticated endpoints
5. **Role-Based Access**: Admin routes verified server-side

---

## Security Features

- ✅ HTTPS-only endpoints
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Server-side role verification
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ CORS protection
- ✅ Rate limiting ready
- ✅ No sensitive data in localStorage beyond token
- ✅ Never stores OTP, PIN, CVV, passwords

---

## Development Workflow

### For Frontend Development
```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Lint code
npm run type-check # Check types
```

### For Backend Development
```bash
cd backend
source venv/bin/activate
python main.py    # Run dev server
```

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Render)
```bash
# Push to GitHub
# Connect repository to Render
# Configure environment variables
# Deploy
```

---

## Current Status

**Phase 1: Foundation** ✅ COMPLETE

The foundation is now in place with:
- Full authentication system
- Database models for all modules
- API endpoint structure
- Frontend routing and layouts
- Professional landing page

**Next Steps**: Begin Phase 2 - Smart Budgeting module implementation.

---

## Documentation

- **MASTER_SPEC.md** - Complete 28-part specification document
- **API Documentation** - Auto-generated at /docs endpoint
- **Database Design** - See MASTER_SPEC.md Part 17

---

## Support & Contact

For questions or issues:
- Email: support@finshield.ai
- GitHub Issues: Issue tracking
- Documentation: See MASTER_SPEC.md

---

*Last Updated: January 2024*
*FinShield AI - All rights reserved*
