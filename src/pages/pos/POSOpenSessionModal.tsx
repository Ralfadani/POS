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

    const printWin = window.open('', '_blank', 'width=400,height=550');
    if (!printWin) {
      alert('Pop-up printer diblokir browser. Harap izinkan pop-up.');
      return;
    }

    const svgElement = document.getElementById('table-qr-svg')?.outerHTML || '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Menu - ${table.table_number}</title>
          <style>
            @page { size: 80mm 100mm; margin: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 20px;
              color: #1A3A5C;
            }
            .title { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
            .subtitle { font-size: 11px; color: #64748b; margin-bottom: 16px; }
            .table-badge {
              display: inline-block;
              background: #1A3A5C;
              color: white;
              font-size: 16px;
              font-weight: bold;
              padding: 6px 16px;
              border-radius: 8px;
              margin-bottom: 16px;
            }
            .qr-box {
              background: white;
              padding: 12px;
              display: inline-block;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
            }
            .instructions { font-size: 12px; font-weight: 600; margin-top: 14px; color: #334155; }
            .subtext { font-size: 10px; color: #94a3b8; margin-top: 4px; }
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
          <div class="instructions">Scan QR untuk Melihat Menu & Memesan Langsung</div>
          <div class="subtext">Pesanan akan langsung diteruskan ke Bar & Dapur</div>
          <div class="no-print" style="margin-top: 24px;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #1A3A5C; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Cetak QR Meja
            </button>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 350);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
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
