import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { formatRupiah } from '../../utils/formatters.js';
import { CalculationBreakdown } from '../../types/index.js';
import { printThermalReceipt } from '../../utils/thermalPrinter.js';
import { CreditCard, QrCode, Banknote, CheckCircle, Printer } from 'lucide-react';

interface POSCloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  sessionId: string;
  calculation: CalculationBreakdown | null;
  orders: any[];
  onSuccessClose: (paymentData: any) => Promise<any>;
}

export const POSCloseSessionModal: React.FC<POSCloseSessionModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  sessionId,
  calculation,
  orders,
  onSuccessClose
}) => {
  const [method, setMethod] = useState<'tunai' | 'QRIS' | 'EDC'>('tunai');
  const [nominal, setNominal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  const total = calculation?.total || 0;

  useEffect(() => {
    if (calculation) {
      setNominal(calculation.total);
      setError('');
      setCompletedPayment(null);
    }
  }, [calculation, isOpen]);

  const kembalian = method === 'tunai' ? Math.max(0, nominal - total) : 0;
  const isCashInsufficient = method === 'tunai' && nominal < total;

  const quickAmounts = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 150.000', value: 150000 },
    { label: 'Rp 200.000', value: 200000 }
  ].filter(q => q.value >= total || q.label === 'Uang Pas');

  const printReceiptForCustomer = (paymentData: any) => {
    if (!calculation) return;

    // Collect all active order items
    const allItems: any[] = [];
    orders.forEach(ord => {
      if (ord.status !== 'dibatalkan') {
        ord.items?.forEach((it: any) => {
          allItems.push({
            name: it.item_name || 'Menu',
            quantity: it.quantity,
            price: it.item_price,
            subtotal: it.subtotal,
            notes: it.notes
          });
        });
      }
    });

    printThermalReceipt({
      type: 'customer_invoice',
      tableNumber,
      sessionId,
      cashierName: paymentData?.cashier_name || 'Kasir',
      items: allItems,
      calculation,
      payment: paymentData
    });
  };

  const handleProcessPayment = async () => {
    if (isCashInsufficient) {
      setError('Nominal pembayaran tunai kurang dari total tagihan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await onSuccessClose({
        payment_method: method,
        nominal: method === 'tunai' ? nominal : total
      });

      const paymentInfo = res?.payment || {
        payment_method: method,
        nominal: method === 'tunai' ? nominal : total,
        total: total,
        change: kembalian,
        cashier_name: 'Kasir'
      };

      setCompletedPayment(paymentInfo);

      // Integrasi cetak struk pesanan customer saat konfirmasi pembayaran
      if (autoPrintReceipt && total > 0) {
        printReceiptForCustomer(paymentInfo);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCustomerReceipt = () => {
    if (!completedPayment || !calculation) return;
    printReceiptForCustomer(completedPayment);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pembayaran & Tutup Sesi - ${tableNumber}`}
      subtitle="Pilih metode pembayaran dan cetak bukti transaksi kasir"
      maxWidth="lg"
    >
      {completedPayment ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Pembayaran Berhasil!</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesi {tableNumber} telah ditutup dan meja kini kembali berstatus Kosong.
            </p>
            {autoPrintReceipt && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                <Printer className="w-3.5 h-3.5" />
                <span>Struk pesanan customer telah dicetak otomatis</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Tagihan:</span>
              <span className="font-bold text-slate-900">{formatRupiah(completedPayment.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode Bayar:</span>
              <span className="font-semibold text-slate-900 uppercase">{completedPayment.payment_method}</span>
            </div>
            {completedPayment.payment_method === 'tunai' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Diterima:</span>
                  <span>{formatRupiah(completedPayment.nominal)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(completedPayment.change)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handlePrintCustomerReceipt}
              className="flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak Struk Transaksi
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Selesai (Kembali ke Meja)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Bill Summary Breakdown */}
          {calculation && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Pesanan:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(calculation.subtotal)}</span>
              </div>
              {calculation.is_service_active && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge ({calculation.service_charge_rate}%):</span>
                  <span>{formatRupiah(calculation.service_charge)}</span>
                </div>
              )}
              {calculation.is_tax_active && (
                <div className="flex justify-between text-slate-600">
                  <span>PB1 / Pajak Resto ({calculation.tax_rate}%):</span>
                  <span>{formatRupiah(calculation.tax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-[#1A3A5C]">
                <span>TOTAL TAGIHAN:</span>
                <span className="text-lg font-black text-slate-900">{formatRupiah(calculation.total)}</span>
              </div>
            </div>
          )}

          {total === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
              <p className="text-xs font-bold text-amber-900">Total Tagihan Rp 0 (Semua Order Dibatalkan / Kosong)</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Tidak ada tagihan yang perlu dibayar. Anda dapat langsung menutup sesi untuk mengosongkan meja kembali.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleProcessPayment}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold py-3 text-sm rounded-xl shadow-xs"
                >
                  {loading ? 'Menutup Sesi...' : 'Tutup Sesi & Kosongkan Meja Sekarang'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('tunai');
                      setNominal(total);
                    }}
                    className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                      method === 'tunai'
                        ? 'border-[#1A3A5C] bg-[#1A3A5C]/10 text-[#1A3A5C] font-extrabold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-6 h-6 mb-1 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-bold">Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('QRIS');
                      setNominal(total);
                    }}
                    className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                      method === 'QRIS'
                        ? 'border-[#1A3A5C] bg-[#1A3A5C]/10 text-[#1A3A5C] font-extrabold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-6 h-6 mb-1 text-sky-600" />
                    <span className="text-xs sm:text-sm font-bold">QRIS Dinamis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('EDC');
                      setNominal(total);
                    }}
                    className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                      method === 'EDC'
                        ? 'border-[#1A3A5C] bg-[#1A3A5C]/10 text-[#1A3A5C] font-extrabold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mb-1 text-indigo-600" />
                    <span className="text-xs sm:text-sm font-bold">Kartu Debit/EDC</span>
                  </button>
                </div>
              </div>

              {/* Cash input & quick amount buttons */}
              {method === 'tunai' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Input
                    label="Nominal Uang Tunai Diterima (Rp)"
                    type="number"
                    value={nominal || ''}
                    onChange={e => setNominal(Number(e.target.value))}
                    placeholder="Masukkan jumlah uang tunai"
                    min={total}
                    className="text-base font-bold"
                  />

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {quickAmounts.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNominal(q.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                          nominal === q.value
                            ? 'bg-[#1A3A5C] text-white'
                            : 'bg-white border border-slate-300 hover:border-[#1A3A5C] text-slate-800'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Kembalian:</span>
                    <span className={`text-base sm:text-lg font-black ${isCashInsufficient ? 'text-red-600' : 'text-emerald-700'}`}>
                      {isCashInsufficient ? 'Uang Kurang' : formatRupiah(kembalian)}
                    </span>
                  </div>
                </div>
              )}

              {method === 'QRIS' && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-sky-900">QRIS Kasir Terverifikasi</p>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Pastikan pelanggan telah melakukan transfer QRIS sebesar <strong>{formatRupiah(total)}</strong> sebelum menyelesaikan transaksi.
                  </p>
                </div>
              )}

              {method === 'EDC' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-indigo-900">Transaksi Mesin EDC</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Gesek/tap kartu pada mesin EDC cafe dengan nominal <strong>{formatRupiah(total)}</strong>.
                  </p>
                </div>
              )}

          {/* Auto Print Struk Checkbox Toggle */}
          <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-all select-none">
            <input
              type="checkbox"
              checked={autoPrintReceipt}
              onChange={e => setAutoPrintReceipt(e.target.checked)}
              className="w-4 h-4 text-[#1A3A5C] accent-[#1A3A5C] rounded border-slate-300 focus:ring-[#1A3A5C]"
            />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Otomatis cetak struk pesanan & pembayaran untuk customer</span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-1">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
              disabled={loading}
              className="py-3 text-xs sm:text-sm font-bold rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleProcessPayment}
              disabled={loading || isCashInsufficient}
              className="py-3 text-xs sm:text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                'Menyimpan Transaksi...'
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>{autoPrintReceipt ? 'Konfirmasi & Cetak Struk' : 'Konfirmasi Pembayaran'}</span>
                </>
              )}
            </Button>
          </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
