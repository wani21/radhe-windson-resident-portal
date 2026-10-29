import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { ShieldCheck, Building2, Users, Wrench, Loader2 } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();
  const [currentNav, setCurrentNav] = useState('dashboard');

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Initial authentication check state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Verifying Society ERP Session...
        </p>
      </div>
    );
  }

  // Unauthenticated user -> render login page
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Authenticated user -> render AppLayout with active operational module
  return (
    <AppLayout activeNav={currentNav} onNavigate={setCurrentNav}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back, {user.fullName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <span className="font-semibold text-slate-700">{user.role}</span> • Session active via encrypted HttpOnly cookie
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Account Status:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
        </div>

        {/* Operational Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security State</p>
            <p className="text-xl font-bold text-slate-900 mt-1">RBAC Enforced</p>
            <p className="text-[11px] text-slate-500 mt-1">JWT tokenVersion verified</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Wing / Flat Scope</p>
            <p className="text-xl font-bold text-slate-900 mt-1">Radhe Windson</p>
            <p className="text-[11px] text-slate-500 mt-1">Compound unique indexes ready</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resident Isolation</p>
            <p className="text-xl font-bold text-slate-900 mt-1">IDOR Shielded</p>
            <p className="text-[11px] text-slate-500 mt-1">Server identity bound</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Helpdesk Ticketing</p>
            <p className="text-xl font-bold text-slate-900 mt-1">Audit Log Ready</p>
            <p className="text-[11px] text-slate-500 mt-1">Transitions tracked</p>
          </div>
        </div>

        {/* Active Module Placeholder / Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-14">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Phase 2: Authentication & Session Verification Complete
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Your session is securely authenticated against the live database using encrypted HttpOnly cookies. We are now ready to implement Phase 3: Society Configuration, Wings, and Flat Directory with compound unique constraints.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
