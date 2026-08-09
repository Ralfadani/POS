import React, { useState } from 'react';
import { Order, OrderItem } from '../../types/index.js';
import { formatRupiah, formatTime } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.js';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  FileText,
  User,
  ShoppingBag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { DoorOpen, CheckSquare, Square } from 'lucide-react';

interface POSCancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  tableNumber: string;
  isOnlyActiveOrder?: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: number, reason: string, reasonCategory: string, closeSessionImmediately: boolean) => Promise<void>;
}

export const POSCancelOrderModal: React.FC<POSCancelOrderModalProps> = ({
  isOpen,
  order,
  tableNumber,
  isOnlyActiveOrder = true,
  onClose,
  onConfirmCancel
}) => {
  const { user } = useAuth();
  const [reasonCategory, setReasonCategory] = useState<string>('Pelanggan Batal / Pergi');
  const [customReason, setCustomReason] = useState<string>('');
  const [closeSessionImmediately, setCloseSessionImmediately] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const reasonCategories = [
    {
      id: 'Pelanggan Batal / Pergi',
      label: 'Pelanggan Buru-Buru / Pergi',
      description: 'Pelanggan harus segera pergi atau tidak bisa menunggu proses masak.'
    },
    {
      id: 'Salah Input oleh Kasir',
      label: 'Salah Input / Koreksi Kasir',
      description: 'Kasir salah memilih meja atau salah memasukkan varian/menu item.'
    },
    {
      id: 'Menu Habis / Bahan Habis',
      label: 'Bahan Baku Dapur Habis',
      description: 'Dapur kehabisan stok bahan setelah pesanan terlanjur masuk sistem.'
    },
    {
      id: 'Pelanggan Ganti Menu',
      label: 'Pelanggan Ingin Ganti Menu',
      description: 'Pelanggan ingin membatalkan order lama dan memesan menu varian lain.'
    },
    {
      id: 'Kendala Teknis / Lainnya',
      label: 'Alasan Khusus / Lainnya',
      description: 'Kendala peralatan dapur, pembayaran gagal, atau situasi darurat.'
    }
  ];

  const calculateOrderTotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, it) => sum + (Number(it.subtotal) || (Number(it.item_price) * Number(it.quantity))), 0);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullReason = customReason.trim()
      ? `${customReason.trim()}`
      : `${reasonCategory}`;

    if (!fullReason || fullReason.length < 3) {
      setError('Harap tuliskan alasan pembatalan dengan jelas (minimal 3 karakter) untuk keperluan audit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirmCancel(order.order_id, fullReason, reasonCategory, closeSessionImmediately);
      setCustomReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateOrderTotal();

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Batalkan Pesanan #{order.order_id}</h3>
              <p className="text-[11px] text-rose-100">{tableNumber} • {order.channel === 'self_order' ? 'Self Order HP' : 'Kasir POS'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-rose-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCancelSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Audit Notice Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Pencatatan Audit Pembatalan Aktif</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Setiap pembatalan pesanan akan <strong>terekam permanen</strong> pada Log Audit Pembatalan dan dapat ditinjau oleh Admin/Owner resto untuk mencegah kecurangan kasir.
              </p>
            </div>
          </div>

          {/* Direct Close Session Option (No Payment Needed When Cancelled) */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={closeSessionImmediately}
                onChange={e => setCloseSessionImmediately(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#1A3A5C] rounded border-slate-300 focus:ring-[#1A3A5C]"
              />
              <div className="text-xs">
                <span className="font-bold text-[#1A3A5C] flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-sky-600" />
                  Langsung Tutup Sesi Meja & Kosongkan Meja
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Jika dicentang, meja akan langsung berstatus <strong>Kosong</strong> tanpa harus melalui langkah pembayaran & kasir tidak perlu input uang.
                </p>
              </div>
            </label>
          </div>

          {/* Summary of items being cancelled */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                Item yang Dibatalkan
              </span>
              <span className="text-rose-600 font-extrabold">{formatRupiah(totalAmount)}</span>
            </div>

            <div className="space-y-1 text-xs">
              {order.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-700">
                  <span className="truncate pr-2">
                    <strong className="text-slate-900">{it.quantity}x</strong> {it.item_name}
                  </span>
                  <span className="font-semibold shrink-0 font-mono text-[11px]">
                    {formatRupiah(it.subtotal || (it.item_price * it.quantity))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Kategori Alasan Pembatalan <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              {reasonCategories.map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reasonCategory === cat.id
                      ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reasonCategory"
                    value={cat.id}
                    checked={reasonCategory === cat.id}
                    onChange={e => setReasonCategory(e.target.value)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="ml-2.5">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{cat.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Reason Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Penjelasan Detail Kasir <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib diisi jelas</span>
            </label>
            <textarea
              required
              rows={2}
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Jelaskan alasan pembatalan secara rinci (misal: Pelanggan buru-buru ada panggilan telepon, minta dibatalkan sebelum goreng ayam)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Cashier Identity Stamp */}
          <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Petugas Kasir:</span>
              <strong className="text-slate-800">{user?.name || 'Kasir POS'}</strong>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">{formatTime(new Date().toISOString())}</span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Kembali
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={loading}
              className="text-xs font-bold flex items-center gap-1.5 shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{loading ? 'Membatalkan...' : 'Konfirmasi Batalkan Pesanan'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
