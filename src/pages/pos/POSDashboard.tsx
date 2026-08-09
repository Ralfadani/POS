import React, { useState, useEffect } from 'react';
import { POSLayout } from '../../components/layout/POSLayout.js';
import { Table, Session, Order, MenuItem, CalculationBreakdown } from '../../types/index.js';
import { formatRupiah, formatTime } from '../../utils/formatters.js';
import { playOrderChime } from '../../utils/audio.js';
import { useSocket } from '../../hooks/useSocket.js';
import { POSSessionDetail } from './POSSessionDetail.js';
import { POSOpenSessionModal } from './POSOpenSessionModal.js';
import { POSCloseSessionModal } from './POSCloseSessionModal.js';
import { POSStockModal } from './POSStockModal.js';
import { POSManualOrderModal } from './POSManualOrderModal.js';
import { POSSidebarOverview } from './POSSidebarOverview.js';
import { POSTableAddModal } from './POSTableAddModal.js';
import { POSCloseWithoutPaymentModal } from './POSCloseWithoutPaymentModal.js';
import { POSTransactions } from './POSTransactions.js';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  ShoppingBag,
  Clock,
  PlusCircle,
  Plus,
  PackageOpen,
  Bell,
  RefreshCw,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Grid
} from 'lucide-react';

export const POSDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tables' | 'stock' | 'transactions'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedSessionOrders, setSelectedSessionOrders] = useState<Order[]>([]);
  const [selectedSessionCalc, setSelectedSessionCalc] = useState<CalculationBreakdown | null>(null);

  // Table grid filtering
  const [tableFilter, setTableFilter] = useState<'all' | 'terisi' | 'kosong'>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [sessionToCloseWithoutPayment, setSessionToCloseWithoutPayment] = useState<Session | null>(null);

  // Realtime notification alerts
  const [newOrderAlerts, setNewOrderAlerts] = useState<Array<{ id: number; message: string; table: string; time: string }>>([]);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  // Fetch initial data
  const fetchAllData = async () => {
    try {
      const [tablesRes, sessionsRes, menuRes] = await Promise.all([
        fetch('/api/pos/tables'),
        fetch('/api/pos/sessions/active'),
        fetch('/api/pos/menu')
      ]);

      const [tablesData, sessionsData, menuData] = await Promise.all([
        tablesRes.json(),
        sessionsRes.json(),
        menuRes.json()
      ]);

      if (tablesData.success) setTables(tablesData.tables);
      if (sessionsData.success) setSessions(sessionsData.sessions);
      if (menuData.success) setMenuItems(menuData.menu);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch active session detail when selectedTableId changes
  const activeSessionForSelectedTable = sessions.find(
    s => s.table_id === selectedTableId && s.status === 'aktif'
  );

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/pos/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSessionOrders(data.orders || []);
        setSelectedSessionCalc(data.calculation || null);
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
    }
  };

  useEffect(() => {
    if (activeSessionForSelectedTable) {
      fetchSessionDetails(activeSessionForSelectedTable.session_id);
    } else {
      setSelectedSessionOrders([]);
      setSelectedSessionCalc(null);
    }
  }, [selectedTableId, sessions]);

  // Socket Realtime Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
      playOrderChime();

      const alertItem = {
        id: Date.now(),
        message: `Pesanan Baru (${data.channel === 'self_order' ? 'Self Order HP' : 'Kasir POS'}) Meja ${data.table_number || ''}`,
        table: data.table_number || '',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setNewOrderAlerts(prev => [alertItem, ...prev].slice(0, 5));

      fetchAllData();
      if (activeSessionForSelectedTable && activeSessionForSelectedTable.session_id === data.session_id) {
        fetchSessionDetails(data.session_id);
      }
    };

    const handleSessionUpdated = () => fetchAllData();
    const handleTablesUpdated = () => fetchAllData();
    const handleStockChanged = (data: any) => {
      setMenuItems(prev =>
        prev.map(item =>
          item.item_id === data.item_id ? { ...item, stock_status: data.stock_status } : item
        )
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('session_updated', handleSessionUpdated);
    socket.on('tables_updated', handleTablesUpdated);
    socket.on('stock_changed', handleStockChanged);
    socket.on('order_status_updated', () => {
      fetchAllData();
      if (activeSessionForSelectedTable) {
        fetchSessionDetails(activeSessionForSelectedTable.session_id);
      }
    });

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('session_updated', handleSessionUpdated);
      socket.off('tables_updated', handleTablesUpdated);
      socket.off('stock_changed', handleStockChanged);
    };
  }, [socket, activeSessionForSelectedTable]);

  const handleOpenSession = async (tableId: number) => {
    try {
      const res = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        setSelectedTableId(tableId);
        setIsMobileSidebarOpen(true);
      } else {
        alert(data.error || 'Gagal membuka sesi');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat membuka sesi meja');
    }
  };

  const handleCloseSession = async (paymentData: any) => {
    if (!activeSessionForSelectedTable) return;

    const res = await fetch(`/api/pos/sessions/${activeSessionForSelectedTable.session_id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menutup sesi');
    }

    await fetchAllData();
    setIsMobileSidebarOpen(false);
    return data;
  };

  const handleCloseSessionWithoutPayment = async (sessionId: string, reason?: string) => {
    try {
      const res = await fetch(`/api/pos/sessions/${sessionId}/close-without-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: user?.user_id || 2,
          reason: reason || 'Customer batal order / meja dikosongkan langsung'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menutup sesi tanpa pembayaran');
      }

      // Optimistically update tables and sessions so table immediately becomes 'kosong'
      const targetSession = sessions.find(s => s.session_id === sessionId);
      if (targetSession) {
        setTables(prev =>
          prev.map(t =>
            t.table_id === targetSession.table_id
              ? { ...t, status: 'kosong', active_session_id: undefined, current_order_count: 0, current_bill_total: 0 }
              : t
          )
        );
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      }
      setSelectedSessionOrders([]);
      setSelectedSessionCalc(null);

      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error('Error closing session:', err);
      throw err;
    }
  };

  const handleToggleStock = async (itemId: number, newStatus: 'tersedia' | 'habis', reason?: string) => {
    const res = await fetch('/api/pos/menu/stock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        stock_status: newStatus,
        reason: reason || 'Diubah dari POS Kasir'
      })
    });
    const data = await res.json();
    if (data.success) {
      setMenuItems(prev =>
        prev.map(it => (it.item_id === itemId ? { ...it, stock_status: newStatus } : it))
      );
    }
  };

  const handleManualOrderSubmit = async (items: Array<{ item_id: number; quantity: number; notes?: string }>) => {
    let currentSessionId = activeSessionForSelectedTable?.session_id;

    // If table has no active session, auto-open one
    if (!currentSessionId) {
      const openRes = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: selectedTableId })
      });
      const openData = await openRes.json();
      if (openData.success) {
        currentSessionId = openData.session.session_id;
        await fetchAllData();
      } else {
        throw new Error('Gagal membuka sesi otomatis');
      }
    }

    const res = await fetch('/api/pos/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: currentSessionId,
        items
      })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal mengirim pesanan');
    }

    await fetchAllData();
    if (currentSessionId) {
      await fetchSessionDetails(currentSessionId);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan') => {
    const res = await fetch(`/api/pos/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      if (activeSessionForSelectedTable) {
        fetchSessionDetails(activeSessionForSelectedTable.session_id);
      }
    }
  };

  const selectedTable = selectedTableId ? (tables.find(t => t.table_id === selectedTableId) || null) : null;

  // Filtered tables list
  const filteredTables = tables.filter(t => {
    const isOccupied = t.status === 'terisi';
    if (tableFilter === 'terisi' && !isOccupied) return false;
    if (tableFilter === 'kosong' && isOccupied) return false;
    return true;
  });

  const occupiedCount = tables.filter(t => t.status === 'terisi').length;
  const emptyCount = tables.length - occupiedCount;

  return (
    <POSLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      newOrderAlertCount={newOrderAlerts.length}
      onClearOrderAlerts={() => setNewOrderAlerts([])}
    >
      {/* Toast Alert Banner for New Orders */}
      {newOrderAlerts.length > 0 && (
        <div className="mb-3 bg-[#1A3A5C] text-white p-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-white/10 rounded-lg">
              <Bell className="w-4 h-4 text-amber-300" />
            </span>
            <div>
              <p className="text-xs font-bold">{newOrderAlerts[0].message}</p>
              <p className="text-[11px] text-slate-300">Pukul {newOrderAlerts[0].time} • Struk otomatis siap dicetak</p>
            </div>
          </div>
          <button
            onClick={() => setNewOrderAlerts([])}
            className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main View: Split Screen Layout (Left: Tables, Right: Pinned Sidebar Panel) */}
      {activeTab === 'tables' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 h-full min-h-0 overflow-hidden relative">
          {/* Left: Tables Grid Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs overflow-hidden">
            {/* Top Bar: Tambah Meja Button on Left, Filter on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 shrink-0">
              {/* Tombol Tambah Meja */}
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(true)}
                className="px-3.5 py-2 bg-[#1A3A5C] hover:bg-[#152e4a] text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                Tambah Meja
              </button>

              {/* Filter Chips */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all text-xs ${
                    tableFilter === 'all' ? 'bg-white text-[#1A3A5C] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({tables.length})
                </button>
                <button
                  onClick={() => setTableFilter('terisi')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 text-xs ${
                    tableFilter === 'terisi' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terisi ({occupiedCount})
                </button>
                <button
                  onClick={() => setTableFilter('kosong')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 text-xs ${
                    tableFilter === 'kosong' ? 'bg-white text-slate-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  Kosong ({emptyCount})
                </button>
              </div>
            </div>

            {/* Tables Cards Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pr-1 pb-1">
              {filteredTables.map(table => {
                const session = sessions.find(s => s.table_id === table.table_id && s.status === 'aktif');
                const isSelected = table.table_id === selectedTableId;
                const isOccupied = table.status === 'terisi';

                return (
                  <div
                    key={table.table_id}
                    onClick={() => {
                      setSelectedTableId(table.table_id);
                      setIsMobileSidebarOpen(true);
                    }}
                    className={`relative p-3 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'border-[#1A3A5C] bg-sky-50/40 ring-2 ring-[#1A3A5C]/20 shadow-md transform -translate-y-0.5'
                        : isOccupied
                        ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 block leading-tight">
                          {table.table_number}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          {table.capacity} Orang
                        </span>
                      </div>

                      <Badge variant={isOccupied ? 'success' : 'neutral'} size="sm">
                        {isOccupied ? 'Terisi' : 'Kosong'}
                      </Badge>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      {isOccupied && session ? (
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatTime(session.start_time)}
                            </span>
                            <span className="font-bold text-[#1A3A5C]">
                              {session.orders_count || 0} Order
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-[10px] text-slate-400">Total Tagihan:</span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {formatRupiah(session.total_amount || 0)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 py-0.5">
                          <span>Siap Pakai</span>
                          <span className="text-[10px] text-slate-400 font-medium">Buka Sesi →</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simple Clean Status Bar */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                Total <strong>{tables.length}</strong> Meja • Terisi <strong>{occupiedCount}</strong> • Kosong <strong>{emptyCount}</strong>
              </span>
            </div>
          </div>

          {/* Right: Dedicated Table Detail Side Panel (Always side-by-side on desktop, slide-over on mobile) */}
          <div
            className={`
              fixed lg:static inset-y-0 right-0 z-50 lg:z-auto
              w-full sm:w-[400px] lg:w-[380px] xl:w-[420px] 2xl:w-[450px] shrink-0 h-full min-h-0
              transform transition-transform duration-300 ease-in-out
              ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
          >
            {/* Backdrop for mobile drawer */}
            {isMobileSidebarOpen && (
              <div
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs lg:hidden -z-10 transition-opacity"
              />
            )}

            {selectedTable ? (
              <POSSessionDetail
                table={selectedTable}
                session={activeSessionForSelectedTable || null}
                orders={selectedSessionOrders}
                calculation={selectedSessionCalc}
                onOpenManualOrder={() => setIsManualOrderModalOpen(true)}
                onOpenCloseSession={() => setIsCloseSessionModalOpen(true)}
                onCloseSessionWithoutPayment={handleCloseSessionWithoutPayment}
                onOpenQRModal={() => setIsQRModalOpen(true)}
                onOpenSession={handleOpenSession}
                onCloseSidebar={() => {
                  setSelectedTableId(null);
                  setIsMobileSidebarOpen(false);
                }}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            ) : (
              <POSSidebarOverview
                tables={tables}
                sessions={sessions}
                onSelectTable={(tableId) => {
                  setSelectedTableId(tableId);
                  setIsMobileSidebarOpen(true);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Transactions History Tab View */}
      {activeTab === 'transactions' && (
        <POSTransactions />
      )}

      {/* Stock Tab View */}
      {activeTab === 'stock' && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 overflow-y-auto shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Kelola Ketersediaan Stok Menu</h2>
              <p className="text-xs text-slate-500">
                Kasir dapat langsung mengubah status menu (Tersedia / Habis) secara real-time
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              className="flex items-center gap-1.5 text-xs w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map(item => {
              const isTersedia = item.stock_status === 'tersedia';
              return (
                <div
                  key={item.item_id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">{item.category} • {formatRupiah(item.price)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStock(item.item_id, isTersedia ? 'habis' : 'tersedia')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isTersedia
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-emerald-300'
                        : 'bg-red-100 text-red-800 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-red-300'
                    }`}
                  >
                    {isTersedia ? '✓ Tersedia' : '✕ Habis'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedTable && (
        <POSOpenSessionModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          table={selectedTable}
          session={activeSessionForSelectedTable || null}
          onOpenSession={handleOpenSession}
        />
      )}

      {selectedTable && activeSessionForSelectedTable && (
        <POSCloseSessionModal
          isOpen={isCloseSessionModalOpen}
          onClose={() => setIsCloseSessionModalOpen(false)}
          tableNumber={selectedTable.table_number}
          sessionId={activeSessionForSelectedTable.session_id}
          calculation={selectedSessionCalc}
          orders={selectedSessionOrders}
          onSuccessClose={handleCloseSession}
        />
      )}

      <POSStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        menuItems={menuItems}
        onToggleStock={handleToggleStock}
      />

      {(selectedTable || (tables.length > 0 ? tables[0] : null)) && (
        <POSManualOrderModal
          isOpen={isManualOrderModalOpen}
          onClose={() => setIsManualOrderModalOpen(false)}
          table={selectedTable || tables[0]}
          sessionId={activeSessionForSelectedTable?.session_id || null}
          menuItems={menuItems}
          onSubmitOrder={handleManualOrderSubmit}
        />
      )}

      {/* POS Quick Table Add Modal */}
      <POSTableAddModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onSuccess={fetchAllData}
      />

      {/* POS Close Session Without Payment Modal (from Bills tab) */}
      {sessionToCloseWithoutPayment && (
        <POSCloseWithoutPaymentModal
          isOpen={sessionToCloseWithoutPayment !== null}
          tableNumber={sessionToCloseWithoutPayment.table_number || `Meja #${sessionToCloseWithoutPayment.table_id}`}
          sessionId={sessionToCloseWithoutPayment.session_id}
          totalBill={sessionToCloseWithoutPayment.total_amount || 0}
          activeOrdersCount={sessionToCloseWithoutPayment.orders_count || 0}
          onClose={() => setSessionToCloseWithoutPayment(null)}
          onConfirm={async (sId, reason) => {
            await handleCloseSessionWithoutPayment(sId, reason);
            setSessionToCloseWithoutPayment(null);
          }}
        />
      )}
    </POSLayout>
  );
};
