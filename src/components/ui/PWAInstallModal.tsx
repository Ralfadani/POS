import React, { useState, useEffect } from 'react';
import {
  Tablet,
  Smartphone,
  Laptop,
  Maximize,
  X,
  Share,
  Download,
  CheckCircle2
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPos?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPos
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop' | 'kiosk'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Untuk memasang di tablet: Tekan menu titik tiga di Google Chrome lalu pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Tablet className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Petunjuk Pemasangan Tablet Kasir
              </h2>
              <p className="text-[11px] text-slate-500">
                Jalankan POS sebagai aplikasi mandiri di Android Tablet, iPad, atau PC Kasir
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Strip */}
        <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-slate-600">
            Status: <strong className="text-slate-900">{isInstalled ? 'Mode Standalone Aktif' : 'Siap Dipasang'}</strong>
          </span>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install 1-Klik</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Kiosk'}</span>
            </button>
          </div>
        </div>

        {/* Tabs for Devices */}
        <div className="px-4 pt-2 border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'android'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Android Tablet (Samsung / Redmi)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ios'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Apple iPad</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'desktop'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC Kasir Windows</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'kiosk'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Mode Kiosk</span>
          </button>
        </div>

        {/* Tab Instructions Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* ANDROID INSTRUCTIONS */}
          {activeTab === 'android' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Buka Google Chrome di Tablet</strong>
                  <span className="text-slate-500 text-[11px]">Buka alamat URL sistem POS cafe ini di browser Chrome tablet Anda.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Tekan Menu Titik Tiga (⋮)</strong>
                  <span className="text-slate-500 text-[11px]">Pilih opsi <strong className="text-slate-800">"Tambahkan ke Layar Utama"</strong> atau <strong className="text-slate-800">"Install Aplikasi"</strong>.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Buka dari Home Screen Tablet</strong>
                  <span className="text-slate-500 text-[11px]">Icon aplikasi akan muncul di layar tablet dan berjalan mandiri tanpa bilah URL browser.</span>
                </div>
              </div>
            </div>
          )}

          {/* APPLE IPAD INSTRUCTIONS */}
          {activeTab === 'ios' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Buka di Safari iPad</strong>
                  <span className="text-slate-500 text-[11px]">Pastikan menggunakan browser bawaan Safari pada iPad.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs flex items-center gap-1">
                    <span>Tekan Tombol Bagikan</span>
                    <Share className="w-3 h-3 text-blue-600 inline" />
                  </strong>
                  <span className="text-slate-500 text-[11px]">Pilih opsi <strong className="text-slate-800">"Add to Home Screen" (Tambah ke Layar Utama)</strong>.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Selesai & Jalankan</strong>
                  <span className="text-slate-500 text-[11px]">Tekan "Add / Tambah". Buka POS dari layar utama iPad untuk tampilan kasir layar penuh.</span>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP / PC INSTRUCTIONS */}
          {activeTab === 'desktop' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Buka di Chrome atau Microsoft Edge</strong>
                  <span className="text-slate-500 text-[11px]">Lihat ke bagian kanan <strong>Address Bar</strong> peramban.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Klik Ikon Unduh / Install Aplikasi</strong>
                  <span className="text-slate-500 text-[11px]">Pilih "Install Aplikasi" untuk menyematkan sistem ke Taskbar Windows atau Desktop.</span>
                </div>
              </div>
            </div>
          )}

          {/* KIOSK MODE INFO */}
          {activeTab === 'kiosk' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <strong className="text-slate-900 block text-xs">Mengapa Mode Layar Penuh Kiosk?</strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Mode Kiosk mengunci tampilan POS agar kasir dan barista dapat mengoperasikan sistem tanpa navigasi tab browser yang mengganggu, meminimalkan salah tekan tombol browser.
                </p>
              </div>

              <button
                onClick={toggleFullscreen}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>{isFullscreen ? 'Keluar Fullscreen' : 'Aktifkan Layar Penuh Kiosk Sekarang'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
          <span className="text-slate-500 text-[11px]">
            Demo Kasir: <span className="font-mono text-slate-800 font-bold">kasir / kasir123</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200"
            >
              Tutup
            </button>

            {onNavigateToPos && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToPos();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Buka Layar Kasir POS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
