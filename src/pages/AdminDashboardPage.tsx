import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Database,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';

type AdminTab =
  | 'overview'
  | 'users'
  | 'investigations'
  | 'finance'
  | 'model-config'
  | 'feedback'
  | 'rules'
  | 'education'
  | 'support'
  | 'logs';

export function AdminDashboardPage() {
  const { user, apiFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Overview
  const [overview, setOverview] = useState<any>(null);

  // Users
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Feedback
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'open' | 'reviewed' | 'resolved' | 'dismissed'>('resolved');

  // Rules
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    slug: '',
    name: '',
    description: '',
    severityDefault: 'HIGH',
    indicatorKey: 'authority_impersonation',
    weight: 15,
    keywords: '',
    guidance: '',
  });
  const [creatingRule, setCreatingRule] = useState(false);

  // Education
  const [eduList, setEduList] = useState<any[]>([]);
  const [newEdu, setNewEdu] = useState({
    title: '',
    category: 'UPI Safety',
    language: 'en',
    summary: '',
    checklistText: '',
    isPublished: true,
  });

  // Support
  const [supportList, setSupportList] = useState<any[]>([]);
  const [supportFilter, setSupportFilter] = useState('all');
  const [replyTicketId, setReplyTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'open' | 'in_progress' | 'resolved'>('resolved');

  // Logs
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Live Citizen Sync: Investigations, Evidence, Financial Modules, Model Config
  const [adminInvestigations, setAdminInvestigations] = useState<any[]>([]);
  const [adminEvidence, setAdminEvidence] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [modelConfigs, setModelConfigs] = useState<any[]>([]);
  const [modelForm, setModelForm] = useState({
    configKey: 'risk_high_threshold',
    configValue: '70',
    description: 'Minimum risk score (0-100) classified as High Risk',
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, usrRes, fbRes, rlRes, edRes, spRes, aiRes, auRes, invRes, evRes, finRes, mcRes] =
        await Promise.all([
          apiFetch('/api/admin/overview'),
          apiFetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&status=${userStatusFilter}`),
          apiFetch(`/api/admin/feedback?status=${feedbackFilter}`),
          apiFetch('/api/admin/scam-rules'),
          apiFetch('/api/admin/education'),
          apiFetch(`/api/admin/support?status=${supportFilter}`),
          apiFetch('/api/admin/ai-logs'),
          apiFetch('/api/admin/audit-logs'),
          apiFetch('/api/admin/investigations'),
          apiFetch('/api/admin/evidence'),
          apiFetch('/api/admin/finance-summary'),
          apiFetch('/api/admin/model-config'),
        ]);

      if (ovRes.status === 403 || ovRes.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }

      if (ovRes.ok) setOverview(await ovRes.json());
      if (usrRes.ok) setUsersList((await usrRes.json()).users || []);
      if (fbRes.ok) setFeedbackList((await fbRes.json()).feedback || []);
      if (rlRes.ok) setRulesList((await rlRes.json()).rules || []);
      if (edRes.ok) setEduList((await edRes.json()).items || []);
      if (spRes.ok) setSupportList((await spRes.json()).tickets || []);
      if (aiRes.ok) setAiLogs((await aiRes.json()).logs || []);
      if (auRes.ok) setAuditLogs((await auRes.json()).logs || []);
      if (invRes.ok) setAdminInvestigations((await invRes.json()).investigations || []);
      if (evRes.ok) setAdminEvidence((await evRes.json()).evidence || []);
      if (finRes.ok) setFinanceSummary(await finRes.json());
      if (mcRes.ok) setModelConfigs((await mcRes.json()).configs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanner('');
    const res = await apiFetch('/api/admin/model-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not save model configuration.');
      return;
    }
    setBanner(`Saved versioned model config "${modelForm.configKey}".`);
    await loadAllAdminData();
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const fetchFilteredUsers = async (q = userSearch, status = userStatusFilter) => {
    const res = await apiFetch(
      `/api/admin/users?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`
    );
    if (res.ok) setUsersList((await res.json()).users || []);
  };

  const handleToggleUserStatus = async (targetUser: any, nextStatus: 'active' | 'suspended', reason = '') => {
    setError('');
    setBanner('');
    const res = await apiFetch(`/api/admin/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not update account status.');
      return;
    }
    setSuspendTarget(null);
    setSuspendReason('');
    setBanner(
      `Account ${data.user.email} is now ${data.user.status}. Action recorded in audit log.`
    );
    await loadAllAdminData();
  };

  const handleToggleUserRole = async (targetUser: any, nextRole: 'user' | 'admin') => {
    setError('');
    setBanner('');
    const res = await apiFetch(`/api/admin/users/${targetUser.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not update account role.');
      return;
    }
    setBanner(`Updated role for ${data.user.email} to ${data.user.role}. Recorded in audit log.`);
    await loadAllAdminData();
  };

  const handleSaveFeedback = async (id: number) => {
    setError('');
    setBanner('');
    const res = await apiFetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: feedbackStatus, adminNotes: feedbackNotes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not update feedback item.');
      return;
    }
    setEditingFeedbackId(null);
    setBanner('Feedback review saved and audited.');
    await loadAllAdminData();
  };

  const handleUpdateRule = async (rule: any, patch: Record<string, any>) => {
    setError('');
    setBanner('');
    const res = await apiFetch(`/api/admin/scam-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Could not update detection rule.');
      return;
    }
    setBanner(`Updated rule "${rule.name}".`);
    await loadAllAdminData();
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRule(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/scam-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newRule.slug || newRule.name,
          name: newRule.name,
          description: newRule.description,
          severityDefault: newRule.severityDefault,
          indicatorKey: newRule.indicatorKey,
          weight: Number(newRule.weight),
          keywords: newRule.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          guidance: newRule.guidance,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create category');
      setNewRule({
        slug: '',
        name: '',
        description: '',
        severityDefault: 'HIGH',
        indicatorKey: 'authority_impersonation',
        weight: 15,
        keywords: '',
        guidance: '',
      });
      setBanner('New scam category & rule added.');
      await loadAllAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingRule(false);
    }
  };

  const handleCreateEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/admin/education', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEdu.title,
        category: newEdu.category,
        language: newEdu.language,
        summary: newEdu.summary,
        actionChecklist: newEdu.checklistText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        isPublished: newEdu.isPublished,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to publish educational content.');
      return;
    }
    setNewEdu({
      title: '',
      category: 'UPI Safety',
      language: 'en',
      summary: '',
      checklistText: '',
      isPublished: true,
    });
    setBanner('Educational safety advisory saved.');
    await loadAllAdminData();
  };

  const handleToggleEduPublish = async (item: any) => {
    const res = await apiFetch(`/api/admin/education/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !item.isPublished }),
    });
    if (res.ok) {
      setBanner(`Advisory "${item.title}" ${!item.isPublished ? 'published' : 'unpublished'}.`);
      await loadAllAdminData();
    }
  };

  const handleDeleteEdu = async (id: number) => {
    const res = await apiFetch(`/api/admin/education/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBanner('Educational item deleted.');
      await loadAllAdminData();
    }
  };

  const handleUpdateSupport = async (id: number) => {
    const res = await apiFetch(`/api/admin/support/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: replyStatus, adminReply: replyText }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to update support ticket.');
      return;
    }
    setReplyTicketId(null);
    setReplyText('');
    setBanner('Support request updated and audited.');
    await loadAllAdminData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Overview & Health', icon: LayoutDashboard },
    { id: 'users', label: 'User Accounts', icon: Users, badge: overview?.metrics?.totalUsers },
    {
      id: 'feedback',
      label: 'AI Feedback Review',
      icon: Flag,
      badge: overview?.metrics?.openFeedback,
    },
    { id: 'investigations', label: 'Investigations & Evidence', icon: Search, badge: adminInvestigations.length },
    { id: 'finance', label: 'Financial Modules', icon: Database },
    { id: 'model-config', label: 'Model Configuration', icon: Server },
    { id: 'rules', label: 'Scam Rules & Categories', icon: Sliders },
    { id: 'education', label: 'Safety Education', icon: BookOpen },
    {
      id: 'support',
      label: 'Support Requests',
      icon: LifeBuoy,
      badge: overview?.metrics?.openSupport,
    },
    { id: 'logs', label: 'AI & Audit Logs', icon: ClipboardList },
  ];

  const chartColors = ['#38BDF8', '#F59E0B', '#EF4444', '#14B8A6', '#818CF8', '#F97316'];

  return (
    <div className="min-h-screen bg-[#0D1218] text-[#F3F6F9] flex flex-col lg:flex-row">
      {/* Admin Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#243040] bg-[#131A22]">
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#243040]">
          <Link to="/admin" className="flex items-center gap-2 font-display text-base font-bold">
            <ShieldAlert className="h-5 w-5 text-[#F59E0B]" aria-hidden="true" />
            <span>FINSHIELD ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#1B2430] text-[#F59E0B]'
                    : 'text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#F3F6F9]'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
                </span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="font-mono text-[11px] rounded bg-[#0D1218] px-1.5 py-0.5 text-[#38BDF8]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#243040] p-4 space-y-2.5">
          <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 text-xs space-y-0.5">
            <div className="font-semibold text-[#F59E0B] truncate">{user?.name}</div>
            <div className="text-[#94A3B8] truncate">{user?.email}</div>
          </div>
          <Link
            to="/app"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#F3F6F9]"
          >
            <ShieldCheck className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
            <span>Open User Workspace</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#EF4444]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 bg-[#131A22] border-r border-[#243040] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#243040]">
              <span className="font-display font-bold text-[#F59E0B]">FINSHIELD ADMIN</span>
              <button type="button" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-[#94A3B8]" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      activeTab === tab.id ? 'bg-[#1B2430] text-[#F59E0B]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#243040]">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-[#EF4444]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Governance Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 border-b border-[#243040] bg-[#0D1218]/95 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#243040]"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-[#F3F6F9]">
                Platform Governance &amp; AI Operations Console
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Aggregated telemetry, rule tuning, feedback review, and support — private evidence stays user-isolated.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAllAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#243040] bg-[#131A22] px-3 py-1.5 text-xs font-medium text-[#38BDF8] hover:border-[#38BDF8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3.5 text-xs text-[#EF4444]">
              {error}
            </div>
          )}
          {banner && (
            <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-3.5 text-xs text-[#34D399] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {banner}
              </span>
              <button type="button" onClick={() => setBanner('')}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  ['Total Users', overview.metrics.totalUsers, 'text-[#F3F6F9]'],
                  ['Active Users', overview.metrics.activeUsers, 'text-[#10B981]'],
                  ['Investigations', overview.metrics.totalInvestigations, 'text-[#38BDF8]'],
                  ['Evidence Items', overview.metrics.totalEvidence, 'text-[#818CF8]'],
                  ['Open AI Feedback', overview.metrics.openFeedback, 'text-[#F59E0B]'],
                  ['Open Support', overview.metrics.openSupport, 'text-[#F97316]'],
                ].map(([label, val, color]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-[#243040] bg-[#131A22] p-4"
                  >
                    <div className="text-xs text-[#94A3B8]">{label}</div>
                    <div className={`font-mono text-2xl font-bold tabular-nums mt-1 ${color}`}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
                  <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                    Scam Categories Detected (Aggregated Platform Trends)
                  </h2>
                  <div className="h-64 w-full">
                    {overview.scamCategoriesDetected?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overview.scamCategoriesDetected}>
                          <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} />
                          <YAxis allowDecimals={false} stroke="#94A3B8" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0D1218',
                              border: '1px solid #243040',
                              borderRadius: '8px',
                              color: '#F3F6F9',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {overview.scamCategoriesDetected.map((entry: any, idx: number) => (
                              <Cell key={entry.category} fill={chartColors[idx % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                        No investigation category telemetry yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#38BDF8]">
                      <Activity className="h-4 w-4" />
                      <span>AI Analysis Activity &amp; Latency</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-[#0D1218] p-3">
                        <div className="text-[11px] text-[#94A3B8]">Recent Calls</div>
                        <div className="font-mono text-lg font-bold text-[#F3F6F9]">
                          {overview.aiPerformance.recentCallsCount}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#0D1218] p-3">
                        <div className="text-[11px] text-[#94A3B8]">Errors</div>
                        <div className="font-mono text-lg font-bold text-[#EF4444]">
                          {overview.aiPerformance.errorCount}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#0D1218] p-3">
                        <div className="text-[11px] text-[#94A3B8]">Avg Latency</div>
                        <div className="font-mono text-lg font-bold text-[#14B8A6]">
                          {overview.aiPerformance.avgLatencyMs} ms
                        </div>
                      </div>
                    </div>
                    {overview.aiPerformance.byModule?.length > 0 && (
                      <div className="space-y-1.5 pt-2 text-xs">
                        {overview.aiPerformance.byModule.map((m: any) => (
                          <div
                            key={m.module}
                            className="flex items-center justify-between rounded bg-[#0D1218] px-3 py-1.5"
                          >
                            <span className="font-mono text-[#F3F6F9]">{m.module}</span>
                            <span className="text-[#94A3B8]">
                              {m.total} calls · {m.errors} errors
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#10B981]">
                      <Server className="h-4 w-4" />
                      <span>System Health &amp; API Status</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8] flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5" /> Cloud SQL PostgreSQL
                        </span>
                        <span className="font-mono text-[#10B981] uppercase">
                          {overview.systemHealth.database}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]">Gemini AI Credentials</span>
                        <span
                          className={`font-mono ${
                            overview.systemHealth.geminiApiConfigured
                              ? 'text-[#10B981]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {overview.systemHealth.geminiApiConfigured ? 'CONFIGURED' : 'MISSING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]">Process Uptime</span>
                        <span className="font-mono text-[#F3F6F9]">
                          {overview.systemHealth.uptimeSeconds}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-[#243040] bg-[#131A22] p-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-[#94A3B8]" />
                  <input
                    id="admin-user-search"
                    name="userSearch"
                    aria-label="Search user name or email"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user name or email..."
                    className="flex-1 rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  />
                  <button
                    type="button"
                    onClick={() => fetchFilteredUsers(userSearch, userStatusFilter)}
                    className="rounded-lg bg-[#38BDF8] px-3.5 py-2 text-xs font-semibold text-[#0B0F14]"
                  >
                    Search
                  </button>
                </div>
                <select
                  id="admin-user-status"
                  name="userStatusFilter"
                  aria-label="Filter users by status"
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    fetchFilteredUsers(userSearch, e.target.value);
                  }}
                  className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>

              {suspendTarget && (
                <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 space-y-3">
                  <div className="text-xs font-semibold text-[#EF4444]">
                    Suspend Account: {suspendTarget.name} ({suspendTarget.email})
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="admin-suspend-reason"
                      name="suspendReason"
                      aria-label="Suspension justification for audit log"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Justification for audit log (e.g., policy violation / abuse)"
                      className="flex-1 rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(suspendTarget, 'suspended', suspendReason)}
                      className="rounded-lg bg-[#EF4444] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Confirm Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendTarget(null);
                        setSuspendReason('');
                      }}
                      className="rounded-lg border border-[#243040] px-3 py-2 text-xs text-[#94A3B8]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-[#243040] bg-[#131A22]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#243040] bg-[#1B2430] text-[#94A3B8]">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Language</th>
                      <th className="px-4 py-3 text-right">Cases</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Login</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243040]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1B2430]/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#F3F6F9]">{u.name}</div>
                          <div className="text-[#94A3B8]">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono uppercase px-2 py-0.5 rounded ${
                              u.role === 'admin'
                                ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                                : 'bg-[#38BDF8]/10 text-[#38BDF8]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 uppercase text-[#94A3B8]">{u.preferredLanguage}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {u.investigationCount}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono uppercase ${
                              u.status === 'active' ? 'text-[#10B981]' : 'text-[#EF4444]'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {u.id !== user?.id && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleUserRole(u, u.role === 'admin' ? 'user' : 'admin')
                                }
                                className="rounded border border-[#F59E0B]/40 px-2.5 py-1 text-[#F59E0B] hover:bg-[#F59E0B]/10"
                              >
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                            )}
                            {u.role !== 'admin' &&
                              (u.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => setSuspendTarget(u)}
                                  className="rounded border border-[#EF4444]/40 px-2.5 py-1 text-[#EF4444] hover:bg-[#EF4444]/10"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleUserStatus(u, 'active', 'Reactivated by admin')
                                  }
                                  className="rounded border border-[#10B981]/40 px-2.5 py-1 text-[#10B981] hover:bg-[#10B981]/10"
                                >
                                  Reactivate
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI FEEDBACK REVIEW */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">
                  User-Reported Incorrect AI Classifications ({feedbackList.length})
                </h2>
                <select
                  id="admin-feedback-filter"
                  name="feedbackFilter"
                  aria-label="Filter AI feedback by status"
                  value={feedbackFilter}
                  onChange={async (e) => {
                    setFeedbackFilter(e.target.value);
                    const r = await apiFetch(`/api/admin/feedback?status=${e.target.value}`);
                    if (r.ok) setFeedbackList((await r.json()).feedback || []);
                  }}
                  className="rounded-lg border border-[#243040] bg-[#131A22] px-3 py-1.5 text-xs text-[#F3F6F9]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              {feedbackList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#243040] p-8 text-center text-xs text-[#94A3B8]">
                  No AI classification feedback reports found.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackList.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs space-x-2">
                          <span className="font-mono uppercase text-[#38BDF8]">{fb.moduleType}</span>
                          <span className="text-[#94A3B8]">· Reported by {fb.userEmail}</span>
                          {fb.aiPredictedRisk && (
                            <span className="text-[#F59E0B]">· AI Output: {fb.aiPredictedRisk}</span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#0D1218] text-[#F59E0B]">
                          {fb.status}
                        </span>
                      </div>

                      <p className="text-sm text-[#F3F6F9]">{fb.userReason}</p>
                      {fb.expectedOutcome && (
                        <div className="text-xs text-[#38BDF8]">
                          Expected: {fb.expectedOutcome}
                        </div>
                      )}
                      {fb.reportedContentExcerpt && (
                        <div className="rounded-lg bg-[#0D1218] p-2.5 text-xs text-[#94A3B8]">
                          Redacted Excerpt: {fb.reportedContentExcerpt}
                        </div>
                      )}
                      {fb.adminNotes && (
                        <div className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 p-2.5 text-xs text-[#34D399]">
                          Admin Notes: {fb.adminNotes}
                        </div>
                      )}

                      {editingFeedbackId === fb.id ? (
                        <div className="space-y-2 pt-2 border-t border-[#243040]">
                          <div className="flex flex-wrap gap-2">
                            <select
                              id={`admin-feedback-status-${fb.id}`}
                              name="feedbackStatus"
                              aria-label="Feedback review status"
                              value={feedbackStatus}
                              onChange={(e) => setFeedbackStatus(e.target.value as any)}
                              className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-1.5 text-xs text-[#F3F6F9]"
                            >
                              <option value="reviewed">Reviewed</option>
                              <option value="resolved">Resolved</option>
                              <option value="dismissed">Dismissed</option>
                            </select>
                            <input
                              id={`admin-feedback-notes-${fb.id}`}
                              name="feedbackNotes"
                              aria-label="Resolution notes"
                              value={feedbackNotes}
                              onChange={(e) => setFeedbackNotes(e.target.value)}
                              placeholder="Resolution notes / rule adjustment explanation..."
                              className="flex-1 rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-1.5 text-xs text-[#F3F6F9]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveFeedback(fb.id)}
                              className="rounded-lg bg-[#14B8A6] px-3.5 py-1.5 text-xs font-semibold text-[#0B0F14]"
                            >
                              Save Review
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFeedbackId(null)}
                              className="rounded-lg border border-[#243040] px-3 py-1.5 text-xs text-[#94A3B8]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeedbackId(fb.id);
                            setFeedbackNotes(fb.adminNotes || '');
                            setFeedbackStatus(fb.status === 'open' ? 'resolved' : fb.status);
                          }}
                          className="text-xs font-semibold text-[#38BDF8] hover:underline"
                        >
                          Review &amp; Update Status →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCAM CATEGORIES & DETECTION RULES */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <h2 className="font-display text-base font-semibold">
                  Active Scam Categories &amp; Transparent Rule Weights
                </h2>
                {rulesList.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-[#243040] bg-[#131A22] p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#F3F6F9]">
                            {rule.name}
                          </span>
                          <span className="font-mono text-[11px] text-[#F59E0B]">
                            {rule.severityDefault}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-1">{rule.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateRule(rule, { isActive: !rule.isActive })}
                        className={`rounded px-2.5 py-1 text-[11px] font-mono ${
                          rule.isActive
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-[#243040]">
                      <span className="text-[#94A3B8]">
                        Indicator:{' '}
                        <code className="text-[#38BDF8]">
                          {rule.ruleWeightsJson?.indicatorKey || 'custom'}
                        </code>
                      </span>
                      <label htmlFor={`admin-rule-weight-${rule.id}`} className="flex items-center gap-2 text-[#94A3B8]">
                        <span>Rule Weight (0–50 pts):</span>
                        <input
                          id={`admin-rule-weight-${rule.id}`}
                          name={`ruleWeight_${rule.id}`}
                          type="number"
                          min={0}
                          max={50}
                          defaultValue={rule.ruleWeightsJson?.weight ?? 15}
                          onBlur={(e) =>
                            handleUpdateRule(rule, { weight: Number(e.target.value) })
                          }
                          className="w-16 rounded border border-[#243040] bg-[#0D1218] px-2 py-1 text-xs font-mono text-[#F3F6F9]"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleCreateRule}
                className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3 self-start"
              >
                <div className="flex items-center gap-2 font-display text-sm font-semibold text-[#F59E0B]">
                  <Plus className="h-4 w-4" />
                  <span>Add Scam Category / Detection Rule</span>
                </div>
                <input
                  id="admin-rule-name"
                  name="ruleName"
                  aria-label="Category Name"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Category Name (e.g., Digital Arrest Impersonation)"
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <input
                  id="admin-rule-slug"
                  name="ruleSlug"
                  aria-label="Category Slug"
                  value={newRule.slug}
                  onChange={(e) => setNewRule({ ...newRule, slug: e.target.value })}
                  placeholder="Slug (e.g., digital-arrest-threat)"
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs font-mono text-[#F3F6F9]"
                />
                <textarea
                  id="admin-rule-desc"
                  name="ruleDescription"
                  aria-label="Description of scam pattern"
                  required
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Description of scam pattern..."
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    id="admin-rule-severity"
                    name="ruleSeverity"
                    aria-label="Default Severity"
                    value={newRule.severityDefault}
                    onChange={(e) => setNewRule({ ...newRule, severityDefault: e.target.value })}
                    className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  >
                    <option value="MODERATE">MODERATE</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <input
                    id="admin-rule-weight"
                    name="ruleWeight"
                    aria-label="New Rule Weight"
                    type="number"
                    min={0}
                    max={50}
                    value={newRule.weight}
                    onChange={(e) => setNewRule({ ...newRule, weight: Number(e.target.value) })}
                    className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs font-mono text-[#F3F6F9]"
                  />
                </div>
                <select
                  id="admin-rule-indicator"
                  name="ruleIndicatorKey"
                  aria-label="Detection Indicator Key"
                  value={newRule.indicatorKey}
                  onChange={(e) => setNewRule({ ...newRule, indicatorKey: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                >
                  <option value="authority_impersonation">authority_impersonation</option>
                  <option value="urgent_payment_demand">urgent_payment_demand</option>
                  <option value="otp_or_pin_request">otp_or_pin_request</option>
                  <option value="suspicious_external_link">suspicious_external_link</option>
                  <option value="threat_or_fear_language">threat_or_fear_language</option>
                  <option value="payment_purpose_inconsistency">payment_purpose_inconsistency</option>
                </select>
                <input
                  id="admin-rule-keywords"
                  name="ruleKeywords"
                  aria-label="Comma-separated keywords"
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  placeholder="Comma-separated keywords"
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <button
                  type="submit"
                  disabled={creatingRule}
                  className="w-full rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                >
                  {creatingRule ? 'Saving...' : 'Create Category & Rule'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: EDUCATIONAL SAFETY CONTENT */}
          {activeTab === 'education' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <h2 className="font-display text-base font-semibold">
                  Published Educational Safety Advisories ({eduList.length})
                </h2>
                {eduList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#243040] bg-[#131A22] p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-mono text-[#38BDF8] uppercase">
                          {item.category} · {item.language}
                        </div>
                        <h3 className="font-display text-sm font-bold text-[#F3F6F9]">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleEduPublish(item)}
                          className={`rounded px-2 py-1 text-[11px] font-mono ${
                            item.isPublished
                              ? 'bg-[#10B981]/15 text-[#10B981]'
                              : 'bg-[#64748B]/20 text-[#94A3B8]'
                          }`}
                        >
                          {item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEdu(item.id)}
                          className="p-1 text-[#94A3B8] hover:text-[#EF4444]"
                          aria-label="Delete advisory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{item.summary}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleCreateEdu}
                className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3 self-start"
              >
                <h3 className="font-display text-sm font-semibold text-[#14B8A6]">
                  Publish Safety Advisory
                </h3>
                <input
                  id="admin-edu-title"
                  name="eduTitle"
                  aria-label="Advisory Title"
                  required
                  value={newEdu.title}
                  onChange={(e) => setNewEdu({ ...newEdu, title: e.target.value })}
                  placeholder="Advisory Title"
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="admin-edu-category"
                    name="eduCategory"
                    aria-label="Advisory Category"
                    required
                    value={newEdu.category}
                    onChange={(e) => setNewEdu({ ...newEdu, category: e.target.value })}
                    placeholder="Category"
                    className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  />
                  <select
                    id="admin-edu-lang"
                    name="eduLanguage"
                    aria-label="Advisory Language"
                    value={newEdu.language}
                    onChange={(e) => setNewEdu({ ...newEdu, language: e.target.value })}
                    className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>
                <textarea
                  id="admin-edu-summary"
                  name="eduSummary"
                  aria-label="Safety guidance summary"
                  required
                  rows={3}
                  value={newEdu.summary}
                  onChange={(e) => setNewEdu({ ...newEdu, summary: e.target.value })}
                  placeholder="Clear, everyday safety guidance summary..."
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <textarea
                  id="admin-edu-checklist"
                  name="eduChecklist"
                  aria-label="Checklist actions"
                  rows={3}
                  value={newEdu.checklistText}
                  onChange={(e) => setNewEdu({ ...newEdu, checklistText: e.target.value })}
                  placeholder="Checklist actions (one per line)"
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#14B8A6] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                >
                  Save Safety Advisory
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: SUPPORT REQUESTS */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">
                  User Support Requests ({supportList.length})
                </h2>
                <select
                  id="admin-support-filter"
                  name="supportFilter"
                  aria-label="Filter support requests by status"
                  value={supportFilter}
                  onChange={async (e) => {
                    setSupportFilter(e.target.value);
                    const r = await apiFetch(`/api/admin/support?status=${e.target.value}`);
                    if (r.ok) setSupportList((await r.json()).tickets || []);
                  }}
                  className="rounded-lg border border-[#243040] bg-[#131A22] px-3 py-1.5 text-xs text-[#F3F6F9]"
                >
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {supportList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#243040] p-8 text-center text-xs text-[#94A3B8]">
                  No support requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {supportList.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-mono text-[#38BDF8]">{ticket.referenceCode}</span>
                          <span className="text-[#94A3B8]">
                            {' '}
                            · {ticket.name} ({ticket.email}) · {ticket.topic}
                          </span>
                        </div>
                        <span className="font-mono uppercase text-[#F59E0B]">{ticket.status}</span>
                      </div>
                      <p className="text-sm text-[#F3F6F9]">{ticket.message}</p>
                      {ticket.adminReply && (
                        <div className="rounded-lg bg-[#0D1218] p-3 text-xs text-[#10B981]">
                          Admin Reply: {ticket.adminReply}
                        </div>
                      )}
                      {replyTicketId === ticket.id ? (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#243040]">
                          <select
                            id={`admin-reply-status-${ticket.id}`}
                            name="replyStatus"
                            aria-label="Ticket status"
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value as any)}
                            className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-1.5 text-xs text-[#F3F6F9]"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <input
                            id={`admin-reply-text-${ticket.id}`}
                            name="replyText"
                            aria-label="Official support response"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write official response..."
                            className="flex-1 rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-1.5 text-xs text-[#F3F6F9]"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateSupport(ticket.id)}
                            className="rounded-lg bg-[#14B8A6] px-3.5 py-1.5 text-xs font-semibold text-[#0B0F14]"
                          >
                            Save Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyTicketId(null)}
                            className="rounded-lg border border-[#243040] px-3 py-1.5 text-xs text-[#94A3B8]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTicketId(ticket.id);
                            setReplyText(ticket.adminReply || '');
                            setReplyStatus(ticket.status);
                          }}
                          className="text-xs font-semibold text-[#38BDF8] hover:underline"
                        >
                          Respond / Update Ticket →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AI LOGS & ADMIN AUDIT TRAIL */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#243040] bg-[#131A22] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#243040] font-display text-sm font-semibold">
                  AI Inference &amp; System Error Log
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1B2430] text-[#94A3B8]">
                      <tr>
                        <th className="px-4 py-2.5">Timestamp</th>
                        <th className="px-4 py-2.5">Module</th>
                        <th className="px-4 py-2.5">Model</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Latency</th>
                        <th className="px-4 py-2.5">Error Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243040]">
                      {aiLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[#94A3B8]">
                            No AI invocations logged yet.
                          </td>
                        </tr>
                      ) : (
                        aiLogs.map((l) => (
                          <tr key={l.id}>
                            <td className="px-4 py-2 text-[#94A3B8] whitespace-nowrap">
                              {new Date(l.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 font-mono text-[#38BDF8]">{l.module}</td>
                            <td className="px-4 py-2 font-mono text-[#94A3B8]">{l.modelName}</td>
                            <td className="px-4 py-2 font-mono uppercase">
                              <span
                                className={l.status === 'success' ? 'text-[#10B981]' : 'text-[#EF4444]'}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{l.latencyMs} ms</td>
                            <td className="px-4 py-2 text-[#EF4444] truncate max-w-xs">
                              {l.errorMessage || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#243040] bg-[#131A22] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#243040] font-display text-sm font-semibold text-[#F59E0B]">
                  Administrator Security Audit Log
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1B2430] text-[#94A3B8]">
                      <tr>
                        <th className="px-4 py-2.5">Timestamp</th>
                        <th className="px-4 py-2.5">Admin</th>
                        <th className="px-4 py-2.5">Action</th>
                        <th className="px-4 py-2.5">Target</th>
                        <th className="px-4 py-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243040]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-[#94A3B8]">
                            No administrative actions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((a) => (
                          <tr key={a.id}>
                            <td className="px-4 py-2 text-[#94A3B8] whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-[#F3F6F9]">
                              {a.adminEmail || 'System / Unauthenticated'}
                            </td>
                            <td className="px-4 py-2 font-mono text-[#F59E0B]">{a.action}</td>
                            <td className="px-4 py-2 font-mono text-[#38BDF8]">
                              {a.targetType} {a.targetId ? `#${a.targetId}` : ''}
                            </td>
                            <td className="px-4 py-2 font-mono text-[#94A3B8] truncate max-w-xs">
                              {JSON.stringify(a.details || {})}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LIVE CITIZEN INVESTIGATIONS & EVIDENCE */}
          {activeTab === 'investigations' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#243040] bg-[#131A22] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#243040] font-display text-sm font-semibold text-[#38BDF8]">
                  Live Citizen Investigations (Shared PostgreSQL)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1B2430] text-[#94A3B8]">
                      <tr>
                        <th className="px-4 py-2.5">ID</th>
                        <th className="px-4 py-2.5">Title</th>
                        <th className="px-4 py-2.5">Citizen</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Risk</th>
                        <th className="px-4 py-2.5">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243040]">
                      {adminInvestigations.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-2 font-mono text-[#94A3B8]">#{inv.id}</td>
                          <td className="px-4 py-2 text-[#F3F6F9] font-medium">{inv.title}</td>
                          <td className="px-4 py-2 text-[#94A3B8]">{inv.userEmail || `User #${inv.userId}`}</td>
                          <td className="px-4 py-2 text-[#38BDF8]">{inv.scamCategory || 'General'}</td>
                          <td className="px-4 py-2 font-mono font-bold text-[#F59E0B]">{inv.riskScore ?? 0}/100</td>
                          <td className="px-4 py-2 text-[#94A3B8]">
                            {inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                      {adminInvestigations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[#94A3B8]">
                            No citizen investigations recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#243040] bg-[#131A22] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#243040] font-display text-sm font-semibold text-[#14B8A6]">
                  Recent Evidence Uploads Metadata ({adminEvidence.length})
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1B2430] text-[#94A3B8]">
                      <tr>
                        <th className="px-4 py-2.5">Evidence ID</th>
                        <th className="px-4 py-2.5">Case ID</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Title</th>
                        <th className="px-4 py-2.5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243040]">
                      {adminEvidence.map((ev) => (
                        <tr key={ev.id}>
                          <td className="px-4 py-2 font-mono text-[#94A3B8]">#{ev.id}</td>
                          <td className="px-4 py-2 font-mono text-[#38BDF8]">#{ev.investigationId}</td>
                          <td className="px-4 py-2 text-[#F59E0B]">{ev.type}</td>
                          <td className="px-4 py-2 text-[#F3F6F9]">{ev.title}</td>
                          <td className="px-4 py-2 text-[#94A3B8]">
                            {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                      {adminEvidence.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-[#94A3B8]">
                            No evidence metadata recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AGGREGATED FINANCIAL MODULES TELEMETRY */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Financial Transactions', financeSummary?.counts?.transactions ?? 0, 'text-[#14B8A6]'],
                  ['Category Budgets', financeSummary?.counts?.budgets ?? 0, 'text-[#38BDF8]'],
                  ['Portfolio Holdings', financeSummary?.counts?.portfolioHoldings ?? 0, 'text-[#818CF8]'],
                  ['Paper Trades', financeSummary?.counts?.paperTrades ?? 0, 'text-[#F59E0B]'],
                  ['Tax Calculations', financeSummary?.counts?.taxCalculations ?? 0, 'text-[#10B981]'],
                  ['GST Invoices', financeSummary?.counts?.businessInvoices ?? 0, 'text-[#38BDF8]'],
                  ['Business Cash Flow', financeSummary?.counts?.businessCashflow ?? 0, 'text-[#F97316]'],
                ].map(([label, val, color]) => (
                  <div key={String(label)} className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
                    <div className="text-xs text-[#94A3B8]">{label}</div>
                    <div className={`font-mono text-2xl font-bold mt-1 ${color}`}>{val}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#94A3B8]">
                Aggregated counts reflect live Citizen activity across Budgeting, Investments, Paper Trading, Tax, and Small Business tables in Cloud SQL PostgreSQL. Individual private financial entries remain user-isolated.
              </p>
            </div>
          )}

          {/* VERSIONED MODEL CONFIGURATION */}
          {activeTab === 'model-config' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveModelConfig}
                className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  Update AI / Risk Model Configuration
                </h2>
                <div>
                  <label htmlFor="mc-key" className="block text-xs text-[#94A3B8] mb-1">
                    Configuration Key
                  </label>
                  <input
                    id="mc-key"
                    name="configKey"
                    required
                    value={modelForm.configKey}
                    onChange={(e) => setModelForm({ ...modelForm, configKey: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
                <div>
                  <label htmlFor="mc-val" className="block text-xs text-[#94A3B8] mb-1">
                    Value
                  </label>
                  <input
                    id="mc-val"
                    name="configValue"
                    required
                    value={modelForm.configValue}
                    onChange={(e) => setModelForm({ ...modelForm, configValue: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
                <div>
                  <label htmlFor="mc-desc" className="block text-xs text-[#94A3B8] mb-1">
                    Description / Change Note
                  </label>
                  <input
                    id="mc-desc"
                    name="description"
                    value={modelForm.description}
                    onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#FBBF24]"
                >
                  Save Versioned Configuration
                </button>
              </form>

              <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-5">
                <h2 className="font-display text-base font-semibold text-[#F3F6F9] mb-4">
                  Active &amp; Historical Model Configurations
                </h2>
                <div className="space-y-2.5 text-xs">
                  {modelConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-semibold text-[#F59E0B]">
                          {cfg.configKey} <span className="text-[#94A3B8]">v{cfg.version}</span>
                        </div>
                        <div className="text-[#94A3B8]">{cfg.description}</div>
                      </div>
                      <div className="font-mono text-[#14B8A6] font-bold">{cfg.configValue}</div>
                    </div>
                  ))}
                  {modelConfigs.length === 0 && (
                    <p className="text-xs text-[#94A3B8]">No custom model configurations saved yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
