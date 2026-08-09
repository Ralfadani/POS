import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatRupiah } from '../../utils/formatters.js';
import {
  TrendingUp,
  Receipt,
  Users,
  UtensilsCrossed,
  DollarSign,
  ArrowUpRight,
  Clock,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard-summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-[#1A3A5C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Memuat ringkasan data...</p>
      </div>
    );
  }

  const COLORS = ['#1A3A5C', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

  const paymentData = [
    { name: 'Tunai', value: summary.paymentBreakdown?.tunai || 0 },
    { name: 'QRIS', value: summary.paymentBreakdown?.QRIS || 0 },
    { name: 'EDC', value: summary.paymentBreakdown?.EDC || 0 }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1A3A5C]/10 text-[#1A3A5C] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">Omzet Hari Ini</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 truncate">{formatRupiah(summary.todayRevenue || 0)}</h3>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> Kasir Berhasil
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">Transaksi Selesai</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 truncate">{summary.todayTransactionsCount || 0} Struk</h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Rata-rata {formatRupiah(summary.averageCheck || 0)}/struk</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">Sesi Meja Aktif</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 truncate">{summary.activeSessionsCount || 0} Meja</h3>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5 block truncate">Sedang Berjalan</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">Total Menu Aktif</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 truncate">{summary.totalMenuItems || 0} Menu</h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">{summary.outOfStockItems || 0} Menu Habis</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Hourly Rush & Trend Chart (8 cols) */}
        <Card className="lg:col-span-8 p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Penjualan 7 Hari Terakhir</h3>
              <p className="text-[11px] text-slate-500">Pertumbuhan pendapatan harian cafe</p>
            </div>
            <Badge variant="navy" size="sm">Mingguan</Badge>
          </div>

          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.sevenDaysTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A3A5C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1A3A5C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={val => `Rp ${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(val), 'Pendapatan']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A3A5C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Methods Breakdown Pie (4 cols) */}
        <Card className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Metode Pembayaran</h3>
            <p className="text-[11px] text-slate-500">Sebaran transaksi berdasarkan cara bayar</p>
          </div>

          <div className="h-44 sm:h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [formatRupiah(val), 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {paymentData.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  {p.name}:
                </span>
                <span className="font-bold text-slate-800">{formatRupiah(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top 5 Best Selling Items Table */}
      <Card className="p-4 sm:p-5">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Menu Terlaris (Top Selling Items)</h3>
            <p className="text-[11px] text-slate-500">Menu dengan volume penjualan tertinggi</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Nama Menu</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Kategori</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">Terjual</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary.topSellingItems || []).map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[180px] sm:max-w-xs">{item.name}</span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500">{item.category}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-semibold text-[#1A3A5C]">{item.totalQuantity} porsi</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-bold text-slate-900">{formatRupiah(item.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
