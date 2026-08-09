import React, { useState, useEffect } from 'react';
import { MenuItem, Table, Session, Order, CalculationBreakdown } from '../../types/index.js';
import { formatRupiah, formatTime } from '../../utils/formatters.js';
import { useSocket } from '../../hooks/useSocket.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChefHat,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const CustomerMenu: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [placedOrders, setPlacedOrders] = useState<Order[]>([]);
  const [calculation, setCalculation] = useState<CalculationBreakdown | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [cafeProfile, setCafeProfile] = useState<any>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State: { [itemId]: { quantity: number, notes: string } }
  const [cart, setCart] = useState<{ [itemId: number]: { quantity: number; notes: string } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const socket = useSocket();

  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [activeSessionsList, setActiveSessionsList] = useState<Session[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Parse session_id from URL
  useEffect(() => {
    fetch('/api/cafe-profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) setCafeProfile(data.profile);
      })
      .catch(() => {});

    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session_id');
    if (sid) {
      setSessionId(sid);
    } else {
      loadAvailableTables();
    }
  }, []);

  const loadAvailableTables = async () => {
    try {
      setLoadingTables(true);
      const [tRes, sRes] = await Promise.all([
        fetch('/api/pos/tables'),
        fetch('/api/pos/sessions/active')
      ]);
      const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);
      if (tData.success) setTablesList(tData.tables || []);
      if (sData.success) setActiveSessionsList(sData.sessions || []);
    } catch (err) {
      console.error('Error fetching tables list:', err);
    } finally {
      setLoadingTables(false);
      setLoading(false);
    }
  };

  const handleSelectTableSession = (sid: string) => {
    setErrorMsg('');
    setSessionId(sid);
    const url = new URL(window.location.href);
    url.searchParams.set('session_id', sid);
    window.history.pushState({}, '', url.toString());
  };

  const handleOpenNewSession = async (tableId: number) => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId })
      });
      const data = await res.json();
      if (data.success && data.session) {
        handleSelectTableSession(data.session.session_id);
      } else {
        alert(data.error || 'Gagal membuka sesi');
        setLoading(false);
      }
    } catch (err) {
      alert('Gagal membuka sesi meja');
      setLoading(false);
    }
  };

  // Fetch Session and Menu data
  const fetchMenuData = async (sid: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customer/session?session_id=${sid}`);
      const data = await res.json();

      if (data.success) {
        setSession(data.session);
        setTable(data.table);
        setMenuItems(data.menu);
        setPlacedOrders(data.orders || []);
        setCalculation(data.calculation || null);
        setSettings(data.settings || null);
      } else {
        setErrorMsg(data.error || 'Sesi meja tidak valid atau telah ditutup.');
      }
    } catch (err) {
      setErrorMsg('Gagal memuat menu. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchMenuData(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleStockChanged = (data: any) => {
      setMenuItems(prev =>
        prev.map(item =>
          item.item_id === data.item_id ? { ...item, stock_status: data.stock_status } : item
        )
      );
    };

    const handleSessionClosed = (data: any) => {
      if (data.session_id === sessionId) {
        setSession(prev => (prev ? { ...prev, status: 'ditutup' } : null));
        setErrorMsg('Sesi meja ini telah ditutup oleh kasir.');
      }
    };

    const handleNewOrder = (data: any) => {
      if (data.session_id === sessionId) {
        fetchMenuData(sessionId);
      }
    };

    const handleOrderStatusUpdated = (data: any) => {
      if (data.session_id === sessionId) {
        fetchMenuData(sessionId);
      }
    };

    socket.on('stock_changed', handleStockChanged);
    socket.on('session_closed', handleSessionClosed);
    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleOrderStatusUpdated);

    return () => {
      socket.off('stock_changed', handleStockChanged);
      socket.off('session_closed', handleSessionClosed);
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleOrderStatusUpdated);
    };
  }, [socket, sessionId]);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    if (item.stock_status === 'habis') return;

    setCart(prev => {
      const existing = prev[item.item_id] || { quantity: 0, notes: '' };
      return {
        ...prev,
        [item.item_id]: { ...existing, quantity: existing.quantity + 1 }
      };
    });
  };

  const handleDecreaseQuantity = (itemId: number) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const handleUpdateNotes = (itemId: number, notes: string) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, notes }
      };
    });
  };

  // Cart item calculation
  const cartItemsList = (Object.entries(cart) as [string, { quantity: number; notes: string }][])
    .map(([idStr, val]) => {
      const item = menuItems.find(m => m.item_id === Number(idStr));
      return {
        item,
        quantity: val.quantity,
        notes: val.notes,
        subtotal: (item?.price || 0) * val.quantity
      };
    })
    .filter((c): c is { item: MenuItem; quantity: number; notes: string; subtotal: number } => c.item !== undefined);

  const cartSubtotal = cartItemsList.reduce((acc, curr) => acc + curr.subtotal, 0);
  const cartTotalQty = cartItemsList.reduce((acc, curr) => acc + curr.quantity, 0);

  // Projected tax and service for cart
  const serviceChargeRate = settings?.is_service_active ? (settings?.service_charge_percentage || 0) : 0;
  const taxRate = settings?.is_tax_active ? (settings?.tax_percentage || 0) : 0;

  const cartServiceCharge = Math.round(cartSubtotal * (serviceChargeRate / 100));
  const cartTax = Math.round((cartSubtotal + cartServiceCharge) * (taxRate / 100));
  const cartGrandTotal = cartSubtotal + cartServiceCharge + cartTax;

  const handleSubmitOrder = async () => {
    if (!sessionId || cartItemsList.length === 0) return;

    setSubmittingOrder(true);
    setErrorMsg('');

    try {
      const itemsPayload = cartItemsList.map(c => ({
        item_id: c.item!.item_id,
        quantity: c.quantity,
        notes: c.notes
      }));

      const res = await fetch('/api/customer/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          items: itemsPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setCart({});
        setIsCartOpen(false);
        setOrderSuccessMsg(true);
        setTimeout(() => setOrderSuccessMsg(false), 5000);
        await fetchMenuData(sessionId);
      } else {
        setErrorMsg(data.error || 'Gagal mengirim pesanan');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengirim pesanan');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filter Categories
  const categories = ['Semua', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-4 border-[#1A3A5C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-600">Memuat Menu Cafe...</p>
      </div>
    );
  }

  // Table selector / Session activate screen if no session or closed
  if (!sessionId || errorMsg || (session && session.status !== 'aktif')) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans max-w-md mx-auto">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-[#1A3A5C] text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md">
            ☕
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Selamat Datang di {cafeProfile?.cafe_name || 'BREW & BYTE'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {cafeProfile?.tagline || 'Pilih meja Anda untuk mulai memesan makanan & minuman'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-left space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Meja Cafe</h4>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {tablesList.map(tbl => {
                const activeSess = activeSessionsList.find(s => s.table_id === tbl.table_id && s.status === 'aktif');
                return (
                  <button
                    key={tbl.table_id}
                    onClick={() => {
                      if (activeSess) {
                        handleSelectTableSession(activeSess.session_id);
                      } else {
                        handleOpenNewSession(tbl.table_id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      activeSess
                        ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{tbl.table_number}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeSess ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5">
                      {activeSess ? 'Sesi Aktif → Masuk' : 'Mulai Pesan'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-4 text-xs text-slate-500">
            <a href="/pos" className="hover:text-[#1A3A5C] font-semibold underline">
              Buka Layar Kasir POS
            </a>
            <span>•</span>
            <a href="/admin" className="hover:text-[#1A3A5C] font-semibold underline">
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto relative shadow-2xl pb-24 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#1A3A5C] text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-base text-white">
              ☕
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight leading-none truncate max-w-[150px]">
                {cafeProfile?.cafe_name || 'BREW & BYTE'}
              </h1>
              <p className="text-[10px] text-slate-300 truncate max-w-[150px]">
                {cafeProfile?.tagline || 'Self-Ordering Web Menu'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold flex items-center gap-1">
              <span>{table?.table_number || 'Meja'}</span>
            </div>

            {placedOrders.length > 0 && (
              <button
                onClick={() => setIsOrderStatusOpen(true)}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{placedOrders.length} Pesanan</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kopi, makanan, snack..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-slate-300 focus:placeholder-slate-400 text-xs rounded-xl border border-white/10 focus:border-white focus:outline-none transition-all"
          />
        </div>
      </header>

      {/* Categories Horizontal Scroller */}
      <div className="sticky top-[105px] z-20 bg-white border-b border-slate-200 px-3 py-2.5 flex space-x-1.5 overflow-x-auto no-scrollbar shadow-2xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#1A3A5C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Success Notification */}
      {orderSuccessMsg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pesanan Anda berhasil dikirim ke Barista & Dapur!</span>
        </div>
      )}

      {/* Menu Cards List */}
      <div className="p-4 space-y-3">
        {filteredMenuItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Tidak ada menu yang sesuai dalam kategori ini
          </div>
        ) : (
          filteredMenuItems.map(item => {
            const isHabis = item.stock_status === 'habis';
            const qty = cart[item.item_id]?.quantity || 0;

            return (
              <div
                key={item.item_id}
                className={`bg-white rounded-xl border p-3 flex space-x-3 transition-all ${
                  isHabis
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Menu Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isHabis && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded">
                        Habis
                      </span>
                    </div>
                  )}
                </div>

                {/* Info & Action */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {item.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#1A3A5C]">
                      {formatRupiah(item.price)}
                    </span>

                    {isHabis ? (
                      <span className="text-[11px] text-red-500 font-bold">Stok Habis</span>
                    ) : qty > 0 ? (
                      <div className="flex items-center space-x-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          onClick={() => handleDecreaseQuantity(item.item_id)}
                          className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 px-1">{qty}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-6 h-6 rounded bg-[#1A3A5C] text-white hover:bg-[#152e4a] flex items-center justify-center font-bold text-xs shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#152e4a] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartTotalQty > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#1A3A5C] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between hover:bg-[#152e4a] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                {cartTotalQty}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">{cartTotalQty} Item Siap Dipesan</p>
                <p className="text-[11px] text-slate-300">{formatRupiah(cartSubtotal)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-bold bg-white text-[#1A3A5C] px-3 py-1.5 rounded-xl shadow-xs">
              <span>Lihat Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end max-w-md mx-auto">
          <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Keranjang Pesanan</h3>
                <p className="text-xs text-slate-500">{table?.table_number} • Self Order</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-slate-100">
              {cartItemsList.map(({ item, quantity, notes }) => (
                <div key={item!.item_id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-bold text-slate-900">{item!.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{formatRupiah(item!.price)}</p>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => handleDecreaseQuantity(item!.item_id)}
                        className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 px-1">{quantity}</span>
                      <button
                        onClick={() => handleAddToCart(item!)}
                        className="w-6 h-6 rounded bg-[#1A3A5C] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Input */}
                  <input
                    type="text"
                    placeholder="Catatan (misal: Less ice, less sugar)..."
                    value={notes}
                    onChange={e => handleUpdateNotes(item!.item_id, e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
                  />
                </div>
              ))}
            </div>

            {/* Order Price Breakdown */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Pesanan:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(cartSubtotal)}</span>
              </div>
              {serviceChargeRate > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({serviceChargeRate}%):</span>
                  <span>{formatRupiah(cartServiceCharge)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span>PB1 / Pajak Resto ({taxRate}%):</span>
                  <span>{formatRupiah(cartTax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-[#1A3A5C]">
                <span>Total Estimasi:</span>
                <span className="text-base font-extrabold">{formatRupiah(cartGrandTotal)}</span>
              </div>
            </div>

            {/* Order Submit Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={submittingOrder || cartItemsList.length === 0}
                onClick={handleSubmitOrder}
              >
                {submittingOrder ? 'Mengirim ke Dapur...' : 'Kirim Pesanan ke Dapur'}
              </Button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Pembayaran dilakukan di Kasir saat selesai bersantap.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {isOrderStatusOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end max-w-md mx-auto">
          <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Status Pesanan Meja</h3>
                <p className="text-xs text-slate-500">{table?.table_number} • Riwayat Pesanan Sesi Ini</p>
              </div>
              <button
                onClick={() => setIsOrderStatusOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-slate-100">
              {placedOrders.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Belum ada pesanan yang dibuat
                </div>
              ) : (
                placedOrders.map((order, idx) => (
                  <div key={order.order_id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">
                        Pesanan #{order.order_id} ({formatTime(order.created_at)})
                      </span>
                      <Badge
                        variant={
                          order.status === 'selesai'
                            ? 'success'
                            : order.status === 'diproses'
                            ? 'info'
                            : order.status === 'dibatalkan'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {order.status === 'menunggu' && 'Menunggu Dapur'}
                        {order.status === 'diproses' && 'Sedang Diproses'}
                        {order.status === 'selesai' && 'Selesai Diantar'}
                        {order.status === 'dibatalkan' && 'Dibatalkan'}
                      </Badge>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2 space-y-1 text-xs">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-slate-700">
                          <span>
                            <strong className="text-[#1A3A5C]">{it.quantity}x</strong> {it.item_name}
                            {it.notes && <span className="text-[10px] text-amber-700 block italic">({it.notes})</span>}
                          </span>
                          <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {calculation && (
              <div className="pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Tagihan Meja Sementara:</span>
                  <span className="font-bold text-[#1A3A5C] text-sm">{formatRupiah(calculation.total)}</span>
                </div>
              </div>
            )}

            <div className="pt-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setIsOrderStatusOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
