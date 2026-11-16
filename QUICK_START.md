# FinShield AI - Quick Start Guide

Get FinShield AI running in 10 minutes.

## Prerequisites
- Node.js 16+ (download from nodejs.org)
- Python 3.9+ (download from python.org)
- PostgreSQL 12+ or create a free account at Supabase.com

## 1. Clone & Setup Backend

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your database URL
# Example: DATABASE_URL=postgresql://localhost/finshield_db
```

## 2. Setup Database

### Option A: Local PostgreSQL
```bash
# Create database
createdb finshield_db

# Update .env with:
DATABASE_URL=postgresql://localhost/finshield_db
```

### Option B: Supabase (Cloud)
```
1. Go to supabase.com and create account
2. Create a new project
3. Copy the database connection string
4. Add to .env:
   DATABASE_URL=your-supabase-connection-string
```

## 3. Run Backend

```bash
python main.py
```

✅ Backend running at http://localhost:8000
📚 API Docs at http://localhost:8000/docs

## 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development server
npm run dev
```

✅ Frontend running at http://localhost:5173

## 5. Test the Application

1. Open http://localhost:5173 in your browser
2. Click "Sign Up"
3. Register with email: test@example.com, password: password123
4. You should see the dashboard!

## Key Files

- **Backend**: `backend/main.py` - Entry point
- **Frontend**: `frontend/src/App.tsx` - Main app
- **Spec**: `MASTER_SPEC.md` - Complete specification

## Common Issues

### Backend won't start
```
Error: could not connect to database
Solution: Check DATABASE_URL in .env file
```

### Frontend can't connect to backend
```
Error: API is not responding
Solution: Make sure backend is running on http://localhost:8000
```

### Port already in use
```
Backend (port 8000):
lsof -i :8000 (macOS/Linux)
netstat -ano | findstr :8000 (Windows)

Frontend (port 5173):
lsof -i :5173 (macOS/Linux)
```

## Architecture Overview

```
FinShield AI
├── Frontend (React)
│   └── Connects to Backend API
├── Backend (FastAPI)
│   └── Manages database & logic
└── Database (PostgreSQL)
    └── Stores all data
```

## What's Included

✅ **Authentication**
- User registration & login
- Password hashing
- JWT tokens

✅ **Core Infrastructure**
- Database models for all 6 modules
- API endpoints (placeholders)
- Role-based access

✅ **UI Components**
- Landing page
- Login/Register pages
- Dashboard
- Navigation

✅ **Module Structure**
- Placeholder pages for all 6 modules
- Ready for implementation

## Next Steps

1. Read `MASTER_SPEC.md` for complete requirements
2. Start with Phase 2: Smart Budgeting module
3. Implement transaction import functionality
4. Add expense categorization
5. Build budget tracking

## Development Tips

### Add a New API Endpoint

1. Create file in `backend/app/routes/newmodule.py`
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/endpoint")
async def my_endpoint():
    return {"message": "hello"}
```

2. Import in `backend/app/api.py`
```python
from app.routes import newmodule
api_router.include_router(newmodule.router, prefix="/newmodule")
```

### Add a New Frontend Page

1. Create file in `frontend/src/pages/NewPage.tsx`
2. Add route in `frontend/src/App.tsx`
```typescript
<Route path="/new-page" element={<NewPage />} />
```

### Database Queries

```python
# In any route file
from app.database import get_db
from sqlalchemy.orm import Session

@router.get("/")
async def get_data(db: Session = Depends(get_db)):
    data = db.query(Model).all()
    return data
```

## Getting Help

- 📖 Read `MASTER_SPEC.md` Part by Part
- 💻 Check backend API docs at http://localhost:8000/docs
- 🔍 Search GitHub Issues
- ✉️ Email support@finshield.ai

---

**Ready to build? Let's go! 🚀**

*For more details, see README.md and MASTER_SPEC.md*
