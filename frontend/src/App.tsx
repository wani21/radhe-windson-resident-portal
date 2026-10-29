import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { FlatsPage } from './features/society/FlatsPage';
import { SocietySettingsPage } from './features/society/SocietySettingsPage';
import { ResidentsPage } from './features/residents/ResidentsPage';
import {
  ShieldCheck,
  Building2,
  Users,
  Wrench,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { societyService } from './services/societyService';
import { residentService } from './services/residentService';

export default function App() {
  const { user, isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();
  const [currentNav, setCurrentNav] = useState('dashboard');
  const [buildingCount, setBuildingCount] = useState<number>(0);
  const [flatCount, setFlatCount] = useState<number>(0);
  const [residentCount, setResidentCount] = useState<number>(0);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Load dashboard overview counters when dashboard is active
  useEffect(() => {
    if (isAuthenticated) {
      societyService.getBuildings().then((b) => setBuildingCount(b.length)).catch(() => {});
      societyService.getFlats({ limit: 1 }).then((f) => setFlatCount(f.meta.total)).catch(() => {});
      residentService.getResidents({ residencyStatus: 'ACTIVE', limit: 1 }).then((r) => setResidentCount(r.meta.total)).catch(() => {});
    }
  }, [isAuthenticated, currentNav]);

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
      {currentNav === 'flats' ? (
        <FlatsPage />
      ) : currentNav === 'settings' ? (
        <SocietySettingsPage />
      ) : currentNav === 'residents' ? (
        <ResidentsPage />
      ) : (
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

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Towers & Wings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{buildingCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Active wings registered</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Residential Flats</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{flatCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Compound unique units</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Architecture</p>
              <p className="text-xl font-bold text-slate-900 mt-1">RBAC Enforced</p>
              <p className="text-[11px] text-slate-500 mt-1">HttpOnly session token</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Residents</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{residentCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Registered occupants</p>
            </div>
          </div>

          {/* Quick Action Navigation for Admin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Society Infrastructure Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => setCurrentNav('flats')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1 group-hover:text-blue-600">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Wings & Flat Directory</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Manage wings, configure floor ranges, and register flats with uniqueness checks.
                </p>
              </button>

              <button
                onClick={() => setCurrentNav('settings')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1 group-hover:text-blue-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Society Settings</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Configure society profile, maintenance due dates, and operational late fees.
                </p>
              </button>

              <button
                onClick={() => setCurrentNav('residents')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1 group-hover:text-blue-600">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Resident Management</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Register residents, manage households, track occupancy and move-outs.
                </p>
              </button>

              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-left">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Visitor & Complaints</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Upcoming Phase 5+ modules: visitor gate desk and complaint helpdesk.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
