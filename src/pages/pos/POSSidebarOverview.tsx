import React from 'react';
import { Table, Session } from '../../types/index.js';

interface POSSidebarOverviewProps {
  tables: Table[];
  sessions: Session[];
  onSelectTable: (tableId: number) => void;
  onOpenManualOrder?: (tableId?: number) => void;
}

export const POSSidebarOverview: React.FC<POSSidebarOverviewProps> = () => {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-lg lg:shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">Panel Sesi & Kasir</h3>
          <p className="text-[11px] text-slate-500">Kelola sesi dan tagihan meja</p>
        </div>
      </div>

      {/* Clean Minimalist Empty Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="max-w-xs space-y-2">
          <h4 className="text-base font-bold text-slate-800">Pilih Meja</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Silakan pilih salah satu meja pada daftar di sebelah kiri untuk melihat rincian sesi, mengelola pesanan, atau membuka sesi meja.
          </p>
        </div>
      </div>
    </div>
  );
};
