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

