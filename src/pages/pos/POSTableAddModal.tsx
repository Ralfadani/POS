import React, { useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { PlusCircle, X, Users, MapPin, Check, AlertCircle } from 'lucide-react';

interface POSTableAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const POSTableAddModal: React.FC<POSTableAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [area, setArea] = useState('Area Indoor');
  const [customArea, setCustomArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const standardAreas = [
    'Area Indoor',
    'Area Outdoor / Smoking',
    'Lantai 2 (Balkon)',
    'VIP Room / Lounge',
    'Bar Counter'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Nomor meja wajib diisi');
      return;
    }

    const selectedArea = area === 'Lainnya' ? (customArea.trim() || 'Area Indoor') : area;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pos/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity, 10) || 4,
          area: selectedArea
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menambahkan meja');
      }

      // Reset form
      setTableNumber('');
      setCapacity('4');
      setArea('Area Indoor');
      setCustomArea('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menambahkan meja');
    } finally {
      setLoading(false);
    }
  };

  const quickPresets = ['Meja 13', 'Meja 14', 'Outdoor 01', 'Outdoor 02', 'VIP 01', 'Bar 01'];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#1A3A5C] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Tambah Meja Baru (POS)</h3>
              <p className="text-[11px] text-slate-300">Buat meja cafe baru langsung dari kasir</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Nomor / Nama Meja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Contoh: Meja 13 atau Outdoor 05"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C] transition-all"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Preset:</span>
              {quickPresets.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setTableNumber(preset)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Kapasitas Kursi (Orang)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['2', '4', '6', '8', '10'].map(cap => (
                <button
                  type="button"
                  key={cap}
                  onClick={() => setCapacity(cap)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    capacity === cap
                      ? 'bg-[#1A3A5C] text-white border-[#1A3A5C] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cap} Org
                </button>
              ))}
            </div>
          </div>

          {/* Area / Zona */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Zona / Area Penempatan
            </label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
            >
              {standardAreas.map(ar => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
              <option value="Lainnya">+ Tulis Zona Kustom...</option>
            </select>

            {area === 'Lainnya' && (
              <input
                type="text"
                value={customArea}
                onChange={e => setCustomArea(e.target.value)}
                placeholder="Nama zona kustom..."
                className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
              />
            )}
          </div>

          {/* QR Code Auto-generation note */}
          <div className="p-2.5 bg-sky-50 border border-sky-200/70 rounded-xl text-[11px] text-sky-800 flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
            <span>
              Kode QR Self-Order unik untuk meja ini akan <strong>otomatis dibuat</strong> dan langsung siap dicetak via tombol Stand QR.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Menyimpan...' : 'Simpan & Tambah Meja'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
