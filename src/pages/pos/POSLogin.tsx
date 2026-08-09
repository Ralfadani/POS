import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import {
  Shield,
  Tablet,
  Lock,
  User,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  HelpCircle
} from 'lucide-react';

interface POSLoginProps {
  initialRole?: 'kasir' | 'admin';
  onNavigate?: (view: 'landing' | 'pos' | 'admin' | 'customer') => void;
}

export const POSLogin: React.FC<POSLoginProps> = ({ initialRole = 'kasir', onNavigate }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'kasir' | 'admin'>(initialRole);
  const [username, setUsername] = useState(initialRole === 'admin' ? 'admin' : 'kasir');
  const [password, setPassword] = useState(initialRole === 'admin' ? 'admin123' : 'kasir123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cafeProfile, setCafeProfile] = useState<{ cafe_name: string; tagline?: string }>({
    cafe_name: 'KAFE & RESTO KITA',
    tagline: 'Sistem POS Tablet & Operasional Cafe'
  });
  const [showDevGuide, setShowDevGuide] = useState(false);

  useEffect(() => {
    fetch('/api/cafe-profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setCafeProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleChange = (role: 'kasir' | 'admin') => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('kasir');
      setPassword('kasir123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username.trim(), password);
    if (!res.success) {
      setError(res.error || 'Login gagal. Periksa kembali username dan password.');
      setLoading(false);
      return;
    }

    // Login success: if onNavigate is provided, route accordingly
    if (onNavigate) {
      if (selectedRole === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('pos');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top back button to Landing */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Cafe</span>
        </button>
      )}

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-2xl text-2xl font-bold mb-3 shadow-lg shadow-emerald-900/30">
            ☕
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {cafeProfile.cafe_name || 'KAFE & RESTO KITA'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {cafeProfile.tagline || 'Pusat Masuk Operasional Kasir & Admin'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60 mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('kasir')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedRole === 'kasir'
                ? 'bg-[#1A3A5C] text-white shadow-md border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tablet className="w-4 h-4 text-blue-400" />
            <span>POS Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedRole === 'admin'
                ? 'bg-amber-600 text-white shadow-md border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-300" />
            <span>Admin / Owner</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Username {selectedRole === 'admin' ? 'Admin' : 'Kasir'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'Masukkan username admin' : 'Masukkan username kasir'}
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-6 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'admin'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Masuk ke {selectedRole === 'admin' ? 'Dashboard Admin' : 'Sistem POS Kasir'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Helper Chips */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Akun Default Sistem:</span>
            <button
              type="button"
              onClick={() => setShowDevGuide(!showDevGuide)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showDevGuide ? 'Tutup Panduan' : 'Panduan Klien'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('kasir');
                setUsername('kasir');
                setPassword('kasir123');
              }}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-blue-400">Kasir 1 (Staf)</div>
              <div className="text-[10px] text-slate-400 font-mono">kasir / kasir123</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setUsername('admin');
                setPassword('admin123');
              }}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-amber-400">Admin (Owner)</div>
              <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
            </button>
          </div>

          {/* Collapsible Developer Distribution Guide */}
          {showDevGuide && (
            <div className="mt-4 p-3.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl text-slate-300 text-[11px] space-y-2 leading-relaxed">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Panduan Distribusi ke Klien:</span>
              </div>
              <p>
                1. <strong>Berikan Akun Utama:</strong> Berikan akun <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">admin</code> / <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">admin123</code> kepada pemilik cafe/klien Anda.
              </p>
              <p>
                2. <strong>Klien Mengubah Password:</strong> Klien dapat mengganti password admin dan membuat akun kasir baru untuk tiap staf di <strong>Dashboard Admin &rarr; Kelola Akun Kasir</strong>.
              </p>
              <p>
                3. <strong>Pemasangan Tablet:</strong> Di tablet kasir, buka URL ini di Chrome lalu tekan <em>"Tambahkan ke Layar Utama" (Install PWA)</em>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

