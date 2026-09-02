import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, Session, Order, CalculationBreakdown, MenuItem } from '../../types/index.js';
import { formatRupiah, formatTime } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { printThermalReceipt } from '../../utils/thermalPrinter.js';
import { isPrinterConnected, printTableQRBluetooth } from '../../utils/bluetoothPrinter.js';
import { POSCancelOrderModal } from './POSCancelOrderModal.js';
import { POSCloseWithoutPaymentModal } from './POSCloseWithoutPaymentModal.js';
import {
  Printer,
  PlusCircle,
  Plus,
  CreditCard,
  QrCode,
  Clock,
  ShoppingBag,
  Smartphone,
  Tablet,
  CheckCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  ChefHat,
  Sparkles,
  Users,
  AlertCircle,
  AlertTriangle,
  Ban,
  DoorOpen
} from 'lucide-react';

interface POSSessionDetailProps {
  table: Table;
  session: Session | null;
  orders: Order[];
  calculation: CalculationBreakdown | null;
  menuItems?: MenuItem[];
  onOpenManualOrder: () => void;
  onOpenCloseSession: () => void;
  onCloseSessionWithoutPayment?: (sessionId: string, reason?: string) => Promise<any>;
  onOpenQRModal?: () => void;
  onOpenSession?: (tableId: number) => Promise<void>;
  onCloseSidebar?: () => void;
  onUpdateOrderStatus: (orderId: number, newStatus: 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan') => Promise<void>;
}

export const POSSessionDetail: React.FC<POSSessionDetailProps> = ({
  table,
  session,
  orders,
  calculation,
  onOpenManualOrder,
  onOpenCloseSession,
  onCloseSessionWithoutPayment,
  onOpenQRModal,
  onOpenSession,
  onCloseSidebar,
  onUpdateOrderStatus
}) => {
  const [activeSideTab, setActiveSideTab] = useState<'orders' | 'qr'>('orders');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCloseWithoutPaymentModalOpen, setIsCloseWithoutPaymentModalOpen] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const menuUrl = session?.session_id
    ? `${origin}/menu?session_id=${session.session_id}`
    : `${origin}/menu?table=${table.table_id}`;

  const handleCopyLink = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintQR = async () => {
    if (isPrinterConnected() && menuUrl) {
      try {
        const area = 'Meja POS';
        const res = await fetch('/api/admin/settings');
        const settings = await res.json();
        const cafeName = settings.success && settings.profile ? settings.profile.cafe_name : 'BREW & BYTE CAFE';
        
        await printTableQRBluetooth(table.table_number, area, menuUrl, cafeName);
        alert('Berhasil mengirim Stand QR ke printer Bluetooth!');
        return;
      } catch (err: any) {
        alert('Gagal cetak QR via Bluetooth: ' + err.message);
        return;
      }
    }

    const printWin = window.open('', '_blank', 'width=400,height=550');
    if (!printWin) {
      alert('Pop-up printer diblokir browser. Harap izinkan pop-up untuk mencetak QR Stand.');
      return;
    }

    const svgElement = document.getElementById(`side-table-qr-svg-${table.table_id}`)?.outerHTML || '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Stand Meja - ${table.table_number}</title>
          <style>
            @page { size: 80mm 100mm; margin: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 20px;
              color: #1A3A5C;
            }
            .title { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
            .subtitle { font-size: 11px; color: #64748b; margin-bottom: 12px; }
            .table-badge {
              display: inline-block;
              background: #1A3A5C;
              color: white;
              font-size: 15px;
              font-weight: bold;
              padding: 5px 14px;
              border-radius: 8px;
              margin-bottom: 14px;
            }
            .qr-box {
              background: white;
              padding: 10px;
              display: inline-block;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
            }
            .instructions { font-size: 12px; font-weight: 700; margin-top: 12px; color: #1e293b; }
            .subtext { font-size: 10px; color: #64748b; margin-top: 4px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="title">BREW & BYTE CAFE</div>
          <div class="subtitle">Self-Ordering QR Table Stand</div>
          <div class="table-badge">${table.table_number}</div>
          <br>
          <div class="qr-box">
            ${svgElement}
          </div>
          <div class="instructions">Pindai QR untuk Pesan Langsung</div>
          <div class="subtext">Scan dengan kamera HP Anda untuk melihat menu dan memesan</div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintKitchenSlip = () => {
    if (!session || orders.length === 0) return;
    const activeOrders = orders.filter(o => o.status !== 'dibatalkan');
    const allKitchenItems = activeOrders.flatMap(o =>
      (o.items || []).map(i => ({
        name: i.item_name || 'Menu',
        quantity: i.quantity,
        price: i.item_price,
        subtotal: i.subtotal,
        notes: i.notes ? `[#ORD-${o.order_id}] ${i.notes}` : `[#ORD-${o.order_id}]`
      }))
    );

    if (allKitchenItems.length === 0) return;

    printThermalReceipt({
      type: 'order_kitchen',
      tableNumber: table.table_number,
      sessionId: session.session_id,
      cashierName: 'Kasir',
      items: allKitchenItems
    });
  };

  const handleDirectOpenSession = async () => {
    if (!onOpenSession) return;
    setIsOpeningSession(true);
    try {
      await onOpenSession(table.table_id);
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleConfirmCancelOrder = async (
    orderId: number,
    reason: string,
    reasonCategory: string,
    closeSessionImmediately: boolean
  ) => {
    const res = await fetch(`/api/pos/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        reason_category: reasonCategory,
        close_session: closeSessionImmediately
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal membatalkan pesanan');
    }
    await onUpdateOrderStatus(orderId, 'dibatalkan');

    if (closeSessionImmediately && session?.session_id && onCloseSessionWithoutPayment) {
      try {
        await onCloseSessionWithoutPayment(session.session_id, `Ditutup saat membatalkan order #${orderId}`);
      } catch (e) {
        // Handled by backend auto-close
      }
    }
  };

  const handleDirectCloseSessionWithoutPayment = () => {
    if (!session) return;
    setIsCloseWithoutPaymentModalOpen(true);
  };

  const handleConfirmCloseWithoutPayment = async (sessionId: string, reason: string) => {
    if (onCloseSessionWithoutPayment) {
      await onCloseSessionWithoutPayment(sessionId, reason);
    } else {
      const res = await fetch(`/api/pos/sessions/${sessionId}/close-without-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || 'Customer batal order / meja dikosongkan langsung'
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menutup sesi');
      }
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'dibatalkan':
        return <Badge variant="danger" size="sm">Dibatalkan</Badge>;
      default:
        return <Badge variant="success" size="sm">Pesanan Aktif</Badge>;
    }
  };

  const isOccupied = table.status === 'terisi' && session !== null;
  const activeOrdersCount = orders.filter(o => o.status !== 'dibatalkan').length;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-lg lg:shadow-xs overflow-hidden select-none">
      {/* 1. Top Panel Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1A3A5C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {table.table_number.replace(/\D/g, '') || table.table_number.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 leading-none truncate">{table.table_number}</h3>
                <Badge variant={isOccupied ? 'success' : 'neutral'} size="sm">
                  {isOccupied ? 'Sesi Aktif' : 'Meja Kosong'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                <span>Kapasitas: {table.capacity} Orang</span>
                {session && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-600">
                      Mulai {formatTime(session.start_time)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Side Panel Mode Switcher Tabs (Only visible when session is active) */}
        {session && (
          <div className="grid grid-cols-2 gap-1.5 mt-3 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveSideTab('orders')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSideTab === 'orders'
                  ? 'bg-white text-[#1A3A5C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pesanan & Tagihan</span>
              {activeOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1A3A5C] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSideTab('qr')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSideTab === 'qr'
                  ? 'bg-white text-[#1A3A5C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Stand QR Meja</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Panel Main Body */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        {/* If table is EMPTY / NO SESSION */}
        {!session ? (
          <div className="h-full p-6 flex flex-col items-center justify-center text-center my-auto space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
              <ShoppingBag className="w-7 h-7 text-slate-400 stroke-[1.5]" />
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-base font-bold text-slate-800">Meja Belum Dibuka</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buka sesi meja untuk memunculkan <strong>Stand QR Meja</strong> bagi pelanggan, atau langsung input pesanan kasir.
              </p>
            </div>

            {/* 2 Clear Main Actions */}
            <div className="w-full max-w-xs space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleDirectOpenSession}
                disabled={isOpeningSession}
                className="flex items-center justify-center gap-2 shadow-xs text-sm font-bold py-3"
              >
                <span>{isOpeningSession ? 'Membuka Sesi...' : 'Buka Sesi Meja'}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={onOpenManualOrder}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 py-3"
              >
                <span>Pesan Langsung di Kasir</span>
              </Button>
            </div>
          </div>
        ) : activeSideTab === 'orders' ? (
          /* TAB 1: PESANAN & BILL (when session active) */
          <div className="h-full flex flex-col justify-between">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Orders Feed */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Sesi aktif, belum ada pesanan</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Scan QR di meja untuk pesan mandiri atau klik tombol <strong>+ Pesan Kasir</strong> di bawah.
                    </p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.order_id} className="pt-3.5 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">#ORD-{order.order_id}</span>
                          {order.channel === 'self_order' ? (
                            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-sky-600" /> Self Order
                            </span>
                          ) : (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                              <Tablet className="w-3 h-3 text-purple-600" /> Kasir
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatTime(order.created_at)}
                          </span>
                        </div>

                        <div>
                          {getOrderStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 border border-slate-200/60">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex-1 pr-2">
                              <div className="font-medium text-slate-800">
                                <span className="font-bold text-[#1A3A5C]">{item.quantity}x</span> {item.item_name}
                              </div>
                              {item.notes && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium">
                                  Catatan: {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="font-semibold text-slate-700 text-right whitespace-nowrap">
                              {formatRupiah(item.subtotal)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* If order is cancelled */}
                      {order.status === 'dibatalkan' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-rose-900 font-bold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              {order.cancel_reason_category || 'Dibatalkan'}
                            </span>
                            {order.cancelled_by_name && (
                              <span className="text-[10px] text-slate-500 font-normal">Oleh {order.cancelled_by_name}</span>
                            )}
                          </div>
                          {order.cancel_reason && (
                            <p className="text-rose-950 text-[11px] italic pl-4.5 font-medium leading-tight">
                              "{order.cancel_reason}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: STAND QR MENU */
          <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 w-full flex flex-col items-center shadow-2xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Stand QR Self-Order Meja
              </span>
              <h4 className="text-lg font-black text-[#1A3A5C] mt-0.5 mb-3">{table.table_number}</h4>

              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
                <QRCodeSVG
                  id={`side-table-qr-svg-${table.table_id}`}
                  value={menuUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-xs text-slate-600 max-w-xs mt-3 leading-relaxed">
                Pelanggan cukup membuka kamera HP dan memindai kode QR ini untuk memilih menu & memesan langsung.
              </p>

              <div className="w-full mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sesi Meja Aktif (ID: {session.session_id.slice(0, 8)}...)</span>
              </div>
            </div>

            {/* QR Quick Action Buttons */}
            <div className="w-full space-y-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handlePrintQR}
                className="flex items-center justify-center gap-2 shadow-xs text-xs font-extrabold py-3 rounded-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Stand QR Meja (Thermal 80mm)</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                </Button>

                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Web HP</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pinned Sticky Bottom Footer (Calculations & Checkout) */}
      {session && activeSideTab === 'orders' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
          {/* Tombol Cetak Slip Dapur Fixed di Atas Subtotal (Full Width) */}
          {activeOrdersCount > 0 && (
            <button
              type="button"
              onClick={handlePrintKitchenSlip}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Cetak Tiket Dapur Thermal 58mm untuk Pesanan Meja Ini"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Slip Dapur</span>
            </button>
          )}

          {calculation && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({activeOrdersCount} order aktif):</span>
                <span>{formatRupiah(calculation.subtotal)}</span>
              </div>
              {calculation.is_service_active && (
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge ({calculation.service_charge_rate}%):</span>
                  <span>{formatRupiah(calculation.service_charge)}</span>
                </div>
              )}
              {calculation.is_tax_active && (
                <div className="flex justify-between text-slate-500">
                  <span>PB1 ({calculation.tax_rate}%):</span>
                  <span>{formatRupiah(calculation.tax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-sm font-bold text-[#1A3A5C]">
                <span>TOTAL TAGIHAN:</span>
                <span className="text-base font-extrabold text-slate-900">{formatRupiah(calculation.total)}</span>
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={onOpenManualOrder}
              className="py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>+ Pesan Kasir</span>
            </button>

            {activeOrdersCount > 0 && (calculation?.total || 0) > 0 ? (
              <button
                type="button"
                onClick={onOpenCloseSession}
                className="py-2.5 px-3 rounded-lg bg-[#1A3A5C] hover:bg-[#152e4a] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar & Selesai</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDirectCloseSessionWithoutPayment}
                className="py-2.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <DoorOpen className="w-4 h-4 text-rose-600" />
                <span>Tutup Sesi (Batal)</span>
              </button>
            )}
          </div>

          {/* Text link Pelanggan batal/pergi */}
          {activeOrdersCount > 0 && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={handleDirectCloseSessionWithoutPayment}
                className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Ban className="w-3 h-3" />
                <span>Pelanggan batal/pergi? Tutup sesi tanpa bayar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Audit Modal */}
      <POSCancelOrderModal
        isOpen={orderToCancel !== null}
        order={orderToCancel}
        tableNumber={table.table_number}
        isOnlyActiveOrder={activeOrdersCount <= 1}
        onClose={() => setOrderToCancel(null)}
        onConfirmCancel={handleConfirmCancelOrder}
      />

      {/* Close Without Payment Modal */}
      {session && (
        <POSCloseWithoutPaymentModal
          isOpen={isCloseWithoutPaymentModalOpen}
          tableNumber={table.table_number}
          sessionId={session.session_id}
          totalBill={calculation?.total || 0}
          activeOrdersCount={activeOrdersCount}
          onClose={() => setIsCloseWithoutPaymentModalOpen(false)}
          onConfirm={handleConfirmCloseWithoutPayment}
        />
      )}
    </div>
  );
};
