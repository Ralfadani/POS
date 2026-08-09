import React, { useState, useEffect } from 'react';
import { Table, Session } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatTime, formatRupiah } from '../../utils/formatters.js';
import {
  Grid,
  QrCode,
  Clock,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Trash2,
  Users,
  MapPin,
  Printer,
  X,
  Check,
  AlertCircle,
  SlidersHorizontal,
  Coffee
} from 'lucide-react';
import { printElementById } from '../../utils/printUtils.js';
import { POSOpenSessionModal } from '../pos/POSOpenSessionModal.js';
import { POSTableAddModal } from '../pos/POSTableAddModal.js';

export const AdminTables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  
  // Stand QR Printout Modal
  const [qrStandTable, setQrStandTable] = useState<Table | null>(null);
  
  // Filters
  const [selectedArea, setSelectedArea] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'terisi' | 'kosong'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchTablesData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        fetch('/api/pos/tables'),
        fetch('/api/pos/sessions/active')
      ]);
      const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);
      if (tData.success) setTables(tData.tables);
      if (sData.success) setSessions(sData.sessions);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesData();
  }, []);

  const handleOpenSession = async (tableId: number) => {
    try {
      const res = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Sesi meja berhasil dibuka!`);
        setTimeout(() => setActionMessage(null), 3000);
        await fetchTablesData();
      }
    } catch (err) {
      alert('Gagal membuka sesi');
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pos/tables/${tableId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Meja berhasil dihapus dari sistem');
        setTimeout(() => setActionMessage(null), 3000);
        setDeleteConfirmId(null);
        await fetchTablesData();
      } else {
        alert(data.error || 'Gagal menghapus meja');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus meja');
    } finally {
      setDeleting(false);
    }
  };

  // Get list of unique areas
  const areas = ['Semua', ...Array.from(new Set(tables.map(t => t.area || 'Area Indoor')))];

  // Filtered tables
  const filteredTables = tables.filter(t => {
    const matchArea = selectedArea === 'Semua' || (t.area || 'Area Indoor') === selectedArea;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'terisi' && t.status === 'terisi') ||
      (statusFilter === 'kosong' && t.status === 'kosong');
    return matchArea && matchStatus;
  });

  const totalSeats = tables.reduce((acc, t) => acc + (t.capacity || 4), 0);
  const occupiedCount = tables.filter(t => t.status === 'terisi').length;
  const emptyCount = tables.filter(t => t.status === 'kosong').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">Kelola Meja & Pemantauan Sesi QR</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
              {tables.length} Meja Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah meja cafe baru, atur tata letak area, dan cetak QR Code Self-Order untuk setiap meja
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTablesData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddTableModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs bg-[#1A3A5C] text-white hover:bg-slate-900"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tambah Meja Baru</span>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Meja</p>
            <h4 className="text-base font-black text-slate-900">{tables.length} Unit</h4>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Meja Terisi</p>
            <h4 className="text-base font-black text-emerald-600">{occupiedCount} Sesi Aktif</h4>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Meja Kosong</p>
            <h4 className="text-base font-black text-slate-700">{emptyCount} Siap Pakai</h4>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Kapasitas</p>
            <h4 className="text-base font-black text-slate-900">{totalSeats} Kursi</h4>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Zona:</span>
          </span>
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedArea === area
                  ? 'bg-[#1A3A5C] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('terisi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              statusFilter === 'terisi' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            Terisi ({occupiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('kosong')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              statusFilter === 'kosong' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Kosong ({emptyCount})
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Grid className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Tidak ada meja pada filter ini</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Klik tombol "Tambah Meja Baru" di atas untuk menambahkan nomor meja dan zona cafe baru.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddTableModalOpen(true)}
            className="text-xs font-bold bg-[#1A3A5C] text-white"
          >
            Tambah Meja Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredTables.map(table => {
            const session = sessions.find(s => s.table_id === table.table_id && s.status === 'aktif');
            const isOccupied = table.status === 'terisi';

            return (
              <Card
                key={table.table_id}
                className={`p-4 sm:p-5 flex flex-col justify-between space-y-3.5 border-2 transition-all ${
                  isOccupied ? 'border-emerald-300 bg-emerald-50/20 shadow-xs' : 'border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{table.table_number}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {table.area || 'Area Indoor'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Kapasitas: {table.capacity || 4} Orang</span>
                    </p>
                  </div>
                  <Badge variant={isOccupied ? 'success' : 'neutral'} size="md">
                    {isOccupied ? 'Sesi Aktif' : 'Kosong'}
                  </Badge>
                </div>

                {isOccupied && session ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Mulai:</span>
                      <span className="font-mono font-bold text-slate-700">{formatTime(session.start_time)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Jumlah Pesanan:</span>
                      <span className="font-bold text-[#1A3A5C]">{session.orders_count || 0} Order</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5">
                      <span>Estimasi Bill:</span>
                      <span className="text-emerald-700">{formatRupiah(session.total_amount || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Meja siap digunakan untuk pelanggan baru
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTable(table);
                        setIsQRModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-white"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#1A3A5C]" />
                      <span>{isOccupied ? 'Lihat Sesi' : 'Buka Sesi'}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrStandTable(table)}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 bg-white"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Stand QR</span>
                    </Button>
                  </div>

                  {!isOccupied && (
                    <div className="pt-1 flex justify-end">
                      {deleteConfirmId === table.table_id ? (
                        <div className="flex items-center gap-1.5 w-full bg-rose-50 p-1.5 rounded-lg border border-rose-200 text-xs">
                          <span className="text-[11px] font-bold text-rose-800 flex-1">Yakin hapus?</span>
                          <button
                            onClick={() => handleDeleteTable(table.table_id)}
                            disabled={deleting}
                            className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                          >
                            {deleting ? '...' : 'Ya, Hapus'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(table.table_id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Meja</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* POS Open/View Session Modal */}
      {selectedTable && (
        <POSOpenSessionModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          table={selectedTable}
          session={sessions.find(s => s.table_id === selectedTable.table_id && s.status === 'aktif') || null}
          onOpenSession={handleOpenSession}
        />
      )}

      {/* Add Table Modal */}
      <POSTableAddModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onSuccess={() => {
          fetchTablesData();
          setActionMessage('Meja baru berhasil ditambahkan!');
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      {/* Stand QR Printout Modal */}
      {qrStandTable && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#1A3A5C] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-sm">Stand Akrilik QR Meja</h3>
              </div>
              <button
                onClick={() => setQrStandTable(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stand QR Printable Card */}
            <div className="p-6 text-center space-y-4" id="table-stand-printable">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  {qrStandTable.area || 'Area Indoor'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  {qrStandTable.table_number}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Scan QR untuk pesan menu dari smartphone Anda</p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    window.location.origin + '/?view=customer&table_id=' + qrStandTable.table_id
                  )}`}
                  alt={`QR Code ${qrStandTable.table_number}`}
                  className="w-40 h-40 mx-auto rounded-lg"
                />
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">BREW & BYTE CAFE</p>
                <p className="text-slate-500 text-[10px]">Self-Order Tanpa Antri di Kasir</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrStandTable(null)}
                className="text-xs"
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => printElementById('table-stand-printable', `Stand QR - ${qrStandTable.table_number}`)}
                className="text-xs font-bold flex items-center gap-1.5 bg-[#1A3A5C] text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Stand QR</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

