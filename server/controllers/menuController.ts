import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { notifyStockChanged } from '../socket/index.js';

export function getMenuItems(req: Request, res: Response) {
  try {
    const includeUnavailable = req.query.all === 'true' || req.headers['authorization'] !== undefined;
    const items = db.getMenuItems(includeUnavailable);
    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat menu' });
  }
}

export function createMenuItem(req: AuthRequest, res: Response) {
  try {
    const { name, category, price, description, photo_url, stock_status } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Nama, kategori, dan harga wajib diisi' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Harga harus berupa angka positif' });
    }

    const newItem = db.createMenuItem({
      name: name.trim(),
      category: category.trim(),
      price: numPrice,
      description: description || '',
      photo_url: photo_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
      stock_status: stock_status === 'habis' ? 'habis' : 'tersedia'
    });

    notifyStockChanged(newItem);
    return res.status(201).json(newItem);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menambahkan menu baru' });
  }
}

export function updateMenuItem(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, price, description, photo_url, stock_status } = req.body;

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (category) updates.category = category.trim();
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description;
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (stock_status !== undefined) updates.stock_status = stock_status;

    const updated = db.updateMenuItem(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Menu tidak ditemukan' });
    }

    notifyStockChanged(updated);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui menu' });
  }
}

export function deleteMenuItem(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteMenuItem(id);
    if (!success) {
      return res.status(404).json({ error: 'Menu tidak ditemukan' });
    }
    notifyStockChanged({ item_id: id, deleted: true });
    return res.json({ message: 'Menu berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus menu' });
  }
}

export function updateStockStatus(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { stock_status, reason } = req.body;

    if (stock_status !== 'tersedia' && stock_status !== 'habis') {
      return res.status(400).json({ error: 'Status stok harus "tersedia" atau "habis"' });
    }

    const userId = req.user ? req.user.user_id : 1;
    const updated = db.updateStockStatus(id, stock_status, userId, reason);

    if (!updated) {
      return res.status(404).json({ error: 'Menu tidak ditemukan' });
    }

    notifyStockChanged(updated);
    return res.json({
      message: `Stok menu ${updated.name} diubah menjadi ${stock_status}`,
      item: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengubah status stok' });
  }
}
