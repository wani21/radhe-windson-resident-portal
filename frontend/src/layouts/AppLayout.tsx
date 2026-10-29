import { ReactNode } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Wrench,
  Receipt,
  Bell,
  LayoutDashboard,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AppLayoutProps {
  children: ReactNode;
  activeNav?: string;
  onNavigate?: (navId: string) => void;
}

export const AppLayout = ({ children, activeNav = 'dashboard', onNavigate }: AppLayoutProps) => {
  const { user, logout } = useAuthStore();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SOCIETY_ADMIN':
        return { label: 'Society Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'COMMITTEE_MEMBER':
        return { label: 'Committee Member', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'SECURITY':
        return { label: 'Gate Security', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Resident', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Operational Dashboard',
      icon: LayoutDashboard,
      roles: ['SOCIETY_ADMIN', 'COMMITTEE_MEMBER', 'RESIDENT'],
    },
    {
      id: 'flats',
      label: user?.role === 'RESIDENT' ? 'My Flat' : 'Wings & Flats',
      icon: Building2,
      roles: ['SOCIETY_ADMIN', 'RESIDENT'],
    },
    {
      id: 'residents',
      label: 'Resident Directory',
      icon: Users,
      roles: ['SOCIETY_ADMIN'],
    },
    {
      id: 'visitors',
      label: 'Visitor Gate Desk',
      icon: ShieldCheck,
      roles: ['SOCIETY_ADMIN', 'SECURITY'],
    },
    {
      id: 'complaints',
      label: user?.role === 'RESIDENT' ? 'My Complaints' : 'Complaints Helpdesk',
      icon: Wrench,
      roles: ['SOCIETY_ADMIN', 'COMMITTEE_MEMBER', 'RESIDENT'],
    },
    {
      id: 'maintenance',
      label: user?.role === 'RESIDENT' ? 'My Bills' : 'Maintenance Ledger',
      icon: Receipt,
      roles: ['SOCIETY_ADMIN', 'COMMITTEE_MEMBER', 'RESIDENT'],
    },
    {
      id: 'notices',
      label: 'Notices & Bulletins',
      icon: Bell,
      roles: ['SOCIETY_ADMIN', 'COMMITTEE_MEMBER', 'RESIDENT'],
    },
  ];

  const allowedNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const roleBadge = user ? getRoleBadge(user.role) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                RADHE WINDSON
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Residential ERP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
              {roleBadge && (
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Society Operations
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-800 capitalize">{activeNav}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
