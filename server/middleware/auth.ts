import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cafe_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token autentikasi tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: number };
    const user = db.getUserById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak valid atau telah dihapus' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token kadaluarsa atau tidak valid' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Memerlukan hak akses Admin/Owner.' });
  }
  next();
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'kasir' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Akses ditolak. Memerlukan hak akses Kasir atau Admin.' });
  }
  next();
}
