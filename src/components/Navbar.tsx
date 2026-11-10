import React from 'react';
import { Sparkles, ShieldCheck, LogOut, CheckSquare, Users, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  currentView: 'attendance' | 'login' | 'dashboard' | 'residents';
  onNavigate: (view: 'attendance' | 'login' | 'dashboard' | 'residents') => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate(isAdminLoggedIn ? 'dashboard' : 'attendance')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">
                Kebersihan Asrama
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Lorong 3 & 4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Sistem Absensi &amp; Monitoring Kerja Bakti
            </p>
          </div>
        </div>

        {/* Navigation Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={cn(
                  'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('residents')}
                className={cn(
                  'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  currentView === 'residents'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Data Penghuni</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Buka form absensi penghuni"
              >
                Lihat Form
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                title="Keluar dari akun pengurus"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {currentView === 'login' ? (
                <button
                  type="button"
                  onClick={() => onNavigate('attendance')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  &larr; Ke Halaman Absensi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-subtle transition-colors flex items-center gap-1.5 shadow-subtle"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Pengurus</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
