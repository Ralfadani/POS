import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';
import { UtensilsCrossed, LogOut, Shield, PackageOpen, Bell, RefreshCw, Volume2, VolumeX, Grid, ReceiptText } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters.js';

interface POSLayoutProps {
  children: React.ReactNode;
  activeTab: 'tables' | 'stock' | 'transactions';
  setActiveTab: (tab: 'tables' | 'stock' | 'transactions') => void;
  newOrderAlertCount?: number;
  onClearOrderAlerts?: () => void;
}

export const POSLayout: React.FC<POSLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  newOrderAlertCount = 0,
  onClearOrderAlerts
}) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full bg-[#f1f5f9] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-[#1A3A5C] text-white px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-md shrink-0 z-30">
        <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-base sm:text-lg text-white shadow-xs">
              ☕
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight leading-tight flex items-center gap-1.5">
                <span className="truncate max-w-[150px] sm:max-w-[220px]">{cafeName}</span> <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-bold uppercase shrink-0">POS</span>
              </div>
              <p className="text-[10px] text-slate-300 hidden sm:block">Kasir & Sesi Meja</p>
            </div>
          </div>

          {/* Navigation tabs on POS bar */}
          <div className="flex items-center space-x-1 bg-black/25 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('tables');
                if (onClearOrderAlerts) onClearOrderAlerts();
              }}
              className={`relative px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tables' ? 'bg-white text-[#1A3A5C] shadow-xs' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Meja & Sesi</span>
              {newOrderAlertCount > 0 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full text-[9px] sm:text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                  {newOrderAlertCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'transactions' ? 'bg-white text-[#1A3A5C] shadow-xs' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Riwayat Transaksi</span>
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'stock' ? 'bg-white text-[#1A3A5C] shadow-xs' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <PackageOpen className="w-3.5 h-3.5" />
              <span>Kelola Stok</span>
            </button>
          </div>
        </div>

        {/* Right side status and cashier info */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Suara notifikasi aktif' : 'Suara notifikasi nonaktif'}
            className="p-1.5 text-slate-300 hover:text-white bg-white/10 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-300" />}
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              <span>{user?.name || 'Kasir'}</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">{formatDateTime(currentTime)}</div>
          </div>

          {user?.role === 'admin' && (
            <a
              href="/admin"
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-2.5 py-1 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-hidden flex flex-col min-h-0">{children}</main>
    </div>
  );
};
