import React, { useState, useEffect } from 'react';
import { MenuItem } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatRupiah } from '../../utils/formatters.js';
import { Plus, Edit2, Trash2, Search, UtensilsCrossed, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Coffee',
    price: 25000,
    stock_status: 'tersedia' as 'tersedia' | 'habis',
    photo_url: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.menu);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Coffee',
      price: 25000,
      stock_status: 'tersedia',
      photo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      stock_status: item.stock_status,
      photo_url: item.photo_url,
      description: item.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama menu wajib diisi');
      return;
    }
    if (formData.price <= 0) {
      setFormError('Harga harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const url = editingItem
        ? `/api/admin/menu/${editingItem.item_id}`
        : '/api/admin/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await fetchMenu();
      } else {
        setFormError(data.error || 'Gagal menyimpan menu');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Hapus menu "${item.name}" dari daftar?`)) return;

    try {
      const res = await fetch(`/api/admin/menu/${item.item_id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu();
      } else {
        alert(data.error || 'Gagal menghapus menu');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus menu');
    }
  };

  const categories = ['Semua', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Search, Filter & Add Button */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
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

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMenu}
            className="flex items-center gap-1 text-xs"
            title="Segarkan data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs whitespace-nowrap font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </Button>
        </div>
      </div>

      {/* Menu Table with Responsive Horizontal Scroll */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Menu & Foto</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4">Status Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada menu yang sesuai</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isTersedia = item.stock_status === 'tersedia';
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(item.price)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={isTersedia ? 'success' : 'danger'} size="sm">
                          {isTersedia ? 'Tersedia' : 'Habis'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-[#1A3A5C] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Edit Menu"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Add / Edit Menu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Informasi Menu' : 'Tambah Menu Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nama Menu *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Caramel Macchiato"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#1A3A5C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#1A3A5C]"
              >
                <option value="Coffee">Coffee</option>
                <option value="Non-Coffee">Non-Coffee</option>
                <option value="Food & Meals">Food & Meals</option>
                <option value="Pastry & Bakery">Pastry & Bakery</option>
                <option value="Snack & Bites">Snack & Bites</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Harga (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                step={500}
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#1A3A5C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Status Ketersediaan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock_status: 'tersedia' })}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  formData.stock_status === 'tersedia'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                ✓ Tersedia
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock_status: 'habis' })}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  formData.stock_status === 'habis'
                    ? 'bg-red-50 border-red-500 text-red-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                ✕ Habis
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">URL Foto Menu</label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#1A3A5C]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi bahan atau rasa menu..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#1A3A5C]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="font-bold"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Menu' : 'Simpan Menu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
