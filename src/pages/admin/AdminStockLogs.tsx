import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatDateTime } from '../../utils/formatters.js';
import { History, Search, RefreshCw, PackageX, PackageCheck, AlertCircle } from 'lucide-react';

interface StockLog {
  log_id: number;
  item_id: number;
  item_name?: string;
  previous_status: 'tersedia' | 'habis';
  new_status: 'tersedia' | 'habis';
  changed_by: number;
  changed_by_name?: string;
  reason: string;
  created_at: string;
}

export const AdminStockLogs: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStockLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stock-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching stock logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const itemName = (log.item_name || '').toLowerCase();
    const changedBy = (log.changed_by_name || '').toLowerCase();
    const reason = (log.reason || '').toLowerCase();
    return itemName.includes(term) || changedBy.includes(term) || reason.includes(term);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu, kasir, alasan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500">
            Total Catatan: <strong>{logs.length}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStockLogs}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu Perubahan</th>
                <th className="py-3 px-4">Menu</th>
                <th className="py-3 px-4 text-center">Status Sebelumnya</th>
                <th className="py-3 px-4 text-center">Status Baru</th>
                <th className="py-3 px-4">Diubah Oleh</th>
                <th className="py-3 px-4">Alasan Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat perubahan stok menu.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.item_name || `Menu #${log.item_id}`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={log.previous_status === 'tersedia' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {log.previous_status === 'tersedia' ? 'Tersedia' : 'Habis (Sold Out)'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={log.new_status === 'tersedia' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {log.new_status === 'tersedia' ? 'Tersedia' : 'Habis (Sold Out)'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {log.changed_by_name || `User #${log.changed_by}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
