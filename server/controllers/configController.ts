import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

export function getTaxServiceConfig(req: Request, res: Response) {
  try {
    const config = db.getTaxServiceConfig();
    return res.json(config);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat konfigurasi pajak & service charge' });
  }
}

export function updateTaxServiceConfig(req: AuthRequest, res: Response) {
  try {
    const {
      tax_percentage,
      service_charge_percentage,
      is_tax_active,
      is_service_active
    } = req.body;

    const updates: any = {};
    if (tax_percentage !== undefined) {
      const taxNum = Number(tax_percentage);
      if (taxNum < 0 || taxNum > 100) return res.status(400).json({ error: 'Persentase pajak harus antara 0 - 100%' });
      updates.tax_percentage = taxNum;
    }
    if (service_charge_percentage !== undefined) {
      const svcNum = Number(service_charge_percentage);
      if (svcNum < 0 || svcNum > 100) return res.status(400).json({ error: 'Persentase service charge harus antara 0 - 100%' });
      updates.service_charge_percentage = svcNum;
    }
    if (is_tax_active !== undefined) updates.is_tax_active = Boolean(is_tax_active);
    if (is_service_active !== undefined) updates.is_service_active = Boolean(is_service_active);

    const updated = db.updateTaxServiceConfig(updates);
    return res.json({
      message: 'Konfigurasi pajak & service charge berhasil diperbarui',
      config: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui konfigurasi' });
  }
}
