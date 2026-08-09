import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatRupiah, formatDateTime } from '../../utils/formatters.js';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Filter,
  CreditCard
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = `?period=${period}`;
      if (startDate && endDate) {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(`/api/admin/reports${query}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.report);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.transactions || reportData.transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor');
      return;
    }

    const headers = ['ID Transaksi', 'Waktu Pembayaran', 'Meja', 'Kasir', 'Metode Bayar', 'Subtotal', 'Service Charge', 'Pajak PB1', 'Total Pembayaran'];
    const rows = reportData.transactions.map((t: any) => [
      `TRX-${t.payment_id}`,
      `"${formatDateTime(t.payment_time)}"`,
      `"${t.table_number || ''}"`,
      `"${t.cashier_name || ''}"`,
      t.payment_method,
      t.subtotal,
      t.service_charge,
      t.tax,
      t.total
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Cafe_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls & Filter Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-2xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <button
            onClick={() => { setPeriod('today'); setStartDate(''); setEndDate(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              period === 'today' ? 'bg-[#1A3A5C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => { setPeriod('7days'); setStartDate(''); setEndDate(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              period === '7days' ? 'bg-[#1A3A5C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => { setPeriod('30days'); setStartDate(''); setEndDate(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              period === '30days' ? 'bg-[#1A3A5C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            30 Hari Terakhir
          </button>
          <button
            onClick={() => { setPeriod('all'); setStartDate(''); setEndDate(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              period === 'all' ? 'bg-[#1A3A5C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Data
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-slate-700 hover:text-[#1A3A5C] text-xs font-semibold"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {loading || !reportData ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-[#1A3A5C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Memuat laporan penjualan...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Penjualan Kotor</span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{formatRupiah(reportData.totalRevenue || 0)}</h3>
              <p className="text-[10px] text-slate-500">{reportData.totalTransactions || 0} Total Transaksi</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penjualan Bersih (Net)</span>
              <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700">{formatRupiah(reportData.totalSubtotal || 0)}</h3>
              <p className="text-[10px] text-slate-500">Sebelum Pajak & Service Charge</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pajak PB1 Terkumpul</span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{formatRupiah(reportData.totalTax || 0)}</h3>
              <p className="text-[10px] text-slate-500">Pajak Resto Cafe</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Service Charge Terkumpul</span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{formatRupiah(reportData.totalServiceCharge || 0)}</h3>
              <p className="text-[10px] text-slate-500">Biaya Layanan Meja</p>
            </Card>
          </div>

          {/* Payment & Channel Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Rincian Metode Pembayaran</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">Tunai (Cash):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(reportData.paymentBreakdown?.tunai || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">QRIS Dinamis:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(reportData.paymentBreakdown?.QRIS || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">Kartu EDC / Debit:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(reportData.paymentBreakdown?.EDC || 0)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Rata-rata & Saluran Order</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">Rata-rata Nilai Transaksi:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(reportData.totalTransactions ? Math.round(reportData.totalRevenue / reportData.totalTransactions) : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">Total Item Terjual:</span>
                  <span className="font-bold text-[#1A3A5C]">{reportData.totalItemsSold || 0} Porsi</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-700">Status Laporan:</span>
                  <span className="font-bold text-emerald-700">Lengkap & Terverifikasi</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="p-4 sm:p-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 sm:mb-4">
              Daftar Transaksi Selesai ({reportData.transactions?.length || 0})
            </h4>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Meja</th>
                    <th className="py-2.5 px-3">Kasir</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Pajak + Service</th>
                    <th className="py-2.5 px-3 text-right">Total Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada transaksi pada rentang periode ini
                      </td>
                    </tr>
                  ) : (
                    reportData.transactions?.map((trx: any) => (
                      <tr key={trx.payment_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          TRX-{trx.payment_id}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {formatDateTime(trx.payment_time)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#1A3A5C]">
                          {trx.table_number || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{trx.cashier_name || 'Kasir'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold uppercase text-[10px] px-2 py-0.5 bg-slate-100 rounded">
                            {trx.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                          {formatRupiah(trx.subtotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {formatRupiah((trx.tax || 0) + (trx.service_charge || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(trx.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
