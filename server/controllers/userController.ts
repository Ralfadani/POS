import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

export function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = db.getUsers().map(u => ({
      user_id: u.user_id,
      name: u.name,
      role: u.role,
      username: u.username,
      created_at: u.created_at
    }));
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data pengguna' });
  }
}

export function createUser(req: AuthRequest, res: Response) {
  try {
    const { name, role, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Nama, username, dan password wajib diisi' });
    }

    const existing = db.getUserByUsername(username.trim());
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = db.createUser({
      name: name.trim(),
      role: role === 'admin' ? 'admin' : 'kasir',
      username: username.trim().toLowerCase(),
      password_hash
    });

    return res.status(201).json({
      message: 'Pengguna berhasil dibuat',
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        role: newUser.role,
        username: newUser.username,
        created_at: newUser.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal membuat pengguna' });
  }
}

export function updateUser(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, role, username, password } = req.body;

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (role && (role === 'admin' || role === 'kasir')) updates.role = role;
    if (username) {
      const existing = db.getUserByUsername(username.trim());
      if (existing && existing.user_id !== id) {
        return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
      }
      updates.username = username.trim().toLowerCase();
    }
    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(password, salt);
    }

    const updated = db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    return res.json({
      message: 'Pengguna berhasil diperbarui',
      user: {
        user_id: updated.user_id,
        name: updated.name,
        role: updated.role,
        username: updated.username,
        created_at: updated.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui pengguna' });
  }
}

export function deleteUser(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.user && req.user.user_id === id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun yang sedang aktif digunakan' });
    }

    const success = db.deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }
    return res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
}
