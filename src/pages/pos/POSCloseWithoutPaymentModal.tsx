import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { DoorOpen, AlertTriangle, CheckCircle2, Ban } from 'lucide-react';

interface POSCloseWithoutPaymentModalProps {
  isOpen: boolean;
  tableNumber: string;
  sessionId: string;
  totalBill: number;
  activeOrdersCount: number;
  onClose: () => void;
  onConfirm: (sessionId: string, reason: string) => Promise<void>;
}

export const POSCloseWithoutPaymentModal: React.FC<POSCloseWithoutPaymentModalProps> = ({
  isOpen,
  tableNumber,
  sessionId,
  totalBill,
  activeOrdersCount,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState<string>('Pelanggan batal order / pergi');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedReasons = [
    'Pelanggan batal order / pergi',
    'Salah buka sesi meja',
    'Pelanggan pindah ke meja lain',
    'Customer hanya lihat menu lalu pergi'
  ];

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const fullReason = customReason.trim() ? `${reason} (${customReason.trim()})` : reason;
      await onConfirm(sessionId, fullReason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup sesi meja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tutup Sesi Meja ${tableNumber}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">
              Kosongkan Meja Langsung Tanpa Pembayaran
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Sesi meja <strong>{tableNumber}</strong> akan ditutup segera. Status meja akan otomatis berubah menjadi <strong>KOSONG</strong> dan siap digunakan kembali untuk tamu baru.
            </p>
          </div>
        </div>

        {/* Current status summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Pesanan Aktif:</span>
            <span className="font-semibold text-slate-800">{activeOrdersCount} pesanan</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total Tagihan:</span>
            <span className="font-bold text-slate-900">
              Rp {totalBill.toLocaleString('id-ID')}
            </span>
          </div>
          {activeOrdersCount > 0 && (
            <p className="text-[11px] text-rose-600 pt-1 border-t border-slate-200 font-medium">
              * Seluruh pesanan yang belum selesai akan otomatis berstatus <strong>Dibatalkan</strong>.
            </p>
          )}
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Alasan Penutupan Sesi:
          </label>
          <div className="space-y-1.5">
            {predefinedReasons.map(r => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  reason === r
                    ? 'border-[#1A3A5C] bg-[#1A3A5C]/5 text-[#1A3A5C] font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="closeReason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-[#1A3A5C] focus:ring-[#1A3A5C]"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <input
            type="text"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="Catatan tambahan (opsional)..."
            className="w-full mt-1.5 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A3A5C] focus:border-[#1A3A5C]"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 font-bold shadow-xs"
          >
            <DoorOpen className="w-4 h-4" />
            <span>{loading ? 'Menutup Sesi...' : 'Ya, Kosongkan Meja'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
