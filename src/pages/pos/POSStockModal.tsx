import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { MenuItem } from '../../types/index.js';
import { formatRupiah } from '../../utils/formatters.js';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface POSStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onToggleStock: (itemId: number, newStatus: 'tersedia' | 'habis', reason?: string) => Promise<void>;
}

export const POSStockModal: React.FC<POSStockModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onToggleStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const categories = ['Semua', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleToggle = async (item: MenuItem) => {
    const nextStatus = item.stock_status === 'tersedia' ? 'habis' : 'tersedia';
    const reason = nextStatus === 'habis' ? 'Stok habis di dapur/bar' : 'Restock item baru';
    setUpdatingId(item.item_id);
    try {
      await onToggleStock(item.item_id, nextStatus, reason);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Ketersediaan Stok Menu"
      subtitle="Ubah status menu menjadi Tersedia / Habis secara langsung tanpa persetujuan Admin"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari menu minuman / makanan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#1A3A5C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada menu yang sesuai dengan pencarian
            </div>
          ) : (
            filteredItems.map(item => {
              const isTersedia = item.stock_status === 'tersedia';
              const isUpdating = updatingId === item.item_id;

              return (
                <div
                  key={item.item_id}
                  className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-400">({item.category})</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        {formatRupiah(item.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <Badge variant={isTersedia ? 'success' : 'danger'} size="sm">
                      {isTersedia ? 'Tersedia' : 'Habis'}
                    </Badge>

                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isUpdating}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isTersedia
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {isTersedia ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Set Habis
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Set Tersedia
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};
