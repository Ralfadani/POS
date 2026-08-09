import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Table, Session } from '../../types/index.js';
import { Printer, ExternalLink, Copy, Check } from 'lucide-react';

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

    const cafeName = 'BREW & BYTE CAFE';

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QR Meja - ${table.table_number}</title>
  <style>
    @page { size: 80mm auto; margin: 5mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      text-align: center;
      background: white;
      color: #1A3A5C;
      padding: 16px;
    }
    .card {
      border: 2px dashed #c7d2e6;
      border-radius: 12px;
      padding: 20px 16px;
      display: inline-block;
      max-width: 240px;
    }
    .cafe-name {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .subtitle {
      font-size: 8pt;
      color: #64748b;
      margin-bottom: 12px;
    }
    .table-badge {
      display: inline-block;
      background: #1A3A5C;
      color: white;
      font-size: 13pt;
      font-weight: bold;
      padding: 5px 18px;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .qr-img {
      width: 180px;
      height: 180px;
      display: block;
      margin: 0 auto 10px;
    }
    .instruction {
      font-size: 9pt;
      font-weight: 700;
      color: #334155;
    }
    .subtext {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="cafe-name">${cafeName}</div>
    <div class="subtitle">Self-Ordering QR Table Stand</div>
    <div class="table-badge">${table.table_number}</div>
    <br>
    <img class="qr-img" src="${svgDataUrl}" alt="QR Code ${table.table_number}">
    <div class="instruction">Scan untuk Memesan Langsung</div>
    <div class="subtext">Pesanan langsung ke Dapur & Bar</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 200);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, '_blank');
    if (!printWin) {
      // Fallback jika popup diblokir: download file HTML
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${table.table_number}.html`;
      a.click();
    }
    // Revoke blob URL setelah jeda aman
    setTimeout(() => URL.revokeObjectURL(url), 30000);
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
