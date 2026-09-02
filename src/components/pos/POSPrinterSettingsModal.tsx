import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  BluetoothOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  FileText,
  HelpCircle,
  X,
  Sparkles,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import {
  isBluetoothSupported,
  isPrinterConnected,
  getActivePrinterName,
  getStoredPrinterConfig,
  savePrinterConfig,
  scanAndConnectBluetoothPrinter,
  disconnectBluetoothPrinter,
  printTestReceiptBluetooth,
  subscribePrinterStatus,
  BluetoothPrinterConfig
} from '../../utils/bluetoothPrinter.js';

interface POSPrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const POSPrinterSettingsModal: React.FC<POSPrinterSettingsModalProps> = ({ isOpen, onClose }) => {
  const [supported, setSupported] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [config, setConfig] = useState<BluetoothPrinterConfig>(getStoredPrinterConfig());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  useEffect(() => {
    setSupported(isBluetoothSupported());
    setConfig(getStoredPrinterConfig());

    const unsubscribe = subscribePrinterStatus((isConnected, name) => {
      setConnected(isConnected);
      setDeviceName(name);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsScanning(true);
    setStatusMessage({ text: 'Membuka pencarian Bluetooth browser... Silakan pilih perangkat printer Anda.', type: 'info' });

    try {
      const res = await scanAndConnectBluetoothPrinter();
      if (res.success) {
        setStatusMessage({ text: res.message || 'Printer Bluetooth berhasil terhubung!', type: 'success' });
        setConfig(getStoredPrinterConfig());
      } else {
        setStatusMessage({ text: res.message || 'Koneksi dibatalkan atau gagal.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Terjadi kesalahan saat menghubungkan Bluetooth.', type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = () => {
    disconnectBluetoothPrinter();
    setStatusMessage({ text: 'Printer Bluetooth berhasil diputuskan.', type: 'info' });
  };

  const handleSaveConfig = (updates: Partial<BluetoothPrinterConfig>) => {
    const updated = savePrinterConfig(updates);
    setConfig(updated);
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setStatusMessage({ text: 'Mengirim struk uji coba ke printer Bluetooth...', type: 'info' });

    try {
      if (!connected) {
        throw new Error('Printer Bluetooth belum terhubung. Silakan hubungkan printer terlebih dahulu.');
      }
      await printTestReceiptBluetooth();
      setStatusMessage({ text: 'Struk uji coba berhasil dikirim ke printer!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal mencetak struk uji coba.', type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Pengaturan Printer Bluetooth POS
                <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full font-semibold uppercase">
                  ESC/POS
                </span>
              </h2>
              <p className="text-xs text-slate-400">Hubungkan printer thermal nirkabel untuk pencetakan struk kasir & dapur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                  : 'bg-sky-950/50 border-sky-500/30 text-sky-300'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Web Bluetooth Support Banner */}
          {!supported && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300 block mb-1">Browser Tidak Mendukung Web Bluetooth API</strong>
                Fitur cetak langsung Bluetooth membutuhkan browser berbasis Chromium (Google Chrome atau Microsoft Edge di Android/Desktop). Anda tetap dapat mencetak struk menggunakan mode dialog cetak standar browser.
              </div>
            </div>
          )}

          {/* Device Connection Card */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    connected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {connected ? <Bluetooth className="w-5 h-5 animate-pulse" /> : <BluetoothOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Status Device:</span>
                    {connected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Terhubung
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        Terputus
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {connected ? deviceName || config.deviceName : 'Belum Ada Printer Terhubung'}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {!connected ? (
                  <button
                    onClick={handleConnect}
                    disabled={isScanning || !supported}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                    <span>{isScanning ? 'Mencari Device...' : 'Cari & Hubungkan Printer'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <BluetoothOff className="w-3.5 h-3.5" />
                    <span>Putuskan Koneksi</span>
                  </button>
                )}
              </div>
            </div>

            {/* Test Print Action */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400">Pengujian koneksi & format hasil cetak struk:</span>
              <button
                onClick={handleTestPrint}
                disabled={isTesting || !connected}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-400 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Uji Coba Cetak Struk (Test Print)</span>
              </button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="space-y-4 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Konfigurasi Ukuran Kertas & Mode Cetak</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Paper Width Selector */}
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Ukuran Kertas Thermal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveConfig({ paperWidth: '58mm' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      config.paperWidth === '58mm'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    58mm (Standard)
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">32 Kolom Karakter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConfig({ paperWidth: '80mm' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      config.paperWidth === '80mm'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    80mm (Lebar)
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">48 Kolom Karakter</span>
                  </button>
                </div>
              </div>

              {/* Print Copies */}
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Jumlah Rangkap Struk</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleSaveConfig({ copies: count })}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        config.copies === count
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {count}x Struk
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Print Struk Transaksi Kasir</span>
                  <span className="text-[11px] text-slate-400 block">Otomatis mengirim data struk ke printer Bluetooth saat pembayaran selesai</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoPrintReceipt}
                  onChange={e => handleSaveConfig({ autoPrintReceipt: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Print Tiket Pesanan Dapur / Bar</span>
                  <span className="text-[11px] text-slate-400 block">Otomatis mencetak tiket KOT ke printer Bluetooth saat pesanan baru masuk</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoPrintKitchen}
                  onChange={e => handleSaveConfig({ autoPrintKitchen: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Troubleshooting Guide */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>Panduan Hubungkan Printer Bluetooth:</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Pastikan Bluetooth pada perangkat HP/Tablet/Laptop dan printer thermal dalam kondisi **ON**.</li>
              <li>Sandingkan (**Pair**) printer Bluetooth terlebih dahulu pada Pengaturan Bluetooth Android / Windows jika diminta kode PIN (biasanya <code className="text-sky-300 font-mono">0000</code> atau <code className="text-sky-300 font-mono">1234</code>).</li>
              <li>Klik tombol **"Cari & Hubungkan Printer"**, lalu pilih nama printer (misal: *POS-58, RPP02N, EPX, Xprinter*) pada popup dialog browser.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
