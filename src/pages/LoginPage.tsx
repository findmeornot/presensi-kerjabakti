import React, { useState } from 'react';
import { ShieldCheck, KeyRound, User, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/Toast';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onBackToAttendance: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToAttendance,
}) => {
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.loginAdmin(cleanUsername, password);
      if (res.success) {
        showToast('Login berhasil. Selamat datang di Dashboard Pengurus.', 'success');
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Login gagal. Periksa username dan password.');
        showToast(res.error || 'Login gagal.', 'error');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat otentikasi.');
      showToast('Terjadi kesalahan login.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          onClick={onBackToAttendance}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Absensi</span>
        </button>

        {/* Minimalist Card */}
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
          {/* Card Top Brand & Title */}
          <div className="p-7 sm:p-8 text-center pb-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-3 shadow-subtle border border-blue-100">
              <ShieldCheck className="w-7 h-7 stroke-[2]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Login</h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Masuk untuk mengelola absensi asrama
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 sm:px-8 pb-8 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Field: Username */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-subtle border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 placeholder:text-slate-400 bg-white shadow-subtle"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-subtle border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 placeholder:text-slate-400 bg-white shadow-subtle"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-subtle bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-subtle transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Dashboard</span>
              )}
            </button>

            {/* Note info for initial admin */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Akses terbatas hanya untuk pengurus asrama berwenang.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
