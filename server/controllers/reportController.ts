import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

export function getSalesReport(req: AuthRequest, res: Response) {
  try {
    const range = (req.query.range as 'today' | 'week' | 'month' | 'all') || 'today';
    const report = db.getSalesReport(range);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghasilkan laporan penjualan' });
  }
}

export function getStockLogs(req: AuthRequest, res: Response) {
  try {
    const logs = db.getStockLogs();
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat log perubahan stok' });
  }
}

export function getTransactionHistory(req: AuthRequest, res: Response) {
  try {
    const payments = db.getPayments();
    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat riwayat transaksi' });
  }
}
