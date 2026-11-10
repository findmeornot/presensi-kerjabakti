import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { AttendancePage } from '@/pages/AttendancePage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ResidentsManagementPage } from '@/pages/ResidentsManagementPage';
import { api } from '@/services/api';

type ViewMode = 'attendance' | 'login' | 'dashboard' | 'residents';

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('attendance');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth session on startup
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuth = await api.checkAdminSession();
        setIsAdminLoggedIn(isAuth);
      } catch (err) {
        console.error('Failed to check admin session:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    verifyAuth();
  }, []);

  const handleNavigate = (view: ViewMode) => {
    if ((view === 'dashboard' || view === 'residents') && !isAdminLoggedIn) {
      setCurrentView('login');
      showToast('Silakan login pengurus terlebih dahulu.', 'info');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logoutAdmin();
      setIsAdminLoggedIn(false);
      setCurrentView('attendance');
      showToast('Berhasil keluar dari akun pengurus.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Memuat sistem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <div>
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          isAdminLoggedIn={isAdminLoggedIn}
          onLogout={handleLogout}
        />

        <main className="fade-in">
          {currentView === 'attendance' && <AttendancePage />}
          {currentView === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onBackToAttendance={() => handleNavigate('attendance')}
            />
          )}
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'residents' && <ResidentsManagementPage />}
        </main>
      </div>

      {/* Clean, minimalist footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium text-slate-700">
            Kebersihan Asrama &bull; Lorong 3 &amp; Lorong 4
          </div>
          <div className="text-slate-400">
            Sistem Absensi Kerja Bakti Asrama Modern &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
