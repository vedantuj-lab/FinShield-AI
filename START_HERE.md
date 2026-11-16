# 🚀 START HERE - FinShield AI Setup

Welcome! Follow these 5 simple steps to get FinShield AI running in 10 minutes.

---

## Step 1: Clone & Enter Directory ⬇️

```bash
cd Downloads/FinShield-AI-main/FinShield-AI-main
```

✅ You're now in the project root.

---

## Step 2: Backend Setup (5 minutes) 🔧

### 2.1 Create Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2.2 Activate It
**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 2.3 Install Dependencies
```bash
pip install -r requirements.txt
```

### 2.4 Setup Database
Copy and edit the environment file:
```bash
cp .env.example .env
```

**Edit `.env` and add your database URL:**

Option A - Local PostgreSQL:
```
DATABASE_URL=postgresql://localhost/finshield_db
```

Option B - Supabase Cloud (recommended):
```
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]
```

### 2.5 Start Backend
```bash
python main.py
```

✅ Backend running at http://localhost:8000
📚 API docs at http://localhost:8000/docs

---

## Step 3: Frontend Setup (3 minutes) 💻

### 3.1 Open New Terminal & Go to Frontend
```bash
# Open new terminal
cd frontend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Start Frontend
```bash
npm run dev
```

✅ Frontend running at http://localhost:5173

---

## Step 4: Test It 🧪

1. Open http://localhost:5173 in your browser
2. Click "Sign Up"
3. Register with:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. You'll see the dashboard!

✅ Everything working!

---

## Step 5: Explore 🎉

### Files to Read
1. **README.md** - Complete overview
2. **QUICK_START.md** - Troubleshooting
3. **MASTER_SPEC.md** - Full specification
4. **ROADMAP.md** - Development plan

### Paths to Visit
- 🏠 Landing: http://localhost:5173
- 📊 Dashboard: http://localhost:5173/dashboard
- 🧬 API Docs: http://localhost:8000/docs

### Next: Phase 2 Start

Read `ROADMAP.md` for detailed Phase 2: Smart Budgeting tasks.

---

## Troubleshooting 🔧

### Backend Won't Start
```
Error: could not connect to database
```
**Fix**: Check DATABASE_URL in backend/.env

### Frontend Can't Connect
```
Error: API not responding
```
**Fix**: Make sure backend is running on :8000

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8000      # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Still Having Issues?
1. Check QUICK_START.md
2. Verify all dependencies installed
3. Restart terminals
4. Clear browser cache

---

## Quick Commands 📋

### Backend
```bash
cd backend
source venv/bin/activate  # Activate environment
python main.py            # Start server
deactivate               # Exit environment
```

### Frontend
```bash
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code quality
```

### Database
```bash
# Create PostgreSQL database
createdb finshield_db

# Connect to database
psql -d finshield_db
```

---

## Project Structure 📁

```
FinShield-AI-main/
├── backend/              # API & database
│   ├── app/
│   │   ├── models.py     # Database tables
│   │   ├── routes/       # API endpoints
│   │   └── security.py   # Authentication
│   ├── main.py           # Start here
│   └── requirements.txt   # Install these
│
├── frontend/             # User interface
│   ├── src/
│   │   ├── pages/        # All pages
│   │   ├── App.tsx       # Start here
│   │   └── index.css     # Styles
│   ├── package.json      # Install these
│   └── vite.config.ts    # Build config
│
└── Documentation/
    ├── README.md         # Setup guide
    ├── QUICK_START.md    # 10-min guide
    ├── MASTER_SPEC.md    # Full spec
    ├── ROADMAP.md        # Dev plan
    └── START_HERE.md     # This file
```

---

## Key Concepts 💡

### Frontend (React)
- **App.tsx** - Main routing and layout
- **pages/** - All main screens
- **context/** - Authentication state
- **components/** - Reusable UI parts

### Backend (FastAPI)
- **main.py** - Server entry point
- **models.py** - Database structure
- **routes/** - API endpoints
- **security.py** - Login & auth

### Database (PostgreSQL)
- **Users** - Store login info
- **Transactions** - Financial data
- **Budgets** - Budget data
- **Investments** - Investment data

---

## What You Can Do Now ✨

After setup, you can:

✅ Register new users
✅ Login & logout
✅ View dashboard
✅ Navigate between pages
✅ Use calculators (SIP, FD, EMI)
✅ Access API documentation
✅ Admin login support
✅ Role-based access

---

## Next Steps 📈

After confirming everything works:

1. **Read MASTER_SPEC.md**
   - Understand all requirements
   - Learn about 6 modules

2. **Check ROADMAP.md**
   - See Phase 2 tasks
   - Plan implementation

3. **Start Phase 2**
   - Transaction import
   - Budget tracking
   - Spending insights

---

## Getting Help 📞

### Documentation
- 📖 README.md - Setup
- ⚡ QUICK_START.md - Troubleshooting
- 📚 MASTER_SPEC.md - Full requirements
- 🗺️ ROADMAP.md - Development plan

### API Help
- Visit http://localhost:8000/docs
- See all endpoints
- Test requests directly

### Code Issues
- Check git status
- Review error messages
- Check console logs

---

## You're All Set! 🎉

```
Frontend: http://localhost:5173 ✅
Backend:  http://localhost:8000 ✅
API Docs: http://localhost:8000/docs ✅
Database: Connected ✅
```

**Ready to build? Let's go! 🚀**

---

## Quick Reference

| Component | Port | Status |
|-----------|------|--------|
| Frontend | 5173 | Running |
| Backend | 8000 | Running |
| Database | 5432 | Connected |

| Account | Email | Password |
|---------|-------|----------|
| Test | test@example.com | password123 |

---

## Support Command

If anything breaks:
1. Check terminal for error messages
2. Read the error carefully
3. Google the error message
4. Check QUICK_START.md
5. Restart the server

---

*Created: January 2024*
*Version: 1.0*
*Status: Production Ready ✅*

**Phase 1 Foundation: COMPLETE** ✅
**Ready for Phase 2: Smart Budgeting** 🚀

---

## Final Thought

Congratulations on setting up FinShield AI! 

You now have a complete, professional, production-ready financial platform foundation. The hard part is done. What's left is the fun part - building features that help real people manage their finances better.

**Let's make financial intelligence accessible to everyone! 💪**

---

*FinShield AI - Plan Smarter. Invest Wiser. Detect Fraud. Protect Your Financial Future.*

Questions? Start with QUICK_START.md or MASTER_SPEC.md.

**Happy coding! 🎉**
