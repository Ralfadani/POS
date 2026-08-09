import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatRupiah, formatDateTime, formatTime } from '../../utils/formatters.js';
import { printThermalReceipt } from '../../utils/thermalPrinter.js';
import { 
  Search, 
  Printer, 
  Eye, 
  ReceiptText, 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Filter,
  DollarSign
} from 'lucide-react';

export const POSTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'tunai' | 'qris' | 'kartu'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'all'>('today');
  
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [trxDetail, setTrxDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTransactions = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      
      const res = await fetch('/api/pos/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions in POS:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Auto-refresh interval every 15 seconds to catch newly closed tables
    const interval = setInterval(() => {
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetail = async (trx: any) => {
    setSelectedTrx(trx);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/pos/transactions/${trx.payment_id}`);
      const data = await res.json();
      if (data.success && data.transaction) {
        setTrxDetail(data.transaction);
      } else {
        setTrxDetail(trx);
      }
    } catch (err) {
      console.error('Error fetching transaction detail in POS:', err);
      setTrxDetail(trx);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReprintReceipt = (detailToPrint?: any) => {
    const trx = detailToPrint || trxDetail || selectedTrx;
    if (!trx) return;

    const items: any[] = [];
    if (trx.orders && Array.isArray(trx.orders)) {
      trx.orders.forEach((ord: any) => {
        (ord.items || []).forEach((it: any) => {
          items.push({
            name: it.item_name || 'Item',
            quantity: it.quantity || 1,
            price: it.item_price || 0,
            subtotal: it.subtotal || ((it.item_price || 0) * (it.quantity || 1)),
            notes: it.notes || ''
          });
        });
      });
    }

    printThermalReceipt({
      type: 'customer_invoice',
      tableNumber: trx.table_number || `Meja #${trx.table_id || ''}`,
      sessionId: trx.session_id,
      cashierName: trx.cashier_name || 'Kasir',
      items: items.length > 0 ? items : [
        {
          name: `Total Tagihan Transaksi TRX-${trx.payment_id}`,
          quantity: 1,
          price: trx.total,
          subtotal: trx.total
        }
      ],
      calculation: {
        subtotal: trx.subtotal || trx.total,
        service_charge: trx.service_charge || 0,
        tax: trx.tax || 0,
        total: trx.total,
        is_service_active: (trx.service_charge || 0) > 0,
        service_charge_rate: 5,
        is_tax_active: (trx.tax || 0) > 0,
        tax_rate: 10
      },
      payment: trx
    });
  };

  // Filter transactions
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredTransactions = transactions.filter(t => {
    // Search match
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      t.payment_id.toString().includes(term) ||
      (t.table_number && t.table_number.toLowerCase().includes(term)) ||
      (t.cashier_name && t.cashier_name.toLowerCase().includes(term)) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    // Method match
    if (methodFilter !== 'all') {
      if (methodFilter === 'tunai' && t.payment_method !== 'tunai') return false;
      if (methodFilter === 'qris' && t.payment_method !== 'qris') return false;
      if (methodFilter === 'kartu' && t.payment_method !== 'kartu_debit' && t.payment_method !== 'kartu_kredit' && t.payment_method !== 'kartu') return false;
    }

    // Date match
    if (dateFilter === 'today') {
      const pDate = new Date(t.payment_time).toISOString().split('T')[0];
      if (pDate !== todayStr) return false;
    } else if (dateFilter === '7days') {
      const pTime = new Date(t.payment_time).getTime();
      if (pTime < sevenDaysAgo.getTime()) return false;
    }

    return true;
  });

  // Calculate stats for current filter
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  const totalCount = filteredTransactions.length;
  const cashTotal = filteredTransactions.filter(t => t.payment_method === 'tunai').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  const qrisTotal = filteredTransactions.filter(t => t.payment_method === 'qris').reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  const cardTotal = filteredTransactions.filter(t => t.payment_method.includes('kartu')).reduce((sum, t) => sum + (Number(t.total) || 0), 0);

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 overflow-y-auto shadow-xs flex flex-col space-y-4 sm:space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-[#1A3A5C]" />
              Riwayat Transaksi Kasir
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1A3A5C]/10 text-[#1A3A5C]">
              {totalCount} Transaksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh pembayaran & struk selesai dari meja kasir
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing || loading}
            className="text-xs h-8.5 px-3 flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#1A3A5C]' : 'text-slate-400'}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span>Total Omset</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              {formatRupiah(totalRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {dateFilter === 'today' ? 'Hari ini' : dateFilter === '7days' ? '7 Hari Terakhir' : 'Semua Periode'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span>Tunai (Cash)</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-lg font-extrabold text-emerald-700 leading-tight">
              {formatRupiah(cashTotal)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {filteredTransactions.filter(t => t.payment_method === 'tunai').length} transaksi
            </div>
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span>QRIS / E-Wallet</span>
            <QrCode className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-lg font-extrabold text-blue-700 leading-tight">
              {formatRupiah(qrisTotal)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {filteredTransactions.filter(t => t.payment_method === 'qris').length} transaksi
            </div>
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span>Kartu EDC / Debit</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-lg font-extrabold text-amber-700 leading-tight">
              {formatRupiah(cardTotal)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {filteredTransactions.filter(t => t.payment_method.includes('kartu')).length} transaksi
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. struk (TRX-X), meja, kasir, atau metode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1A3A5C] text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter Buttons */}
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setMethodFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                methodFilter === 'all' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setMethodFilter('tunai')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                methodFilter === 'tunai' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tunai
            </button>
            <button
              onClick={() => setMethodFilter('qris')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                methodFilter === 'qris' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QRIS
            </button>
            <button
              onClick={() => setMethodFilter('kartu')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                methodFilter === 'kartu' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EDC
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                dateFilter === 'today' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                dateFilter === '7days' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                dateFilter === 'all' ? 'bg-[#1A3A5C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-1">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#1A3A5C] mb-2" />
            <p className="text-xs font-semibold text-slate-600">Memuat riwayat transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-slate-50/50">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || methodFilter !== 'all' || dateFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau filter tanggal'
                : 'Transaksi yang telah diselesaikan dan dibayar kasir akan otomatis tercatat di sini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">No. Struk</th>
                  <th className="py-3 px-3.5">Waktu Transaksi</th>
                  <th className="py-3 px-3.5">Meja</th>
                  <th className="py-3 px-3.5">Kasir</th>
                  <th className="py-3 px-3.5">Metode Bayar</th>
                  <th className="py-3 px-3.5 text-right">Total Tagihan</th>
                  <th className="py-3 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.map(trx => {
                  const method = trx.payment_method || 'tunai';
                  const isCash = method === 'tunai';
                  const isQris = method === 'qris';
                  const isCard = method.includes('kartu');

                  return (
                    <tr key={trx.payment_id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#1A3A5C]">TRX-{trx.payment_id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{formatDateTime(trx.payment_time)}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-[#1A3A5C] bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {trx.table_number || `Meja #${trx.table_id || '-'}`}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {trx.cashier_name || 'Kasir'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            isCash
                              ? 'bg-emerald-100 text-emerald-800'
                              : isQris
                              ? 'bg-blue-100 text-blue-800'
                              : isCard
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {isCash && <Banknote className="w-3 h-3" />}
                          {isQris && <QrCode className="w-3 h-3" />}
                          {isCard && <CreditCard className="w-3 h-3" />}
                          {trx.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-extrabold text-slate-900 text-sm">
                        {formatRupiah(trx.total)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(trx)}
                            className="text-[11px] py-1 px-2 text-[#1A3A5C] border-slate-200 hover:bg-slate-100 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Detail
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReprintReceipt(trx)}
                            className="text-[11px] py-1 px-2 font-semibold flex items-center"
                            title="Cetak Ulang Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Cetak
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <Modal
          isOpen={!!selectedTrx}
          onClose={() => {
            setSelectedTrx(null);
            setTrxDetail(null);
          }}
          title={`Detail Transaksi #TRX-${selectedTrx.payment_id}`}
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-500 font-medium">Nomor Struk</div>
                <div className="text-sm font-extrabold text-[#1A3A5C] font-mono">
                  TRX-{selectedTrx.payment_id}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Meja & Kasir</div>
                <div className="text-xs font-bold text-slate-900">
                  {selectedTrx.table_number || `Meja #${selectedTrx.table_id}`} • {selectedTrx.cashier_name || 'Kasir'}
                </div>
              </div>
            </div>

            {/* Orders Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Rincian Pesanan Menu
              </h4>

              {detailLoading ? (
                <div className="py-6 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1A3A5C] mb-1" />
                  <p className="text-xs">Memuat item menu...</p>
                </div>
              ) : trxDetail && trxDetail.orders && trxDetail.orders.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Menu</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Harga</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trxDetail.orders.map((ord: any) =>
                        (ord.items || []).map((it: any, idx: number) => (
                          <tr key={`${ord.order_id}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{it.item_name}</div>
                              {it.notes && (
                                <div className="text-[10px] text-amber-700 italic">Catatan: {it.notes}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-700">{it.quantity}x</td>
                            <td className="p-2.5 text-right text-slate-600">{formatRupiah(it.item_price)}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(it.subtotal || it.item_price * it.quantity)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                  Total tagihan tercatat untuk sesi meja ini
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Pesanan:</span>
                <span className="font-medium text-slate-900">
                  {formatRupiah(selectedTrx.subtotal || selectedTrx.total)}
                </span>
              </div>
              {(selectedTrx.service_charge || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge (5%):</span>
                  <span className="font-medium text-slate-900">
                    {formatRupiah(selectedTrx.service_charge)}
                  </span>
                </div>
              )}
              {(selectedTrx.tax || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>PB1 Restoran (10%):</span>
                  <span className="font-medium text-slate-900">
                    {formatRupiah(selectedTrx.tax)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-extrabold text-slate-900">TOTAL BAYAR:</span>
                <span className="text-base font-extrabold text-[#1A3A5C]">
                  {formatRupiah(selectedTrx.total)}
                </span>
              </div>

              {/* Payment Details */}
              <div className="pt-2 border-t border-dashed border-slate-200 mt-2 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {selectedTrx.payment_method}
                  </span>
                </div>
                {selectedTrx.payment_method === 'tunai' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Diterima:</span>
                      <span className="font-medium text-slate-900">{formatRupiah(selectedTrx.nominal || selectedTrx.total)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Kembalian:</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(selectedTrx.change || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-slate-600 pt-1 text-[11px]">
                  <span>Waktu Pembayaran:</span>
                  <span>{formatDateTime(selectedTrx.payment_time)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTrx(null);
                  setTrxDetail(null);
                }}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReprintReceipt(trxDetail || selectedTrx)}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
