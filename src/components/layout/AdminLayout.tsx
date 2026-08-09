import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  TrendingUp,
  UtensilsCrossed,
  Grid,
  ReceiptText,
  Sliders,
  Users,
  History,
  LogOut,
  Tablet,
  Menu,
  X,
  Store,
  ChevronRight,
  Shield,
  ShieldAlert
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeMenu,
  setActiveMenu
}) => {
  const { user, logout } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [cafeName, setCafeName] = useState('BREW & BYTE');

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Ringkasan', icon: LayoutDashboard },
    { id: 'reports', label: 'Laporan Penjualan', icon: TrendingUp },
    { id: 'menu', label: 'Manajemen Menu', icon: UtensilsCrossed },
    { id: 'tables', label: 'Pantau Meja & Sesi', icon: Grid },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: ReceiptText },
    { id: 'cancel-logs', label: 'Audit Batal Order', icon: ShieldAlert },
    { id: 'stock-logs', label: 'Log Perubahan Stok', icon: History },
    { id: 'settings', label: 'Pengaturan & Identitas Cafe', icon: Sliders },
    { id: 'users', label: 'Kelola Akun Kasir', icon: Users }
  ];

  const handleSelectMenu = (id: string) => {
    setActiveMenu(id);
    setIsMobileDrawerOpen(false);
  };

  const currentMenuObj = menuItems.find(m => m.id === activeMenu) || menuItems[0];
  const CurrentIcon = currentMenuObj.icon;

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc] font-sans overflow-hidden">
      {/* 1. Mobile Backdrop for Drawer */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* 2. Sidebar Navigation (Desktop Static, Mobile Slide-over Drawer) */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-72 sm:w-64 bg-[#1A3A5C] text-white flex flex-col shrink-0 h-full
          transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xl text-white shadow-xs">
              ☕
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-base leading-tight truncate max-w-[150px]">{cafeName}</div>
              <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-amber-400" />
                Admin & Owner Portal
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 md:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Menu Operasional
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectMenu(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#1A3A5C] font-bold shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A3A5C]' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#1A3A5C]" />}
              </button>
            );
          })}
        </nav>

        {/* Quick Link to POS & Cashier Profile Footer */}
        <div className="p-4 border-t border-white/10 space-y-3 shrink-0 bg-black/15">
          <a
            href="/pos"
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Tablet className="w-4 h-4" />
            <span>Buka Layar POS Kasir</span>
          </a>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-white/10">
            <div className="min-w-0 pr-2">
              <div className="font-bold text-white leading-tight truncate">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user?.role || 'Admin'}</div>
            </div>
            <button
              onClick={logout}
              title="Keluar / Logout"
              className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
              title="Buka Menu Admin"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-2">
                <CurrentIcon className="w-4 h-4 text-[#1A3A5C] hidden sm:inline" />
                {currentMenuObj.label}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Kelola operasional dan pantau transaksi cafe secara real-time
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-mono text-[11px]">Database Online</span>
            </div>

            <a
              href="/pos"
              className="md:hidden px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>POS</span>
            </a>
          </div>
        </header>

        {/* Content Scrollable Body */}
        <div className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto">{children}</div>

        {/* 4. Mobile Bottom Sticky Navigation (Quick access to key admin sections) */}
        <div className="md:hidden bg-white border-t border-slate-200 py-1.5 px-2 flex justify-around items-center shrink-0 z-30 shadow-md">
          <button
            onClick={() => handleSelectMenu('dashboard')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
              activeMenu === 'dashboard' ? 'text-[#1A3A5C] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Ringkasan</span>
          </button>

          <button
            onClick={() => handleSelectMenu('menu')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
              activeMenu === 'menu' ? 'text-[#1A3A5C] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 mb-0.5" />
            <span>Menu</span>
          </button>

          <button
            onClick={() => handleSelectMenu('tables')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
              activeMenu === 'tables' ? 'text-[#1A3A5C] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="w-4 h-4 mb-0.5" />
            <span>Meja</span>
          </button>

          <button
            onClick={() => handleSelectMenu('transactions')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
              activeMenu === 'transactions' ? 'text-[#1A3A5C] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ReceiptText className="w-4 h-4 mb-0.5" />
            <span>Transaksi</span>
          </button>

          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>Lainnya</span>
          </button>
        </div>
      </main>
    </div>
  );
};
