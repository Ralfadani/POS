import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { MenuItem, Table, OrderItem } from '../../types/index.js';
import { formatRupiah } from '../../utils/formatters.js';
import { Plus, Minus, Search, Trash2, ShoppingBag } from 'lucide-react';

interface POSManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  sessionId: string | null;
  menuItems: MenuItem[];
  onSubmitOrder: (items: Array<{ item_id: number; quantity: number; notes?: string }>) => Promise<void>;
}

export const POSManualOrderModal: React.FC<POSManualOrderModalProps> = ({
  isOpen,
  onClose,
  table,
  sessionId,
  menuItems,
  onSubmitOrder
}) => {
  const [selectedItems, setSelectedItems] = useState<{ [itemId: number]: { quantity: number; notes: string } }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!table) return null;

  const categories = ['Semua', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleAddItem = (item: MenuItem) => {
    if (item.stock_status === 'habis') return;

    setSelectedItems(prev => {
      const current = prev[item.item_id] || { quantity: 0, notes: '' };
      return {
        ...prev,
        [item.item_id]: { ...current, quantity: current.quantity + 1 }
      };
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...current, quantity: current.quantity - 1 }
      };
    });
  };

  const handleUpdateNotes = (itemId: number, notes: string) => {
    setSelectedItems(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, notes }
      };
    });
  };

  const selectedList = (Object.entries(selectedItems) as [string, { quantity: number; notes: string }][])
    .map(([idStr, val]) => {
      const item = menuItems.find(m => m.item_id === Number(idStr));
      return {
        item,
        quantity: val.quantity,
        notes: val.notes,
        subtotal: (item?.price || 0) * val.quantity
      };
    })
    .filter((s): s is { item: MenuItem; quantity: number; notes: string; subtotal: number } => s.item !== undefined);

  const totalAmount = selectedList.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = async () => {
    if (selectedList.length === 0) {
      setError('Pilih minimal 1 menu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = selectedList.map(s => ({
        item_id: s.item!.item_id,
        quantity: s.quantity,
        notes: s.notes
      }));

      await onSubmitOrder(payload);
      setSelectedItems({});
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Input Pesanan Manual POS - ${table.table_number}`}
      subtitle="Tambah pesanan langsung dari meja kasir ke Open Bill aktif"
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-h-[75vh]">
        {/* Left Column: Menu Selector (7 cols on desktop/tablet) */}
        <div className="md:col-span-7 flex flex-col space-y-3 md:border-r md:border-slate-200 md:pr-4">
          {/* Search bar with large touch area */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#1A3A5C] outline-hidden transition-colors"
            />
          </div>

          {/* Category Chips - Large Touch Targets */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar select-none">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1A3A5C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
            {filteredItems.map(item => {
              const isHabis = item.stock_status === 'habis';
              const qty = selectedItems[item.item_id]?.quantity || 0;

              return (
                <div
                  key={item.item_id}
                  onClick={() => !isHabis && handleAddItem(item)}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                    isHabis
                      ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : qty > 0
                      ? 'bg-sky-50/50 border-[#1A3A5C] hover:bg-sky-50 cursor-pointer shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-[#1A3A5C] cursor-pointer hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-md object-cover bg-slate-100"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500">{formatRupiah(item.price)}</p>
                    </div>
                  </div>

                  {isHabis ? (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                      Habis
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      {qty > 0 && (
                        <span className="w-5 h-5 bg-[#1A3A5C] text-white rounded-full text-xs font-bold flex items-center justify-center">
                          {qty}
                        </span>
                      )}
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-[#1A3A5C] hover:bg-slate-100 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Cart (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#1A3A5C]" />
                Daftar Pesanan ({selectedList.reduce((a, b) => a + b.quantity, 0)} item)
              </h4>
              {selectedList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems({})}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1 divide-y divide-slate-100">
              {selectedList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Belum ada item dipilih
                </div>
              ) : (
                selectedList.map(({ item, quantity, notes }) => (
                  <div key={item!.item_id} className="pt-2 pb-1 space-y-1">
                    <div className="flex justify-between items-start text-xs">
                      <div className="font-semibold text-slate-800">{item!.name}</div>
                      <div className="font-bold text-slate-900">{formatRupiah(item!.price * quantity)}</div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Catatan (opsional)..."
                        value={notes}
                        onChange={e => handleUpdateNotes(item!.item_id, e.target.value)}
                        className="flex-1 text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:bg-white focus:border-[#1A3A5C] outline-hidden"
                      />
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item!.item_id)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item!)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Total Pesanan:</span>
              <span className="text-base font-bold text-[#1A3A5C]">{formatRupiah(totalAmount)}</span>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={loading || selectedList.length === 0}
              onClick={handleSubmit}
            >
              {loading ? 'Menambahkan...' : 'Kirim Pesanan Manual ke Dapur'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
