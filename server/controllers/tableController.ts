import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { notifyTablesUpdated, notifySessionUpdated } from '../socket/index.js';

export function getTables(req: Request, res: Response) {
  try {
    const tables = db.getTables();
    return res.json(tables);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data meja' });
  }
}

export function createTable(req: AuthRequest, res: Response) {
  try {
    const { table_number, capacity, area } = req.body;
    if (!table_number) {
      return res.status(400).json({ error: 'Nomor meja wajib diisi' });
    }

    const newTable = db.createTable(
      table_number.trim(),
      capacity ? Number(capacity) : 4,
      area ? area.trim() : 'Area Indoor'
    );
    notifyTablesUpdated();
    return res.status(201).json(newTable);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menambahkan meja' });
  }
}

export function deleteTable(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteTable(id);
    if (!success) {
      return res.status(400).json({ error: 'Tidak dapat menghapus meja yang sedang aktif atau meja tidak ditemukan' });
    }
    notifyTablesUpdated();
    return res.json({ message: 'Meja berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus meja' });
  }
}

export function openSession(req: AuthRequest, res: Response) {
  try {
    const { table_id } = req.body;
    if (!table_id) {
      return res.status(400).json({ error: 'ID Meja wajib disertakan' });
    }

    const session = db.createSession(Number(table_id));
    notifyTablesUpdated();
    notifySessionUpdated(session);

    return res.status(201).json({
      message: 'Sesi meja berhasil dibuka',
      session
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gagal membuka sesi' });
  }
}

export function getActiveSessions(req: Request, res: Response) {
  try {
    const sessions = db.getActiveSessions();
    return res.json(sessions);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat sesi aktif' });
  }
}

export function getSessionDetail(req: Request, res: Response) {
  try {
    const sessionId = req.params.id;
    const session = db.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesi meja tidak ditemukan' });
    }

    const orders = db.getOrdersBySession(sessionId);
    const config = db.getTaxServiceConfig();

    let subtotal = 0;
    orders.forEach(ord => {
      if (ord.status !== 'dibatalkan') {
        ord.items.forEach(item => {
          subtotal += Number(item.subtotal);
        });
      }
    });

    const serviceCharge = config.is_service_active
      ? Math.round((subtotal * config.service_charge_percentage) / 100)
      : 0;

    const tax = config.is_tax_active
      ? Math.round(((subtotal + serviceCharge) * config.tax_percentage) / 100)
      : 0;

    const total = subtotal + serviceCharge + tax;

    return res.json({
      session,
      orders,
      calculation: {
        subtotal,
        service_charge_rate: config.service_charge_percentage,
        is_service_active: config.is_service_active,
        service_charge: serviceCharge,
        tax_rate: config.tax_percentage,
        is_tax_active: config.is_tax_active,
        tax,
        total
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat detail sesi' });
  }
}

export function getSessionOrders(req: Request, res: Response) {
  try {
    const sessionId = req.params.id;
    const orders = db.getOrdersBySession(sessionId);
    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat pesanan sesi' });
  }
}

export function closeSession(req: AuthRequest, res: Response) {
  try {
    const sessionId = req.params.id;
    const { payment_method, nominal } = req.body;

    if (!payment_method || nominal === undefined) {
      return res.status(400).json({ error: 'Metode pembayaran dan nominal wajib diisi' });
    }

    if (!['tunai', 'QRIS', 'EDC'].includes(payment_method)) {
      return res.status(400).json({ error: 'Metode pembayaran tidak valid (harus tunai, QRIS, atau EDC)' });
    }

    const cashierId = req.user ? req.user.user_id : 1;
    const result = db.closeSession(sessionId, {
      payment_method,
      nominal: Number(nominal),
      kasir_id: cashierId
    });

    notifyTablesUpdated();
    notifySessionUpdated({ session_id: sessionId, status: 'ditutup', payment: result.payment });

    return res.json({
      message: 'Sesi berhasil ditutup dan pembayaran tercatat',
      ...result
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gagal menutup sesi' });
  }
}
