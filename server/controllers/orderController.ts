import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { notifyNewOrder, notifyOrderStatusUpdated, notifyTablesUpdated } from '../socket/index.js';

export function submitOrder(req: Request, res: Response) {
  try {
    const { session_id, channel, items } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID diperlukan' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Daftar item pesanan tidak boleh kosong' });
    }

    const orderChannel = channel === 'pos_manual' ? 'pos_manual' : 'self_order';

    const order = db.createOrder({
      session_id,
      channel: orderChannel,
      items: items.map(it => ({
        item_id: Number(it.item_id),
        quantity: Number(it.quantity) || 1,
        notes: it.notes || ''
      }))
    });

    // Real-time broadcast
    notifyNewOrder(order);
    notifyTablesUpdated();

    return res.status(201).json({
      message: 'Pesanan berhasil dikirim ke dapur dan POS',
      order
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gagal mengirim pesanan' });
  }
}

export function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['menunggu', 'diproses', 'selesai', 'dibatalkan'].includes(status)) {
      return res.status(400).json({ error: 'Status pesanan tidak valid (menunggu, diproses, selesai, dibatalkan)' });
    }

    const updated = db.updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    notifyOrderStatusUpdated(updated);
    return res.json({
      message: `Status pesanan #${orderId} diubah menjadi ${status}`,
      order: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui status pesanan' });
  }
}

export function cancelOrderWithReason(req: AuthRequest, res: Response) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { reason, reason_category } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Alasan pembatalan yang jelas wajib diisi (minimal 3 karakter)' });
    }

    const cashierId = req.user ? req.user.user_id : (req.body.cancelled_by ? Number(req.body.cancelled_by) : 2);
    const cashierName = req.user ? req.user.name : (req.body.cancelled_by_name || 'Kasir POS');

    const result = db.cancelOrder(orderId, {
      reason: reason.trim(),
      reason_category: reason_category || 'Pelanggan Batal Order',
      cancelled_by: cashierId,
      cancelled_by_name: cashierName
    });

    notifyOrderStatusUpdated(result.order);
    notifyTablesUpdated();

    return res.json({
      message: `Pesanan #${orderId} berhasil dibatalkan dan tercatat dalam log audit`,
      ...result
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Gagal membatalkan pesanan' });
  }
}

export function getCancelLogs(req: AuthRequest, res: Response) {
  try {
    const logs = db.getOrderCancelLogs();
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat log pembatalan pesanan' });
  }
}
