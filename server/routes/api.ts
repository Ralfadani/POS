import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin, requireStaff, AuthRequest } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as menuController from '../controllers/menuController.js';
import * as tableController from '../controllers/tableController.js';
import * as orderController from '../controllers/orderController.js';
import * as reportController from '../controllers/reportController.js';
import * as userController from '../controllers/userController.js';
import * as configController from '../controllers/configController.js';
import { db } from '../db/database.js';
import { notifyNewOrder, notifyOrderStatusUpdated, notifyTablesUpdated, notifySessionUpdated, notifyStockChanged } from '../socket/index.js';

const router = Router();

// ==========================================
// 1. AUTH ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// ==========================================
// 2. CUSTOMER SELF-ORDER ROUTES
// ==========================================
router.get('/customer/session', (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID tidak ditemukan' });
    }

    const session = db.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi meja tidak ditemukan atau sudah ditutup' });
    }

    const table = db.getTableById(session.table_id);
    const menu = db.getMenuItems(false); // only available items
    const orders = db.getOrdersBySession(sessionId);
    const settings = db.getTaxServiceConfig();

    let subtotal = 0;
    orders.forEach(ord => {
      if (ord.status !== 'dibatalkan') {
        ord.items.forEach(item => {
          subtotal += Number(item.subtotal);
        });
      }
    });

    const serviceCharge = settings.is_service_active
      ? Math.round((subtotal * settings.service_charge_percentage) / 100)
      : 0;

    const tax = settings.is_tax_active
      ? Math.round(((subtotal + serviceCharge) * settings.tax_percentage) / 100)
      : 0;

    const total = subtotal + serviceCharge + tax;

    return res.json({
      success: true,
      session,
      table,
      menu,
      orders,
      settings,
      profile: db.getCafeProfile(),
      calculation: {
        subtotal,
        service_charge_rate: settings.service_charge_percentage,
        is_service_active: settings.is_service_active,
        service_charge: serviceCharge,
        tax_rate: settings.tax_percentage,
        is_tax_active: settings.is_tax_active,
        tax,
        total
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat sesi customer' });
  }
});

router.post('/customer/order', (req: Request, res: Response) => {
  try {
    const { session_id, items } = req.body;
    if (!session_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Daftar item pesanan tidak boleh kosong' });
    }

    const order = db.createOrder({
      session_id,
      channel: 'self_order',
      items: items.map(it => ({
        item_id: Number(it.item_id),
        quantity: Number(it.quantity) || 1,
        notes: it.notes || ''
      }))
    });

    notifyNewOrder(order);
    notifyTablesUpdated();

    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal mengirim pesanan' });
  }
});

// ==========================================
// 3. POS TABLET ROUTES
// ==========================================
router.get('/pos/tables', (req: Request, res: Response) => {
  try {
    const tables = db.getTables();
    return res.json({ success: true, tables });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat meja' });
  }
});

router.post('/pos/tables', (req: Request, res: Response) => {
  try {
    const { table_number, capacity, area } = req.body;
    if (!table_number || !table_number.trim()) {
      return res.status(400).json({ success: false, error: 'Nomor meja wajib diisi' });
    }

    const newTable = db.createTable(
      table_number.trim(),
      capacity ? Number(capacity) : 4,
      area ? area.trim() : 'Area Indoor'
    );
    notifyTablesUpdated();
    return res.status(201).json({ success: true, table: newTable });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal menambahkan meja baru' });
  }
});

router.delete('/pos/tables/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteTable(id);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Tidak dapat menghapus meja yang sedang aktif atau meja tidak ditemukan' });
    }
    notifyTablesUpdated();
    return res.json({ success: true, message: 'Meja berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal menghapus meja' });
  }
});

router.get('/pos/sessions/active', (req: Request, res: Response) => {
  try {
    const sessions = db.getActiveSessions();
    return res.json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat sesi aktif' });
  }
});

router.get('/pos/menu', (req: Request, res: Response) => {
  try {
    const menu = db.getMenuItems(true);
    return res.json({ success: true, menu });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat menu' });
  }
});

router.get('/pos/sessions/:id', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const session = db.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi meja tidak ditemukan' });
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
      success: true,
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
    return res.status(500).json({ success: false, error: 'Gagal memuat detail sesi' });
  }
});

router.post('/pos/sessions/open', (req: Request, res: Response) => {
  try {
    const { table_id } = req.body;
    if (!table_id) {
      return res.status(400).json({ success: false, error: 'ID Meja diperlukan' });
    }

    const session = db.createSession(Number(table_id));
    notifyTablesUpdated();
    notifySessionUpdated(session);

    return res.status(201).json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal membuka sesi meja' });
  }
});

router.post('/pos/sessions/:id/close', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { payment_method, nominal, cashier_id } = req.body;

    if (!payment_method || nominal === undefined) {
      return res.status(400).json({ success: false, error: 'Metode pembayaran dan nominal diperlukan' });
    }

    const result = db.closeSession(sessionId, {
      payment_method,
      nominal: Number(nominal),
      kasir_id: cashier_id || 2
    });

    notifyTablesUpdated();
    notifySessionUpdated({ session_id: sessionId, status: 'ditutup', payment: result.payment });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal menutup sesi' });
  }
});

router.post('/pos/sessions/:id/close-without-payment', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { cashier_id, reason } = req.body;

    const result = db.closeSessionWithoutPayment(sessionId, {
      cashier_id: cashier_id || 2,
      reason: reason || 'Customer batal order / meja dikosongkan langsung'
    });

    notifyTablesUpdated();
    notifySessionUpdated({ session_id: sessionId, status: 'ditutup' });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal menutup sesi tanpa pembayaran' });
  }
});

router.get('/pos/transactions', (req: Request, res: Response) => {
  try {
    const payments = db.getPayments();
    return res.json({ success: true, transactions: payments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat transaksi' });
  }
});

router.get('/pos/transactions/:id', (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const payments = db.getPayments();
    const trx = payments.find(p => p.payment_id === paymentId);
    if (!trx) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });

    const orders = db.getOrdersBySession(trx.session_id);
    return res.json({ success: true, transaction: { ...trx, orders } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat detail transaksi' });
  }
});

router.put('/pos/menu/stock', (req: Request, res: Response) => {
  try {
    const { item_id, stock_status, reason, changed_by } = req.body;
    const updated = db.updateStockStatus(
      Number(item_id),
      stock_status,
      changed_by || 2,
      reason || 'Diubah dari POS Kasir'
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    }
    notifyStockChanged(updated);
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal mengubah stok' });
  }
});

router.post('/pos/orders/manual', (req: Request, res: Response) => {
  try {
    const { session_id, items } = req.body;
    const order = db.createOrder({
      session_id,
      channel: 'pos_manual',
      items: items.map((it: any) => ({
        item_id: Number(it.item_id),
        quantity: Number(it.quantity) || 1,
        notes: it.notes || ''
      }))
    });

    notifyNewOrder(order);
    notifyTablesUpdated();

    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal membuat pesanan manual' });
  }
});

router.put('/pos/orders/:id/status', (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const updated = db.updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }
    notifyOrderStatusUpdated(updated);
    return res.json({ success: true, order: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memperbarui status pesanan' });
  }
});

router.post('/pos/orders/:id/cancel', (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { reason, reason_category, cancelled_by, cancelled_by_name, close_session } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Alasan pembatalan yang jelas wajib diisi (minimal 3 karakter)' });
    }

    const result = db.cancelOrder(orderId, {
      reason: reason.trim(),
      reason_category: reason_category || 'Pelanggan Batal Order',
      cancelled_by: cancelled_by ? Number(cancelled_by) : 2,
      cancelled_by_name: cancelled_by_name || 'Kasir POS'
    });

    notifyOrderStatusUpdated(result.order);
    notifyTablesUpdated();

    let sessionClosed = false;
    if (close_session && result.order.session_id) {
      try {
        db.closeSessionWithoutPayment(result.order.session_id, {
          cashier_id: cancelled_by ? Number(cancelled_by) : 2,
          reason: `Sesi ditutup bersamaan pembatalan order #${orderId}: ${reason}`
        });
        sessionClosed = true;
        notifySessionUpdated({ session_id: result.order.session_id, status: 'ditutup' });
        notifyTablesUpdated();
      } catch (errClose) {
        console.error('Auto close session on cancel notice:', errClose);
      }
    }

    return res.json({
      success: true,
      message: `Pesanan #${orderId} berhasil dibatalkan dan tercatat dalam audit log`,
      order: result.order,
      cancelLog: result.cancelLog,
      sessionClosed
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal membatalkan pesanan' });
  }
});

// ==========================================
// 4. ADMIN PORTAL ROUTES
// ==========================================
router.get('/admin/dashboard-summary', (req: Request, res: Response) => {
  try {
    const report = db.getSalesReport('today');
    const weekReport = db.getSalesReport('week');
    const tables = db.getTables();
    const activeSessions = db.getActiveSessions();
    const allMenu = db.getMenuItems(true);
    const cancelLogs = db.getOrderCancelLogs();

    // Today's cancel logs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCancels = cancelLogs.filter(cl => new Date(cl.cancelled_at) >= todayStart);
    const todayCancelledCount = todayCancels.length;
    const todayCancelledTotal = todayCancels.reduce((sum, cl) => sum + (Number(cl.total_amount) || 0), 0);

    const outOfStock = allMenu.filter(m => m.stock_status === 'habis').length;

    return res.json({
      success: true,
      summary: {
        todayRevenue: report.totalSales,
        todayTransactionsCount: report.transactionCount,
        averageCheck: report.avgOrderValue,
        activeSessionsCount: activeSessions.length,
        totalTablesCount: tables.length,
        occupiedTablesCount: tables.filter(t => t.status === 'terisi').length,
        totalMenuItems: allMenu.length,
        outOfStockItems: outOfStock,
        todayCancelledOrdersCount: todayCancelledCount,
        todayCancelledRevenue: todayCancelledTotal,
        totalCancelledOrdersAllTime: cancelLogs.length,
        paymentBreakdown: {
          tunai: report.paymentMethods.tunai?.total || 0,
          QRIS: report.paymentMethods.QRIS?.total || 0,
          EDC: report.paymentMethods.EDC?.total || 0
        },
        sevenDaysTrend: weekReport.chartData.map(c => ({
          date: c.label,
          revenue: c.sales,
          transactions: c.transactions
        })),
        topSellingItems: report.topItems.slice(0, 5).map(it => ({
          name: it.name,
          category: it.category,
          totalQuantity: it.quantity,
          totalRevenue: it.revenue
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat ringkasan admin' });
  }
});

router.get('/admin/menu', (req: Request, res: Response) => {
  try {
    const menu = db.getMenuItems(true);
    return res.json({ success: true, menu });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat menu' });
  }
});

router.post('/admin/menu', (req: Request, res: Response) => {
  try {
    const { name, category, price, description, photo_url, stock_status } = req.body;
    const newItem = db.createMenuItem({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description || '',
      photo_url: photo_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
      stock_status: stock_status === 'habis' ? 'habis' : 'tersedia'
    });
    notifyStockChanged(newItem);
    return res.status(201).json({ success: true, item: newItem });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal membuat menu' });
  }
});

router.put('/admin/menu/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = db.updateMenuItem(id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    notifyStockChanged(updated);
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memperbarui menu' });
  }
});

router.delete('/admin/menu/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteMenuItem(id);
    if (!success) return res.status(404).json({ success: false, error: 'Menu tidak ditemukan' });
    notifyStockChanged({ item_id: id, deleted: true });
    return res.json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal menghapus menu' });
  }
});

router.get('/admin/reports', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'today' | '7days' | '30days' | 'all') || 'today';
    const range = period === '7days' ? 'week' : period === '30days' ? 'month' : period === 'all' ? 'all' : 'today';
    const report = db.getSalesReport(range);

    return res.json({
      success: true,
      report: {
        totalRevenue: report.totalSales,
        totalSubtotal: report.totalSubtotal,
        totalTax: report.totalTax,
        totalServiceCharge: report.totalService,
        totalTransactions: report.transactionCount,
        totalItemsSold: report.topItems.reduce((sum, it) => sum + it.quantity, 0),
        paymentBreakdown: {
          tunai: report.paymentMethods.tunai?.total || 0,
          QRIS: report.paymentMethods.QRIS?.total || 0,
          EDC: report.paymentMethods.EDC?.total || 0
        },
        transactions: report.recentPayments
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat laporan' });
  }
});

router.get('/admin/transactions', (req: Request, res: Response) => {
  try {
    const payments = db.getPayments();
    return res.json({ success: true, transactions: payments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat transaksi' });
  }
});

router.get('/admin/transactions/:id', (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const payments = db.getPayments();
    const trx = payments.find(p => p.payment_id === paymentId);
    if (!trx) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });

    const orders = db.getOrdersBySession(trx.session_id);
    return res.json({ success: true, transaction: { ...trx, orders } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat detail transaksi' });
  }
});

router.get('/admin/stock-logs', (req: Request, res: Response) => {
  try {
    const logs = db.getStockLogs();
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat log stok' });
  }
});

router.get('/admin/order-cancel-logs', (req: Request, res: Response) => {
  try {
    const logs = db.getOrderCancelLogs();
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat log audit pembatalan pesanan' });
  }
});

router.get('/cafe-profile', (req: Request, res: Response) => {
  try {
    const profile = db.getCafeProfile();
    const config = db.getTaxServiceConfig();
    return res.json({ success: true, profile, config });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat profil cafe' });
  }
});

router.get('/admin/cafe-profile', (req: Request, res: Response) => {
  try {
    const profile = db.getCafeProfile();
    return res.json({ success: true, profile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat profil cafe' });
  }
});

router.put('/admin/cafe-profile', (req: Request, res: Response) => {
  try {
    const updated = db.updateCafeProfile(req.body);
    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memperbarui profil cafe' });
  }
});

router.get('/admin/settings', (req: Request, res: Response) => {
  try {
    const config = db.getTaxServiceConfig();
    const profile = db.getCafeProfile();
    return res.json({ success: true, config, profile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat konfigurasi' });
  }
});

router.put('/admin/settings', (req: Request, res: Response) => {
  try {
    let updatedConfig = db.getTaxServiceConfig();
    let updatedProfile = db.getCafeProfile();

    if (req.body.tax_percentage !== undefined || req.body.is_tax_active !== undefined || req.body.service_charge_percentage !== undefined || req.body.is_service_active !== undefined) {
      updatedConfig = db.updateTaxServiceConfig(req.body);
    }

    if (req.body.cafe_name || req.body.address || req.body.phone || req.body.email || req.body.tagline || req.body.wifi_ssid || req.body.receipt_footer) {
      updatedProfile = db.updateCafeProfile(req.body);
    }

    return res.json({ success: true, config: updatedConfig, profile: updatedProfile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memperbarui konfigurasi' });
  }
});

router.get('/admin/users', (req: Request, res: Response) => {
  try {
    const users = db.getUsers().map(u => ({
      user_id: u.user_id,
      name: u.name,
      role: u.role,
      username: u.username,
      created_at: u.created_at
    }));
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memuat pengguna' });
  }
});

router.post('/admin/users', (req: Request, res: Response) => {
  try {
    const { name, role, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, error: 'Nama, username, dan password wajib diisi' });
    }

    const existing = db.getUserByUsername(username.trim());
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username sudah digunakan' });
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
      success: true,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        role: newUser.role,
        username: newUser.username,
        created_at: newUser.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal membuat pengguna' });
  }
});

router.put('/admin/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, role, username, password } = req.body;

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (role) updates.role = role;
    if (username) updates.username = username.trim().toLowerCase();
    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(password, salt);
    }

    const updated = db.updateUser(id, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' });

    return res.json({
      success: true,
      user: {
        user_id: updated.user_id,
        name: updated.name,
        role: updated.role,
        username: updated.username,
        created_at: updated.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal memperbarui pengguna' });
  }
});

router.delete('/admin/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteUser(id);
    if (!success) return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' });
    return res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Gagal menghapus pengguna' });
  }
});

// ==========================================
// 5. STANDARD REST ALIASES (FOR DIRECT APIS)
// ==========================================
router.get('/tables', tableController.getTables);
router.post('/tables', tableController.createTable);
router.delete('/tables/:id', tableController.deleteTable);
router.post('/sessions', tableController.openSession);
router.get('/sessions/active', tableController.getActiveSessions);
router.get('/sessions/:id', tableController.getSessionDetail);
router.get('/sessions/:id/orders', tableController.getSessionOrders);
router.put('/sessions/:id/close', tableController.closeSession);
router.get('/menu', menuController.getMenuItems);
router.post('/menu', menuController.createMenuItem);
router.put('/menu/:id', menuController.updateMenuItem);
router.delete('/menu/:id', menuController.deleteMenuItem);
router.put('/menu/:id/stock', menuController.updateStockStatus);
router.post('/orders', orderController.submitOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.post('/orders/:id/cancel', orderController.cancelOrderWithReason);
router.get('/reports/cancel-logs', orderController.getCancelLogs);
router.get('/reports/sales', reportController.getSalesReport);
router.get('/reports/stock-logs', reportController.getStockLogs);
router.get('/reports/transactions', reportController.getTransactionHistory);
router.get('/config/tax-service', configController.getTaxServiceConfig);
router.put('/config/tax-service', configController.updateTaxServiceConfig);
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

import bcrypt from 'bcryptjs';

export default router;
