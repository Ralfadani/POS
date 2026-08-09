import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatRupiah, formatDateTime } from '../../utils/formatters.js';
import { printThermalReceipt } from '../../utils/thermalPrinter.js';
import { Search, Printer, Eye, ReceiptText } from 'lucide-react';

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [trxDetail, setTrxDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleViewDetail = async (trx: any) => {
    setSelectedTrx(trx);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions/${trx.payment_id}`);
      const data = await res.json();
      if (data.success) {
        setTrxDetail(data.transaction);
      }
    } catch (err) {
      console.error('Error fetching transaction detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReprintReceipt = () => {
    if (!trxDetail) return;

    const items: any[] = [];
    (trxDetail.orders || []).forEach((ord: any) => {
      ord.items.forEach((it: any) => {
        items.push({
          name: it.item_name,
          quantity: it.quantity,
          price: it.item_price,
          subtotal: it.subtotal,
          notes: it.notes
        });
      });
    });

    printThermalReceipt({
      type: 'customer_invoice',
      tableNumber: trxDetail.table_number || '',
      sessionId: trxDetail.session_id,
      cashierName: trxDetail.cashier_name || 'Kasir',
      items,
      calculation: {
        subtotal: trxDetail.subtotal,
        service_charge: trxDetail.service_charge,
        tax: trxDetail.tax,
        total: trxDetail.total,
        is_service_active: trxDetail.service_charge > 0,
        service_charge_rate: 5,
        is_tax_active: trxDetail.tax > 0,
        tax_rate: 10
      },
      payment: trxDetail
    });
  };

  const filteredTrx = transactions.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.payment_id.toString().includes(term) ||
      (t.table_number && t.table_number.toLowerCase().includes(term)) ||
      (t.cashier_name && t.cashier_name.toLowerCase().includes(term)) ||
      t.payment_method.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. struk, meja, kasir..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
          />
        </div>

        <div className="text-xs text-slate-500">
          Total Transaksi: <strong>{transactions.length}</strong>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Struk</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">Meja</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTrx.map(trx => (
                  <tr key={trx.payment_id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      TRX-{trx.payment_id}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(trx.payment_time)}</td>
                    <td className="py-3 px-4 font-bold text-[#1A3A5C]">{trx.table_number || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{trx.cashier_name || 'Kasir'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="navy" size="sm">
                        {trx.payment_method}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetail(trx)}
                        className="px-2.5 py-1 text-slate-700 hover:text-[#1A3A5C] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-xs shadow-2xs"
                        title="Lihat Detail & Cetak Struk"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <Modal
          isOpen={!!selectedTrx}
          onClose={() => setSelectedTrx(null)}
          title={`Detail Transaksi TRX-${selectedTrx.payment_id}`}
          subtitle={`Meja ${selectedTrx.table_number || '-'} • Kasir: ${selectedTrx.cashier_name || 'Kasir'}`}
          maxWidth="md"
        >
          {detailLoading || !trxDetail ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memuat detail transaksi...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Pembayaran:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(trxDetail.payment_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-bold text-slate-900 uppercase">{trxDetail.payment_method}</span>
                </div>
                {trxDetail.payment_method === 'tunai' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Uang Diterima:</span>
                      <span>{formatRupiah(trxDetail.nominal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(trxDetail.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 text-xs divide-y divide-slate-100">
                <h5 className="font-bold text-slate-800 pb-1 uppercase tracking-wider text-[10px]">Item Pesanan</h5>
                {(trxDetail.orders || []).flatMap((o: any) => o.items).map((item: any, i: number) => (
                  <div key={i} className="pt-2 flex justify-between">
                    <div>
                      <span className="font-bold text-[#1A3A5C] mr-1">{item.quantity}x</span>
                      <span>{item.item_name}</span>
                    </div>
                    <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(trxDetail.subtotal)}</span>
                </div>
                {trxDetail.service_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>{formatRupiah(trxDetail.service_charge)}</span>
                  </div>
                )}
                {trxDetail.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak PB1:</span>
                    <span>{formatRupiah(trxDetail.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-[#1A3A5C] pt-1 border-t border-slate-200">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(trxDetail.total)}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleReprintReceipt}
                  className="flex items-center justify-center gap-1.5 text-xs"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Ulang Struk</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setSelectedTrx(null)}
                  className="text-xs font-bold"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
