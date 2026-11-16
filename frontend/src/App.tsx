import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import BudgetingModule from './pages/modules/BudgetingModule'
import InvestmentModule from './pages/modules/InvestmentModule'
import MarketInsightsModule from './pages/modules/MarketInsightsModule'
import TaxModule from './pages/modules/TaxModule'
import FraudDetectorModule from './pages/modules/FraudDetectorModule'
import BusinessFinanceModule from './pages/modules/BusinessFinanceModule'
import AIAssistant from './pages/AIAssistant'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/budgeting" element={<BudgetingModule />} />
              <Route path="/investments" element={<InvestmentModule />} />
              <Route path="/markets" element={<MarketInsightsModule />} />
              <Route path="/tax" element={<TaxModule />} />
              <Route path="/fraud-detector" element={<FraudDetectorModule />} />
              <Route path="/business-finance" element={<BusinessFinanceModule />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute requiredRole="admin" />}>
            <Route element={<DashboardLayout isAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
