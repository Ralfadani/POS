import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { PWAInstallModal } from '../../components/ui/PWAInstallModal.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  Tablet,
  LayoutDashboard,
  Coffee,
  QrCode,
  CheckCircle2,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Download,
  UtensilsCrossed,
  HelpCircle,
  ArrowRight,
  UserCheck,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'pos' | 'admin' | 'customer', extraParam?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isAccountGuideOpen, setIsAccountGuideOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Login Modal State (Pop-up when clicking cards)
  const [loginModalRole, setLoginModalRole] = useState<'pos' | 'admin' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cafe Profile
  const [cafeProfile, setCafeProfile] = useState<any>({
    cafe_name: 'KAFE & RESTO KITA',
    tagline: 'Sistem POS Kasir & Operasional Cafe'
  });

  useEffect(() => {
    fetch('/api/cafe-profile')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.profile) {
          setCafeProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  const openLoginModal = (role: 'pos' | 'admin') => {
    setLoginModalRole(role);
    setLoginError(null);
    if (role === 'pos') {
      setUsername('kasir');
      setPassword('kasir123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const closeLoginModal = () => {
    setLoginModalRole(null);
    setLoginError(null);
    setIsSubmitting(false);
  };

  const handleModalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Username dan password wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError(null);
      const res = await login(username.trim(), password.trim());
      if (res.success) {
        const target = loginModalRole || 'pos';
        closeLoginModal();
        onNavigate(target);
      } else {
        setLoginError(res.error || 'Login gagal. Periksa username dan password.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan sistem saat login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLoginNow = async (u: string, p: string, role: 'pos' | 'admin') => {
    try {
      setIsSubmitting(true);
      setLoginError(null);
      setUsername(u);
      setPassword(p);
      const res = await login(u, p);
      if (res.success) {
        closeLoginModal();
        onNavigate(role);
      } else {
        setLoginError(res.error || 'Login gagal');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between overflow-hidden font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* 1. COMPACT NAVBAR */}
      <header className="shrink-0 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 block leading-tight">
                {cafeProfile?.cafe_name || 'KAFE & RESTO KITA'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium hidden xs:block">
                Sistem POS Kasir & Operasional Cafe
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setIsAccountGuideOpen(true)}
              className="px-2 sm:px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-blue-600" />
              <span>Info Akun</span>
            </button>

            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Instal POS</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN: 3 KOTAK KECIL MENYAMPING TANPA PERLU SCROLL DI GADGET */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-2 sm:py-4 flex flex-col justify-center items-center">
        
        {/* COMPACT HEADER TEXT */}
        <div className="text-center space-y-0.5 max-w-md mx-auto mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            <Building2 className="w-2.5 h-2.5" />
            <span>Pilih Akses Layanan POS</span>
          </div>
          <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
            Menu Akses & Login Sistem
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500">
            Klik kotak untuk membuka form pop-up login atau langsung akses menu tamu.
          </p>
        </div>

        {/* 3 KOTAK KECIL MENYAMPING (3 COMPACT HORIZONTAL BOXES - NO SCROLL) */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 items-stretch">
          
          {/* KOTAK 1: POS KASIR (TABLET) */}
          <div
            id="btn-card-pos"
            onClick={() => openLoginModal('pos')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLoginModal('pos')}
            className="group cursor-pointer bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden text-center sm:text-left"
          >
            <div className="absolute top-0 right-0 w-10 h-10 bg-blue-50 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="space-y-1.5 sm:space-y-2 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1A3A5C] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Tablet className="w-4 h-4 text-blue-200" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Kasir & Barista
                </span>
              </div>

              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                  POS Kasir
                </h2>
                <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight hidden xs:block">
                  Input pesanan meja, split bill & cetak struk.
                </p>
              </div>

              <div className="pt-1 border-t border-slate-100 flex flex-wrap gap-1 text-[8px] sm:text-[9px] justify-center sm:justify-start">
                <span className="px-1 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Split Bill
                </span>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                type="button"
                className="w-full py-1.5 sm:py-2 px-1.5 sm:px-2 bg-[#1A3A5C] group-hover:bg-[#122840] text-white rounded-lg text-[9px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <KeyRound className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Login Kasir</span>
                <ArrowRight className="w-2.5 h-2.5 hidden sm:inline" />
              </button>
            </div>
          </div>

          {/* KOTAK 2: BUKU MENU SELF-ORDER (TAMU MEJA) */}
          <div
            id="btn-card-customer"
            onClick={() => onNavigate('customer')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('customer')}
            className="group cursor-pointer bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden text-center sm:text-left"
          >
            <div className="absolute top-0 right-0 w-10 h-10 bg-emerald-50 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="space-y-1.5 sm:space-y-2 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Tamu Meja
                </span>
              </div>

              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                  Menu Tamu
                </h2>
                <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight hidden xs:block">
                  Self-order pelanggan tanpa antri di meja.
                </p>
              </div>

              <div className="pt-1 border-t border-slate-100 flex flex-wrap gap-1 text-[8px] sm:text-[9px] justify-center sm:justify-start">
                <span className="px-1 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Meja 01-12
                </span>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                type="button"
                className="w-full py-1.5 sm:py-2 px-1.5 sm:px-2 bg-emerald-600 group-hover:bg-emerald-500 text-white rounded-lg text-[9px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <UtensilsCrossed className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Buka Menu</span>
                <ArrowRight className="w-2.5 h-2.5 hidden sm:inline" />
              </button>
            </div>
          </div>

          {/* KOTAK 3: DASHBOARD ADMIN (OWNER) */}
          <div
            id="btn-card-admin"
            onClick={() => openLoginModal('admin')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLoginModal('admin')}
            className="group cursor-pointer bg-white rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:shadow-md transition-all p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden text-center sm:text-left"
          >
            <div className="absolute top-0 right-0 w-10 h-10 bg-amber-50 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="space-y-1.5 sm:space-y-2 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  Owner
                </span>
              </div>

              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
                  Admin Owner
                </h2>
                <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight hidden xs:block">
                  Omzet harian, edit menu & kelola staf.
                </p>
              </div>

              <div className="pt-1 border-t border-slate-100 flex flex-wrap gap-1 text-[8px] sm:text-[9px] justify-center sm:justify-start">
                <span className="px-1 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Omzet & Stok
                </span>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                type="button"
                className="w-full py-1.5 sm:py-2 px-1.5 sm:px-2 bg-amber-600 group-hover:bg-amber-500 text-white rounded-lg text-[9px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Login Admin</span>
                <ArrowRight className="w-2.5 h-2.5 hidden sm:inline" />
              </button>
            </div>
          </div>

        </div>

        {/* QUICK ACCESS STRIP UNDER BOXES FOR INSTANT CLICK (NO TYPING NEEDED) */}
        <div className="w-full max-w-2xl mt-2.5 sm:mt-3 p-1.5 sm:p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-1.5 text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Akses Cepat Langsung Masuk:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleQuickLoginNow('admin', 'admin123', 'admin')}
              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-bold transition-colors"
            >
              👑 Admin (admin123)
            </button>
            <button
              onClick={() => handleQuickLoginNow('kasir', 'kasir123', 'pos')}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded font-bold transition-colors"
            >
              📱 Kasir (kasir123)
            </button>
          </div>
        </div>

      </main>

      {/* 3. CLEAN COMPACT FOOTER */}
      <footer className="shrink-0 bg-white border-t border-slate-200 py-2 px-3 sm:px-6 text-[10px] sm:text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col xs:flex-row items-center justify-between gap-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-800">
              {cafeProfile?.cafe_name || 'KAFE & RESTO KITA'}
            </span>
            <span>•</span>
            <span>Sistem POS & Operasional Cafe</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => openLoginModal('pos')}
              className="hover:text-blue-600 font-medium transition-colors"
            >
              Kasir
            </button>
            <button
              onClick={() => onNavigate('customer')}
              className="hover:text-emerald-600 font-medium transition-colors"
            >
              Menu Meja
            </button>
            <button
              onClick={() => openLoginModal('admin')}
              className="hover:text-amber-600 font-medium transition-colors"
            >
              Admin Owner
            </button>
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
            >
              Instal POS
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL POP-UP: LOGIN FORM UNTUK POS KASIR & ADMIN OWNER */}
      <Modal
        isOpen={loginModalRole !== null}
        onClose={closeLoginModal}
        title={loginModalRole === 'admin' ? '🔑 Login Dashboard Admin' : '📱 Login POS Kasir'}
        subtitle={
          loginModalRole === 'admin'
            ? 'Akses omzet harian, edit menu, stok & pengaturan'
            : 'Akses transaksi meja & cetak struk thermal'
        }
        maxWidth="sm"
      >
        <div className="space-y-2.5 text-xs text-slate-700">
          
          {/* QUICK 1-CLICK STRIP INSIDE POP-UP */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${
            loginModalRole === 'admin'
              ? 'bg-amber-50/90 border-amber-200 text-amber-900'
              : 'bg-blue-50/90 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-slate-600" />
              <div>
                <div className="font-bold text-[10px]">
                  Akun: <span className="font-mono font-bold">{loginModalRole === 'admin' ? 'admin' : 'kasir'}</span> | Sandi: <span className="font-mono font-bold">{loginModalRole === 'admin' ? 'admin123' : 'kasir123'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (loginModalRole === 'admin') {
                  handleQuickLoginNow('admin', 'admin123', 'admin');
                } else {
                  handleQuickLoginNow('kasir', 'kasir123', 'pos');
                }
              }}
              disabled={isSubmitting}
              className={`px-2 py-1 rounded text-[10px] font-bold text-white shadow-2xs transition-colors shrink-0 ${
                loginModalRole === 'admin'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              1-Klik Masuk
            </button>
          </div>

          {/* LOGIN ERROR ALERT */}
          {loginError && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-lg flex items-center gap-1.5 font-medium">
              <span>{loginError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleModalLoginSubmit} className="space-y-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={loginModalRole === 'admin' ? 'admin' : 'kasir'}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-2.5 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={closeLoginModal}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white transition-colors shadow-2xs flex items-center justify-center gap-1.5 ${
                  loginModalRole === 'admin'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#1A3A5C] hover:bg-[#122840]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3 h-3" />
                    <span>Masuk {loginModalRole === 'admin' ? 'Admin' : 'Kasir'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </Modal>

      {/* MODAL 2: INSTALL POS PWA */}
      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onNavigateToPos={() => {
          setIsPwaModalOpen(false);
          openLoginModal('pos');
        }}
      />

      {/* MODAL 3: INFO AKUN LOGIN & PANDUAN PENGGUNA */}
      <Modal
        isOpen={isAccountGuideOpen}
        onClose={() => setIsAccountGuideOpen(false)}
        title="🔑 Informasi Akun Login Sistem"
        subtitle="Daftar akun default dan petunjuk pengelolaan akun staf"
        maxWidth="md"
      >
        <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Akun Administrator (Owner):</span>
            </h4>
            <div className="p-2 bg-white rounded-lg font-mono text-[11px] text-slate-900 flex items-center justify-between border border-slate-200">
              <div>
                <div>Username: <strong className="text-amber-700 font-bold">admin</strong></div>
                <div>Password: <strong className="text-amber-700 font-bold">admin123</strong></div>
              </div>
              <button
                onClick={() => copyToClipboard('admin / admin123', 'admin_acc')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-sans border border-slate-200"
              >
                {copyFeedback === 'admin_acc' ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-blue-600" />
              <span>Akun Staf Kasir (POS):</span>
            </h4>
            <div className="p-2 bg-white rounded-lg font-mono text-[11px] text-slate-900 flex items-center justify-between border border-slate-200">
              <div>
                <div>Username: <strong className="text-blue-700 font-bold">kasir</strong> / <strong className="text-blue-700 font-bold">kasir2</strong></div>
                <div>Password: <strong className="text-blue-700 font-bold">kasir123</strong></div>
              </div>
              <button
                onClick={() => copyToClipboard('kasir / kasir123', 'kasir_acc')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-sans border border-slate-200"
              >
                {copyFeedback === 'kasir_acc' ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              onClick={() => setIsAccountGuideOpen(false)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
