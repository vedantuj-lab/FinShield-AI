import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LandingPage } from './pages/LandingPage';
import {
  AboutPage,
  ContactPage,
  FeaturesPage,
  HowItWorksPage,
  MethodologyPage,
  SecurityPrivacyPage,
} from './pages/PublicInfoPages';
import {
  AdminLoginPage,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
} from './pages/AuthPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigatePage } from './pages/InvestigatePage';
import { ManipulationPage } from './pages/ManipulationPage';
import { ReconstructionPage } from './pages/ReconstructionPage';
import { RiskAssessmentPage } from './pages/RiskAssessmentPage';
import { PaymentSafetyPage } from './pages/PaymentSafetyPage';
import { IncidentReportsPage, RescuePage } from './pages/RescuePage';
import { HistoryPage } from './pages/HistoryPage';
import { TrustedCirclePage } from './pages/TrustedCirclePage';
import {
  LanguageSettingsPage,
  PrivacyDataPage,
  ProfilePage,
} from './pages/SettingsPages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1218] flex items-center justify-center text-sm text-[#94A3B8]">
        Loading FINSHIELD AI workspace...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1218] flex items-center justify-center text-sm text-[#94A3B8]">
        Verifying administrator access...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  componentDidCatch(error: Error) {
    console.error('FINSHIELD AI UI ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F14] text-[#F3F6F9] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4 text-center">
            <h1 className="font-display text-lg font-bold text-[#F3F6F9]">
              FINSHIELD AI Workspace Recovery
            </h1>
            <p className="text-xs text-[#94A3B8]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg bg-[#14B8A6] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#2DD4BF]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
            {/* Public Website (9 routes) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/security-privacy" element={<SecurityPrivacyPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />

            {/* Authenticated Application (13 routes) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/investigate"
              element={
                <ProtectedRoute>
                  <InvestigatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/manipulation"
              element={
                <ProtectedRoute>
                  <ManipulationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reconstruction"
              element={
                <ProtectedRoute>
                  <ReconstructionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/risk"
              element={
                <ProtectedRoute>
                  <RiskAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/payment-safety"
              element={
                <ProtectedRoute>
                  <PaymentSafetyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/rescue"
              element={
                <ProtectedRoute>
                  <RescuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reports"
              element={
                <ProtectedRoute>
                  <IncidentReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/trusted-circle"
              element={
                <ProtectedRoute>
                  <TrustedCirclePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/language"
              element={
                <ProtectedRoute>
                  <LanguageSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/privacy"
              element={
                <ProtectedRoute>
                  <PrivacyDataPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
