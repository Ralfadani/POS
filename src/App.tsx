import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LandingPage } from './pages/landing/LandingPage.js';
import { POSDashboard } from './pages/pos/POSDashboard.js';
import { POSLogin } from './pages/pos/POSLogin.js';
import { AdminLayout } from './components/layout/AdminLayout.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminReports } from './pages/admin/AdminReports.js';
import { AdminMenu } from './pages/admin/AdminMenu.js';
import { AdminTables } from './pages/admin/AdminTables.js';
import { AdminTransactions } from './pages/admin/AdminTransactions.js';
import { AdminStockLogs } from './pages/admin/AdminStockLogs.js';
import { AdminCancelLogs } from './pages/admin/AdminCancelLogs.js';
import { AdminSettings } from './pages/admin/AdminSettings.js';
import { AdminUsers } from './pages/admin/AdminUsers.js';
import { CustomerMenu } from './pages/customer/CustomerMenu.js';
import { PWAInstallModal } from './components/ui/PWAInstallModal.js';
import {
  Smartphone,
  Tablet,
  LayoutDashboard,
  Coffee,
  Home,
  Download,
  LogOut,
  Sparkles,
  Maximize
} from 'lucide-react';

type AppView = 'landing' | 'pos' | 'admin' | 'customer';

const MainRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [adminMenu, setAdminMenu] = useState<string>('dashboard');
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [cafeName, setCafeName] = useState<string>('KAFE & RESTO KITA');

  // Load cafe profile
  useEffect(() => {
    fetch('/api/cafe-profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile?.cafe_name) {
          setCafeName(data.profile.cafe_name);
        }
      })
      .catch(() => {});
  }, []);

  // Parse path and query on initial load & popstate
  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const viewParam = search.get('view');
      const sessionId = search.get('session_id');
      const tableId = search.get('table_id');

      if (sessionId || tableId || path.includes('/order') || path.includes('/menu') || path.includes('/customer') || viewParam === 'customer') {
        setCurrentView('customer');
      } else if (path.includes('/admin') || viewParam === 'admin') {
        setCurrentView('admin');
      } else if (path.includes('/pos') || viewParam === 'pos') {
        setCurrentView('pos');
      } else if (path.includes('/landing') || viewParam === 'landing') {
        setCurrentView('landing');
      } else {
        // Default to landing page portal
        setCurrentView('landing');
      }
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const navigateTo = (view: AppView, extraParam?: string) => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'customer') {
      url.pathname = '/customer';
      url.searchParams.delete('view');
      if (extraParam && extraParam.includes('=')) {
        const [k, v] = extraParam.split('=');
        url.searchParams.set(k, v);
      }
    } else if (view === 'admin') {
      url.pathname = '/admin';
      url.searchParams.delete('view');
    } else if (view === 'pos') {
      url.pathname = '/pos';
      url.searchParams.delete('view');
    } else {
      url.pathname = '/';
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Cannot enter fullscreen mode:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Memuat Sistem POS & Operasional Cafe...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 font-sans overflow-hidden">
      {/* Top Universal Role Switcher & PWA Bar */}
      <header className={`px-3 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b shrink-0 z-50 shadow-xs select-none transition-colors ${
        currentView === 'landing'
          ? 'bg-white text-slate-900 border-slate-200 shadow-xs'
          : 'bg-slate-950 text-white border-slate-800 shadow-md'
      }`}>
        {/* Brand & Home click */}
        <div
          onClick={() => navigateTo('landing')}
          className="flex items-center space-x-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            ☕
          </div>
          <span className={`font-extrabold tracking-wider text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[240px] ${
            currentView === 'landing' ? 'text-slate-900' : 'text-emerald-400'
          }`}>
            {cafeName}
          </span>
          <span className={currentView === 'landing' ? 'text-slate-300 hidden md:inline' : 'text-slate-600 hidden md:inline'}>•</span>
          <span className={`text-[11px] hidden md:inline truncate ${
            currentView === 'landing' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Sistem POS Tablet & Self-Order Cafe
          </span>
        </div>

        {/* Center Role Buttons */}
        <div className={`flex items-center space-x-1 sm:space-x-1.5 p-1 rounded-xl border ${
          currentView === 'landing'
            ? 'bg-slate-100 border-slate-200'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => navigateTo('landing')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'landing'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Beranda</span>
          </button>

          <button
            onClick={() => navigateTo('customer')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'customer'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : currentView === 'landing'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Self-Order</span>
            <span className="xs:hidden">QR</span>
          </button>

          <button
            onClick={() => navigateTo('pos')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'pos'
                ? 'bg-[#1A3A5C] text-white font-bold shadow-xs border border-blue-400/40'
                : currentView === 'landing'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-blue-600" />
            <span>POS Kasir</span>
          </button>

          <button
            onClick={() => navigateTo('admin')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'admin'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : currentView === 'landing'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin</span>
          </button>
        </div>

        {/* Right Tools: Install PWA / Fullscreen Kiosk */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
              currentView === 'landing'
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
            }`}
            title="Unduh & Install Aplikasi Kasir di Tablet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install Tablet POS</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg transition-colors hidden xs:flex items-center justify-center ${
              currentView === 'landing'
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Mode Layar Penuh (Kiosk)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main View Display Area */}
      <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${
        currentView === 'landing' ? 'bg-slate-50' : 'bg-slate-950'
      }`}>
        {currentView === 'landing' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
            <LandingPage onNavigate={navigateTo} />
          </div>
        )}

        {currentView === 'customer' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <CustomerMenu />
          </div>
        )}

        {currentView === 'pos' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {!isAuthenticated ? (
              <POSLogin initialRole="kasir" onNavigate={navigateTo} />
            ) : (
              <POSDashboard />
            )}
          </div>
        )}

        {currentView === 'admin' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {!isAuthenticated ? (
              <POSLogin initialRole="admin" onNavigate={navigateTo} />
            ) : (
              <AdminLayout activeMenu={adminMenu} setActiveMenu={setAdminMenu}>
                {adminMenu === 'dashboard' && <AdminDashboard />}
                {adminMenu === 'reports' && <AdminReports />}
                {adminMenu === 'menu' && <AdminMenu />}
                {adminMenu === 'tables' && <AdminTables />}
                {adminMenu === 'transactions' && <AdminTransactions />}
                {adminMenu === 'cancel-logs' && <AdminCancelLogs />}
                {adminMenu === 'stock-logs' && <AdminStockLogs />}
                {adminMenu === 'settings' && <AdminSettings />}
                {adminMenu === 'users' && <AdminUsers />}
              </AdminLayout>
            )}
          </div>
        )}
      </div>

      {/* Global PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onNavigateToPos={() => {
          setIsPwaModalOpen(false);
          navigateTo('pos');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

