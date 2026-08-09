import React, { useState, useEffect } from 'react';
import { OrderCancelLog } from '../../types/index.js';
import { formatRupiah, formatDateTime, formatTime } from '../../utils/formatters.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  ShoppingBag,
  AlertTriangle,
  Tablet,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const AdminCancelLogs: React.FC = () => {
  const [logs, setLogs] = useState<OrderCancelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchCancelLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/order-cancel-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching cancel logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'all' && log.reason_category !== selectedCategory) {
      return false;
    }
    if (selectedChannel !== 'all' && log.channel !== selectedChannel) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTable = log.table_number?.toLowerCase().includes(q);
      const matchCashier = log.cancelled_by_name?.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      const matchItems = log.items_summary?.toLowerCase().includes(q);
      const matchOrderId = `#ORD-${log.order_id}`.toLowerCase().includes(q) || String(log.order_id).includes(q);
      return matchTable || matchCashier || matchReason || matchItems || matchOrderId;
    }
    return true;
  });

  const totalCancelledAmount = filteredLogs.reduce((sum, l) => sum + (Number(l.total_amount) || 0), 0);
  const allCategories = Array.from(new Set(logs.map(l => l.reason_category).filter(Boolean)));

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Log ID',
      'Order ID',
      'Tanggal & Waktu Batal',
      'Meja',
      'Channel',
      'Petugas Kasir',
      'Kategori Alasan',
      'Detail Alasan',
      'Item Pesanan',
      'Total Nominal (Rp)'
    ];

    const rows = filteredLogs.map(l => [
      l.log_id,
      `ORD-${l.order_id}`,
      `"${formatDateTime(l.cancelled_at)}"`,
      `"${l.table_number || '-'}"`,
      l.channel === 'self_order' ? 'Self Order HP' : 'Kasir POS',
      `"${l.cancelled_by_name || '-'}"`,
      `"${l.reason_category || '-'}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.items_summary || '').replace(/"/g, '""')}"`,
      l.total_amount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_pembatalan_pesanan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#f8fafc]">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              Log Audit Pembatalan Pesanan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat lengkap verifikasi pembatalan order oleh kasir untuk audit & transparansi Owner
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCancelLogs}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#1A3A5C] hover:bg-[#152e4a]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Pesanan Dibatalkan</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{filteredLogs.length} Order</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Nilai Pembatalan</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">{formatRupiah(totalCancelledAmount)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Kategori Alasan Terbanyak</p>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5 truncate">
              {allCategories[0] || 'Tidak ada pembatalan'}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nomor meja, nama kasir, order ID, atau isi alasan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
            >
              <option value="all">Semua Kategori Alasan ({logs.length})</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
            >
              <option value="all">Semua Sumber Order</option>
              <option value="self_order">Self Order HP</option>
              <option value="pos_manual">Kasir POS</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Logs List & Audit Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Audit Log ({filteredLogs.length} Catatan)
          </h2>
          <span className="text-xs text-slate-500">
            Urut terbaru lebih dulu
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-[#1A3A5C]" />
            <p>Memuat catatan audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 stroke-[1.5]" />
            <p className="font-semibold text-slate-700">Tidak ada pembatalan order yang cocok</p>
            <p className="text-slate-400 text-[11px]">Semua pesanan berjalan lancar atau tidak ditemukan data sesuai filter pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.log_id;

              return (
                <div key={log.log_id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Main info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                          #ORD-{log.order_id}
                        </span>

                        <span className="font-bold text-xs text-slate-900">
                          {log.table_number || 'Meja Umum'}
                        </span>

                        {log.channel === 'self_order' ? (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-sky-600" /> Self Order HP
                          </span>
                        ) : (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Tablet className="w-3 h-3 text-purple-600" /> POS Kasir
                          </span>
                        )}

                        <Badge variant="danger" size="sm">
                          {log.reason_category || 'Dibatalkan'}
                        </Badge>
                      </div>

                      {/* Explicit Reason Details */}
                      <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl mt-2 space-y-1">
                        <div className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alasan Pembatalan:</span>
                        </div>
                        <p className="text-xs text-rose-950 font-medium leading-relaxed pl-5">
                          "{log.reason}"
                        </p>
                      </div>

                      {/* Items Summary & Cashier info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Kasir yang Membatalkan: <strong>{log.cancelled_by_name || 'Kasir'}</strong>
                        </span>

                        <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(log.cancelled_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Nominal & Expand Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Nominal Dibatalkan:</span>
                        <span className="text-sm sm:text-base font-extrabold text-rose-600">
                          {formatRupiah(log.total_amount)}
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.log_id)}
                        className="text-xs font-semibold text-[#1A3A5C] hover:underline flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <span>{isExpanded ? 'Tutup Rincian' : 'Rincian Menu'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Item Breakdown */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200 bg-white rounded-xl p-3.5 border space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        Daftar Menu yang Batal Diproduksi:
                      </h4>

                      {log.items && log.items.length > 0 ? (
                        <div className="space-y-1.5 divide-y divide-slate-100 text-xs">
                          {log.items.map((it, i) => (
                            <div key={i} className="pt-1.5 first:pt-0 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-900">{it.quantity}x</span>{' '}
                                <span className="font-medium text-slate-800">{it.item_name}</span>
                                {it.notes && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-2">
                                    Catatan: {it.notes}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-700 font-semibold">
                                {formatRupiah(it.subtotal || (it.unit_price * it.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">
                          {log.items_summary || 'Tidak ada rincian item'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
