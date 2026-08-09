import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Table, Session } from '../../types/index.js';
import { Printer, ExternalLink, Copy, Check } from 'lucide-react';
import { printHtmlDirectly } from '../../utils/printUtils.js';

interface POSOpenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  session: Session | null;
  onOpenSession: (tableId: number) => Promise<void>;
  loading?: boolean;
}

export const POSOpenSessionModal: React.FC<POSOpenSessionModalProps> = ({
  isOpen,
  onClose,
  table,
  session,
  onOpenSession,
  loading = false
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!table) return null;

  const origin = window.location.origin;
  const menuUrl = session?.session_id
    ? `${origin}/menu?session_id=${session.session_id}`
    : '';

  const handleCopyLink = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    if (!session || !table) return;

    // Ambil elemen SVG langsung dari DOM (hasil render React)
    const container = document.getElementById('table-qr-svg');
    const svgEl = container?.querySelector('svg');
    if (!svgEl) {
      alert('QR Code belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }

    // Serialize SVG ke string, lalu encode sebagai Data URL
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    // Fetch cafe name & info from the server for the receipt header
    const getCafeInfo = async () => {
      try {
        const res = await fetch('/api/cafe-profile');
        const data = await res.json();
        if (data.success && data.profile) return data.profile;
      } catch (_) {}
      return { cafe_name: 'BREW & BYTE CAFE', cafe_address: '', cafe_phone: '' };
    };

    getCafeInfo().then((profile) => {
      const cafeName = profile.cafe_name || 'BREW & BYTE CAFE';
      const cafeAddress = profile.cafe_address || '';
      const cafePhone = profile.cafe_phone || '';
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      const html = `
  <div class="center">
    <div class="cafe-name">${cafeName}</div>
    ${cafeAddress ? `<div class="cafe-sub">${cafeAddress}</div>` : ''}
    ${cafePhone ? `<div class="cafe-sub">Telp: ${cafePhone}</div>` : ''}
  </div>

  <div class="divider-solid"></div>

  <div class="section-label">*** QR MENU MEJA ***</div>

  <div class="row"><span>Tanggal:</span><span>${dateStr}</span></div>
  <div class="row"><span>Waktu:</span><span>${timeStr}</span></div>
  <div class="row"><span>Sesi ID:</span><span>#${session?.session_id ?? '-'}</span></div>

  <div class="divider-solid"></div>

  <div class="center bold" style="font-size:10pt; margin: 4px 0 2px;">NOMOR MEJA</div>
  <div class="table-number">${table.table_number}</div>

  <div class="divider"></div>

  <div class="center" style="font-size: 9pt; margin-bottom: 4px;">
    Scan QR di bawah untuk memesan mandiri
  </div>

  <div class="qr-wrap">
    <img src="${svgDataUrl}" alt="QR Code ${table.table_number}">
  </div>

  <div class="url-box">${menuUrl}</div>

  <div class="divider"></div>

  <div class="footer">
    <strong>Silakan scan QR untuk melihat menu</strong><br>
    &amp; memesan langsung dari smartphone Anda.<br>
    Pesanan otomatis masuk ke Dapur &amp; Bar.
  </div>

  <div class="divider"></div>
  <div class="center" style="font-size: 8pt; color: #888; margin-top: 4px;">
    --- Struk QR Meja Pelanggan ---
  </div>
`;

      printHtmlDirectly(html);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sesi ${table.table_number}`}
      subtitle={session ? 'QR Code pemesanan pelanggan aktif' : 'Buka sesi untuk mengaktifkan pemesanan di meja ini'}
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center">
        {!session ? (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
              {table.table_number.replace(/\D/g, '') || '01'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Meja saat ini berstatus Kosong</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Buka sesi baru untuk menghasilkan QR Code unik agar pelanggan dapat memesan mandiri dari smartphone mereka.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={() => onOpenSession(table.table_id)}
              className="mt-4"
            >
              {loading ? 'Membuka Sesi...' : 'Buka Sesi Meja Sekarang'}
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200" id="table-qr-svg">
                <QRCodeSVG
                  value={menuUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1A3A5C"
                />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold px-2.5 py-1 bg-[#1A3A5C] text-white rounded-md uppercase tracking-wider">
                  {table.table_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Arahkan kamera HP ke QR Code di atas untuk membuka Web Menu
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrintQR}
                className="flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Cetak QR Meja
              </Button>

              <a
                href={menuUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Web Menu
              </a>
            </div>

            {/* Link Copy Box */}
            <div className="bg-slate-100/80 p-2.5 rounded-lg flex items-center justify-between text-xs text-slate-600 font-mono overflow-hidden">
              <span className="truncate mr-2">{menuUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 bg-white hover:bg-slate-50 rounded border border-slate-200 text-slate-700 shrink-0 font-sans text-xs font-medium flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Tutup Modal
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
