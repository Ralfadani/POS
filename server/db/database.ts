import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  user_id: number;
  name: string;
  role: 'kasir' | 'admin';
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Table {
  table_id: number;
  table_number: string;
  capacity?: number;
  area?: string;
  status: 'kosong' | 'terisi';
}

export interface MenuItem {
  item_id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  photo_url: string;
  stock_status: 'tersedia' | 'habis';
}

export interface Session {
  session_id: string; // UUID
  table_id: number;
  start_time: string;
  end_time: string | null;
  status: 'aktif' | 'ditutup';
}

export interface Order {
  order_id: number;
  session_id: string;
  order_time: string;
  created_at?: string;
  status: 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan';
  channel: 'self_order' | 'pos_manual';
  cancel_reason?: string;
  cancel_reason_category?: string;
  cancelled_by?: number;
  cancelled_by_name?: string;
  cancelled_at?: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  notes: string;
  subtotal: number;
  item_name?: string;
  item_price?: number;
  item_category?: string;
}

export interface OrderCancelLog {
  log_id: number;
  order_id: number;
  session_id: string;
  table_number: string;
  channel: 'self_order' | 'pos_manual';
  cancelled_by: number;
  cancelled_by_name: string;
  reason: string;
  reason_category: string;
  cancelled_at: string;
  total_amount: number;
  items_summary: string;
  items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes?: string;
  }[];
}

export interface Payment {
  payment_id: number;
  session_id: string;
  payment_method: 'tunai' | 'QRIS' | 'EDC';
  nominal: number;
  payment_time: string;
  kasir_id: number;
  subtotal: number;
  service_charge: number;
  tax: number;
  total: number;
  cashier_name?: string;
  table_number?: string;
  change?: number;
}

export interface StockChangeLog {
  log_id: number;
  item_id: number;
  item_name?: string;
  old_status: string;
  new_status: string;
  changed_by: number;
  changed_by_name?: string;
  reason: string;
  changed_at: string;
}

export interface TaxServiceConfig {
  config_id: number;
  tax_percentage: number;
  service_charge_percentage: number;
  is_tax_active: boolean;
  is_service_active: boolean;
  effective_date: string;
}

export interface CafeProfile {
  cafe_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  wifi_ssid: string;
  wifi_password: string;
  receipt_footer: string;
  logo_icon: string;
  operating_hours: string;
}

interface DatabaseState {
  users: User[];
  tables: Table[];
  menu_items: MenuItem[];
  sessions: Session[];
  orders: Order[];
  order_items: OrderItem[];
  payments: Payment[];
  stock_changes_log: StockChangeLog[];
  order_cancel_logs: OrderCancelLog[];
  tax_service_config: TaxServiceConfig;
  cafe_profile?: CafeProfile;
  nextIds: {
    user: number;
    table: number;
    menu_item: number;
    order: number;
    order_item: number;
    payment: number;
    stock_log: number;
    cancel_log: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cafe_pos_db.json');

class DatabaseService {
  private state: DatabaseState = {
    users: [],
    tables: [],
    menu_items: [],
    sessions: [],
    orders: [],
    order_items: [],
    payments: [],
    stock_changes_log: [],
    order_cancel_logs: [],
    tax_service_config: {
      config_id: 1,
      tax_percentage: 10,
      service_charge_percentage: 5,
      is_tax_active: true,
      is_service_active: true,
      effective_date: new Date().toISOString()
    },
    nextIds: {
      user: 1,
      table: 1,
      menu_item: 1,
      order: 1,
      order_item: 1,
      payment: 1,
      stock_log: 1,
      cancel_log: 1
    }
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);

        // Verify and heal default admin hash if corrupted or outdated
        const adminUser = this.state.users?.find(u => u.username.toLowerCase() === 'admin');
        if (adminUser) {
          const isValidAdmin = bcrypt.compareSync('admin123', adminUser.password_hash);
          if (!isValidAdmin && !bcrypt.compareSync('admin', adminUser.password_hash)) {
            const salt = bcrypt.genSaltSync(10);
            adminUser.password_hash = bcrypt.hashSync('admin123', salt);
            this.save();
          }
        }

        console.log('📦 Database loaded from file successfully');
      } else {
        this.seedInitialData();
        this.save();
        console.log('🌱 Database initialized with default cafe seed data');
      }
    } catch (err) {
      console.error('Error initializing database, seeding fresh data:', err);
      this.seedInitialData();
      this.save();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database state to disk:', err);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const kasirHash = bcrypt.hashSync('kasir123', salt);

    this.state.users = [
      {
        user_id: 1,
        name: 'Budi Santoso (Owner)',
        role: 'admin',
        username: 'admin',
        password_hash: adminHash,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        user_id: 2,
        name: 'Siti Rahma',
        role: 'kasir',
        username: 'kasir',
        password_hash: kasirHash,
        created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
      },
      {
        user_id: 3,
        name: 'Dimas Pratama',
        role: 'kasir',
        username: 'kasir2',
        password_hash: kasirHash,
        created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      }
    ];

    // 12 Tables with areas & capacities
    this.state.tables = [];
    for (let i = 1; i <= 12; i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      const area = i <= 6 ? 'Area Indoor' : i <= 9 ? 'Area Outdoor' : 'VIP Room';
      const cap = i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2;
      this.state.tables.push({
        table_id: i,
        table_number: `Meja ${num}`,
        capacity: cap,
        area,
        status: 'kosong'
      });
    }

    // Menu Items
    this.state.menu_items = [
      // Kopi
      {
        item_id: 1,
        name: 'Kopi Susu Gula Aren',
        category: 'Kopi',
        price: 22000,
        description: 'Espresso blend Arabica & Robusta dengan susu segar dan gula aren organik khas Nusantara.',
        photo_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 2,
        name: 'Caramel Macchiato Ice',
        category: 'Kopi',
        price: 28000,
        description: 'Susu lembut dengan sirup vanila, layer espresso bold, dan drizzle saus karamel leleh.',
        photo_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 3,
        name: 'Americano / Long Black',
        category: 'Kopi',
        price: 18000,
        description: 'Double shot espresso dengan air panas/dingin murni, aroma fruity nutty menyegarkan.',
        photo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 4,
        name: 'Cafe Latte Art',
        category: 'Kopi',
        price: 25000,
        description: 'Espresso dengan steamed milk creamy bertekstur microfoam lembut dan latte art indah.',
        photo_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },

      // Non-Kopi
      {
        item_id: 5,
        name: 'Matcha Latte Uji Kyoto',
        category: 'Non-Kopi',
        price: 26000,
        description: 'Bubuk green tea matcha otentik Jepang dipadukan susu creamy segar manis seimbang.',
        photo_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 6,
        name: 'Dark Chocolate Velvet',
        category: 'Non-Kopi',
        price: 24000,
        description: 'Cokelat Belgia premium pekat kaya rasa disajikan hangat atau dingin dengan whipped cream.',
        photo_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 7,
        name: 'Lychee Tea Cooler',
        category: 'Non-Kopi',
        price: 20000,
        description: 'Teh hitam melati wangi dengan sirup leci dan buah leci asli manis menyegarkan.',
        photo_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 8,
        name: 'Lemonade Mint Sparkler',
        category: 'Non-Kopi',
        price: 21000,
        description: 'Perasan lemon segar, daun mint aromatik, dan soda sparkling dingin pelepas dahaga.',
        photo_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },

      // Makanan Utama
      {
        item_id: 9,
        name: 'Nasi Goreng Spesial Cafe',
        category: 'Makanan',
        price: 32000,
        description: 'Nasi goreng bumbu rempah istimewa dengan suwiran ayam, sosis, telur mata sapi, dan kerupuk.',
        photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 10,
        name: 'Chicken Katsu Curry Rice',
        category: 'Makanan',
        price: 36000,
        description: 'Dada ayam krispi tebal dengan saus kari Jepang aromatik gurih di atas nasi pulen hangat.',
        photo_url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 11,
        name: 'Spaghetti Creamy Carbonara',
        category: 'Makanan',
        price: 35000,
        description: 'Pasta spaghetti al dente berlumur saus krim telur, parmesan cheese, dan smoked beef gurih.',
        photo_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 12,
        name: 'Beef Burger & French Fries',
        category: 'Makanan',
        price: 38000,
        description: 'Patty daging sapi panggang juicy, keju cheddar leleh, selada segar, dan kentang goreng garing.',
        photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },

      // Snack & Camilan
      {
        item_id: 13,
        name: 'French Fries Truffle Herb',
        category: 'Snack',
        price: 20000,
        description: 'Kentang goreng renyah bumbu truffle oil, taburan rosemary, parsley, dan saus tartar.',
        photo_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 14,
        name: 'Tahu Walik Krispi Sambal Kecap',
        category: 'Snack',
        price: 18000,
        description: 'Tahu goreng isi adonan ayam kenyal krispi disajikan dengan cocolan sambal kecap pedas gurih.',
        photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 15,
        name: 'Dimsum Ayam Jamur (4 Pcs)',
        category: 'Snack',
        price: 22000,
        description: 'Dimsum siomay ayam jamur kukus lembut juicy dengan chili oil gurih pedas nampol.',
        photo_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 16,
        name: 'Cireng Krispi Bumbu Rujak',
        category: 'Snack',
        price: 16000,
        description: 'Cireng renyah di luar kenyal di dalam dengan saus gula merah rujak pedas manis asam segar.',
        photo_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },

      // Dessert
      {
        item_id: 17,
        name: 'Croissant Butter Almond',
        category: 'Dessert',
        price: 24000,
        description: 'Pastry renyah berlapis harum mentega Prancis dengan filling krim almond dan taburan kacang.',
        photo_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      },
      {
        item_id: 18,
        name: 'Basque Burnt Cheesecake',
        category: 'Dessert',
        price: 28000,
        description: 'Cake keju panggang khas Spanyol dengan tekstur creamy lumer dan karamelisasi harum.',
        photo_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60',
        stock_status: 'tersedia'
      }
    ];

    // Seed 1 sample active session on Meja 02 for realistic demo out-of-the-box
    const sampleSessionId = 'd892a014-41d3-4927-94d3-0d58546b3f9a';
    this.state.tables[1].status = 'terisi';
    this.state.sessions.push({
      session_id: sampleSessionId,
      table_id: 2,
      start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      end_time: null,
      status: 'aktif'
    });

    const sampleOrderId = 1;
    this.state.orders.push({
      order_id: sampleOrderId,
      session_id: sampleSessionId,
      order_time: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      status: 'diproses',
      channel: 'self_order'
    });

    this.state.order_items.push(
      {
        order_item_id: 1,
        order_id: sampleOrderId,
        item_id: 1,
        quantity: 2,
        notes: 'Less ice, normal sugar',
        subtotal: 44000
      },
      {
        order_item_id: 2,
        order_id: sampleOrderId,
        item_id: 9,
        quantity: 1,
        notes: 'Pedas sedang, telur setengah matang',
        subtotal: 32000
      },
      {
        order_item_id: 3,
        order_id: sampleOrderId,
        item_id: 13,
        quantity: 1,
        notes: 'Saus dipisah',
        subtotal: 20000
      }
    );

    // Seed some historical completed transactions for reports and graphs
    this.seedHistoricalTransactions();

    this.state.nextIds = {
      user: 4,
      table: 13,
      menu_item: 19,
      order: 10,
      order_item: 25,
      payment: 6,
      stock_log: 3,
      cancel_log: 3
    };

    // Initial Stock log sample
    this.state.stock_changes_log = [
      {
        log_id: 1,
        item_id: 2,
        item_name: 'Caramel Macchiato Ice',
        old_status: 'habis',
        new_status: 'tersedia',
        changed_by: 2,
        changed_by_name: 'Siti Rahma',
        reason: 'Restock sirup karamel baru dari supplier',
        changed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        log_id: 2,
        item_id: 18,
        item_name: 'Basque Burnt Cheesecake',
        old_status: 'tersedia',
        new_status: 'tersedia',
        changed_by: 1,
        changed_by_name: 'Budi Santoso (Owner)',
        reason: 'Pengecekan stok batch pagi',
        changed_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ];

    // Initial Order Cancel audit logs sample
    this.state.order_cancel_logs = [
      {
        log_id: 1,
        order_id: 991,
        session_id: 'sample-cancelled-session-1',
        table_number: 'Meja 06',
        channel: 'self_order',
        cancelled_by: 2,
        cancelled_by_name: 'Siti Rahma (Kasir)',
        reason: 'Customer terburu-buru ada panggilan mendadak sebelum makanan sempat dimasak.',
        reason_category: 'Pelanggan Buru-Buru / Pergi',
        cancelled_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        total_amount: 54000,
        items_summary: '1x Spaghetti Creamy Carbonara, 1x Iced Lemon Mint Mocktail',
        items: [
          {
            item_name: 'Spaghetti Creamy Carbonara',
            quantity: 1,
            unit_price: 35000,
            subtotal: 35000,
            notes: 'Extra creamy'
          },
          {
            item_name: 'Iced Lemon Mint Mocktail',
            quantity: 1,
            unit_price: 19000,
            subtotal: 19000,
            notes: 'Less ice'
          }
        ]
      },
      {
        log_id: 2,
        order_id: 992,
        session_id: 'sample-cancelled-session-2',
        table_number: 'Meja 08',
        channel: 'pos_manual',
        cancelled_by: 3,
        cancelled_by_name: 'Ahmad Fauzi (Kasir)',
        reason: 'Salah klik varian menu saat input pesanan di POS tablet, diganti order baru.',
        reason_category: 'Salah Input oleh Kasir',
        cancelled_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        total_amount: 38000,
        items_summary: '1x Beef Burger & French Fries',
        items: [
          {
            item_name: 'Beef Burger & French Fries',
            quantity: 1,
            unit_price: 38000,
            subtotal: 38000,
            notes: 'Salah meja'
          }
        ]
      }
    ];
  }

  private seedHistoricalTransactions() {
    const today = new Date();
    
    // Create 4 historical completed sessions with payments over today & recent days
    const pastData = [
      {
        tableId: 3,
        tableNum: 'Meja 03',
        hoursAgo: 4,
        channel: 'self_order' as const,
        method: 'QRIS' as const,
        items: [
          { itemId: 1, qty: 2, price: 22000, notes: '' },
          { itemId: 11, qty: 1, price: 35000, notes: 'Extra cheese' }
        ]
      },
      {
        tableId: 5,
        tableNum: 'Meja 05',
        hoursAgo: 6,
        channel: 'pos_manual' as const,
        method: 'tunai' as const,
        items: [
          { itemId: 2, qty: 1, price: 28000, notes: '' },
          { itemId: 10, qty: 2, price: 36000, notes: '' },
          { itemId: 17, qty: 1, price: 24000, notes: '' }
        ]
      },
      {
        tableId: 1,
        tableNum: 'Meja 01',
        hoursAgo: 24,
        channel: 'self_order' as const,
        method: 'EDC' as const,
        items: [
          { itemId: 5, qty: 2, price: 26000, notes: 'Hot' },
          { itemId: 12, qty: 1, price: 38000, notes: 'No pickle' },
          { itemId: 15, qty: 1, price: 22000, notes: '' }
        ]
      },
      {
        tableId: 4,
        tableNum: 'Meja 04',
        hoursAgo: 48,
        channel: 'self_order' as const,
        method: 'QRIS' as const,
        items: [
          { itemId: 3, qty: 2, price: 18000, notes: 'Ice' },
          { itemId: 9, qty: 2, price: 32000, notes: '' }
        ]
      }
    ];

    pastData.forEach((pd, idx) => {
      const sessId = crypto.randomUUID();
      const sessTime = new Date(Date.now() - pd.hoursAgo * 3600 * 1000);
      const endTime = new Date(sessTime.getTime() + 50 * 60 * 1000);
      const ordId = idx + 2;
      const payId = idx + 1;

      this.state.sessions.push({
        session_id: sessId,
        table_id: pd.tableId,
        start_time: sessTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'ditutup'
      });

      this.state.orders.push({
        order_id: ordId,
        session_id: sessId,
        order_time: sessTime.toISOString(),
        status: 'selesai',
        channel: pd.channel
      });

      let subtotal = 0;
      pd.items.forEach((it, iIdx) => {
        const itemSubtotal = it.qty * it.price;
        subtotal += itemSubtotal;
        this.state.order_items.push({
          order_item_id: idx * 10 + iIdx + 4,
          order_id: ordId,
          item_id: it.itemId,
          quantity: it.qty,
          notes: it.notes,
          subtotal: itemSubtotal
        });
      });

      const service = Math.round((subtotal * 5) / 100);
      const tax = Math.round(((subtotal + service) * 10) / 100);
      const total = subtotal + service + tax;
      const nominal = pd.method === 'tunai' ? Math.ceil(total / 10000) * 10000 : total;

      this.state.payments.push({
        payment_id: payId,
        session_id: sessId,
        payment_method: pd.method,
        nominal,
        payment_time: endTime.toISOString(),
        kasir_id: 2,
        subtotal,
        service_charge: service,
        tax,
        total,
        cashier_name: 'Siti Rahma',
        table_number: pd.tableNum,
        change: nominal - total
      });
    });
  }

  // --- Users ---
  getUsers(): User[] {
    return this.state.users.map(u => ({ ...u }));
  }

  getUserById(id: number): User | undefined {
    return this.state.users.find(u => u.user_id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(userData: Omit<User, 'user_id' | 'created_at'>): User {
    const user_id = this.state.nextIds.user++;
    const newUser: User = {
      ...userData,
      user_id,
      created_at: new Date().toISOString()
    };
    this.state.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const index = this.state.users.findIndex(u => u.user_id === id);
    if (index === -1) return null;
    this.state.users[index] = { ...this.state.users[index], ...updates };
    this.save();
    return this.state.users[index];
  }

  deleteUser(id: number): boolean {
    const initialLen = this.state.users.length;
    this.state.users = this.state.users.filter(u => u.user_id !== id);
    if (this.state.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Tables ---
  getTables(): (Table & { active_session_id?: string; active_session_start?: string; current_order_count?: number; current_bill_total?: number })[] {
    return this.state.tables.map(table => {
      const activeSession = this.state.sessions.find(s => s.table_id === table.table_id && s.status === 'aktif');
      let orderCount = 0;
      let billTotal = 0;

      if (activeSession) {
        const sessionOrders = this.state.orders.filter(o => o.session_id === activeSession.session_id && o.status !== 'dibatalkan');
        orderCount = sessionOrders.length;
        const orderIds = sessionOrders.map(o => o.order_id);
        const items = this.state.order_items.filter(oi => orderIds.includes(oi.order_id));
        billTotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      }

      return {
        ...table,
        active_session_id: activeSession ? activeSession.session_id : undefined,
        active_session_start: activeSession ? activeSession.start_time : undefined,
        current_order_count: orderCount,
        current_bill_total: billTotal
      };
    });
  }

  getTableById(id: number): Table | undefined {
    return this.state.tables.find(t => t.table_id === id);
  }

  createTable(tableNumber: string, capacity?: number, area?: string): Table {
    const table_id = this.state.nextIds.table++;
    const newTable: Table = {
      table_id,
      table_number: tableNumber,
      capacity: capacity ? Number(capacity) : 4,
      area: area || 'Area Indoor',
      status: 'kosong'
    };
    this.state.tables.push(newTable);
    this.save();
    return newTable;
  }

  updateTableStatus(tableId: number, status: 'kosong' | 'terisi'): Table | null {
    const table = this.state.tables.find(t => t.table_id === tableId);
    if (!table) return null;
    table.status = status;
    this.save();
    return table;
  }

  deleteTable(tableId: number): boolean {
    const hasActiveSession = this.state.sessions.some(s => s.table_id === tableId && s.status === 'aktif');
    if (hasActiveSession) return false;
    this.state.tables = this.state.tables.filter(t => t.table_id !== tableId);
    this.save();
    return true;
  }

  // --- Menu Items ---
  getMenuItems(includeUnavailable = true): MenuItem[] {
    if (includeUnavailable) {
      return [...this.state.menu_items];
    }
    return this.state.menu_items.filter(item => item.stock_status === 'tersedia');
  }

  getMenuItemById(id: number): MenuItem | undefined {
    return this.state.menu_items.find(m => m.item_id === id);
  }

  createMenuItem(item: Omit<MenuItem, 'item_id'>): MenuItem {
    const item_id = this.state.nextIds.menu_item++;
    const newItem: MenuItem = {
      ...item,
      item_id
    };
    this.state.menu_items.push(newItem);
    this.save();
    return newItem;
  }

  updateMenuItem(id: number, updates: Partial<MenuItem>): MenuItem | null {
    const index = this.state.menu_items.findIndex(m => m.item_id === id);
    if (index === -1) return null;
    this.state.menu_items[index] = { ...this.state.menu_items[index], ...updates };
    this.save();
    return this.state.menu_items[index];
  }

  deleteMenuItem(id: number): boolean {
    const len = this.state.menu_items.length;
    this.state.menu_items = this.state.menu_items.filter(m => m.item_id !== id);
    if (this.state.menu_items.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  updateStockStatus(itemId: number, newStatus: 'tersedia' | 'habis', changedByUserId: number, reason: string = ''): MenuItem | null {
    const item = this.state.menu_items.find(m => m.item_id === itemId);
    if (!item) return null;

    const oldStatus = item.stock_status;
    item.stock_status = newStatus;

    const user = this.getUserById(changedByUserId);
    const log_id = this.state.nextIds.stock_log++;
    this.state.stock_changes_log.unshift({
      log_id,
      item_id: itemId,
      item_name: item.name,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedByUserId,
      changed_by_name: user ? user.name : 'Sistem POS',
      reason: reason || (newStatus === 'habis' ? 'Stok habis di dapur' : 'Stok kembali tersedia'),
      changed_at: new Date().toISOString()
    });

    this.save();
    return item;
  }

  // --- Sessions ---
  getActiveSessions() {
    const config = this.getTaxServiceConfig();
    return this.state.sessions
      .filter(s => s.status === 'aktif')
      .map(s => {
        const table = this.getTableById(s.table_id);
        const orders = this.getOrdersBySession(s.session_id);
        let subtotal = 0;
        let activeOrdersCount = 0;
        orders.forEach(ord => {
          if (ord.status !== 'dibatalkan') {
            activeOrdersCount++;
            (ord.items || []).forEach(item => {
              subtotal += Number(item.subtotal || 0);
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

        return {
          ...s,
          table_number: table ? table.table_number : `Meja #${s.table_id}`,
          orders_count: activeOrdersCount,
          subtotal,
          service_charge: serviceCharge,
          tax,
          total_amount: total
        };
      });
  }

  getSessionById(sessionId: string): (Session & { table_number?: string; table?: Table }) | null {
    const session = this.state.sessions.find(s => s.session_id === sessionId);
    if (!session) return null;
    const table = this.getTableById(session.table_id);
    return {
      ...session,
      table_number: table ? table.table_number : undefined,
      table
    };
  }

  createSession(tableId: number): Session & { table_number: string } {
    // Check if table exists
    const table = this.getTableById(tableId);
    if (!table) {
      throw new Error('Meja tidak ditemukan');
    }

    // Check if there is already an active session on this table
    const existing = this.state.sessions.find(s => s.table_id === tableId && s.status === 'aktif');
    if (existing) {
      return {
        ...existing,
        table_number: table.table_number
      };
    }

    const session_id = crypto.randomUUID();
    const newSession: Session = {
      session_id,
      table_id: tableId,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'aktif'
    };

    this.state.sessions.push(newSession);
    this.updateTableStatus(tableId, 'terisi');
    this.save();

    return {
      ...newSession,
      table_number: table.table_number
    };
  }

  closeSession(sessionId: string, paymentData: { payment_method: 'tunai' | 'QRIS' | 'EDC'; nominal: number; kasir_id: number }) {
    const session = this.state.sessions.find(s => s.session_id === sessionId);
    if (!session) throw new Error('Sesi tidak ditemukan');
    if (session.status === 'ditutup') throw new Error('Sesi sudah ditutup sebelumnya');

    const table = this.getTableById(session.table_id);
    const cashier = this.getUserById(paymentData.kasir_id);
    const config = this.getTaxServiceConfig();

    // Calculate subtotal from non-cancelled orders
    const orders = this.getOrdersBySession(sessionId);
    let subtotal = 0;
    orders.forEach(ord => {
      if (ord.status !== 'dibatalkan') {
        ord.items.forEach(item => {
          subtotal += Number(item.subtotal);
        });
      }
    });

    const service_charge = config.is_service_active
      ? Math.round((subtotal * config.service_charge_percentage) / 100)
      : 0;

    const tax = config.is_tax_active
      ? Math.round(((subtotal + service_charge) * config.tax_percentage) / 100)
      : 0;

    const total = subtotal + service_charge + tax;

    if (total > 0 && paymentData.payment_method === 'tunai' && paymentData.nominal < total) {
      throw new Error(`Nominal pembayaran tunai (Rp ${paymentData.nominal.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${total.toLocaleString('id-ID')})`);
    }

    const change = paymentData.payment_method === 'tunai' ? Math.max(0, paymentData.nominal - total) : 0;

    // Mark session as closed
    session.status = 'ditutup';
    session.end_time = new Date().toISOString();

    // Mark all pending orders as selesai
    this.state.orders.forEach(o => {
      if (o.session_id === sessionId && (o.status === 'menunggu' || o.status === 'diproses')) {
        o.status = 'selesai';
      }
    });

    // Reset table status to kosong
    this.updateTableStatus(session.table_id, 'kosong');

    // Create payment record
    const payment_id = this.state.nextIds.payment++;
    const newPayment: Payment = {
      payment_id,
      session_id: sessionId,
      payment_method: paymentData.payment_method,
      nominal: paymentData.nominal,
      payment_time: new Date().toISOString(),
      kasir_id: paymentData.kasir_id,
      subtotal,
      service_charge,
      tax,
      total,
      cashier_name: cashier ? cashier.name : 'Kasir',
      table_number: table ? table.table_number : `Meja #${session.table_id}`,
      change
    };

    this.state.payments.push(newPayment);
    this.save();

    return {
      session,
      payment: newPayment,
      orders
    };
  }

  closeSessionWithoutPayment(sessionId: string, data?: { cashier_id?: number; reason?: string }) {
    const session = this.state.sessions.find(s => s.session_id === sessionId);
    if (!session) throw new Error('Sesi tidak ditemukan');
    if (session.status === 'ditutup') throw new Error('Sesi sudah ditutup sebelumnya');

    const table = this.getTableById(session.table_id);
    const cashierId = data?.cashier_id || 2;
    const cashier = this.getUserById(cashierId);
    const reason = data?.reason || 'Customer batal memesan / meja dikosongkan langsung';

    // Cancel any active / pending / processing orders that were not yet cancelled
    this.state.orders.forEach(o => {
      if (o.session_id === sessionId && o.status !== 'dibatalkan' && o.status !== 'selesai') {
        try {
          this.cancelOrder(o.order_id, {
            reason,
            reason_category: 'Pelanggan Batal / Pergi',
            cancelled_by: cashierId,
            cancelled_by_name: cashier ? cashier.name : 'Kasir POS'
          });
        } catch (e) {
          o.status = 'dibatalkan';
        }
      }
    });

    // Mark session as closed
    session.status = 'ditutup';
    session.end_time = new Date().toISOString();

    // Reset table status to kosong
    this.updateTableStatus(session.table_id, 'kosong');

    this.save();

    return {
      session,
      table,
      message: 'Sesi meja berhasil ditutup dan meja telah dikosongkan tanpa pembayaran'
    };
  }

  // --- Orders & Order Items ---
  createOrder(data: { session_id: string; channel: 'self_order' | 'pos_manual'; items: { item_id: number; quantity: number; notes?: string }[] }) {
    const session = this.state.sessions.find(s => s.session_id === data.session_id);
    if (!session) throw new Error('Sesi meja tidak valid');
    if (session.status !== 'aktif') throw new Error('Sesi meja telah ditutup. Tidak dapat membuat pesanan baru.');

    if (!data.items || data.items.length === 0) {
      throw new Error('Daftar pesanan tidak boleh kosong');
    }

    const order_id = this.state.nextIds.order++;
    const newOrder: Order = {
      order_id,
      session_id: data.session_id,
      order_time: new Date().toISOString(),
      status: 'menunggu',
      channel: data.channel
    };

    this.state.orders.push(newOrder);

    const createdItems: OrderItem[] = [];

    for (const itemInput of data.items) {
      const menuItem = this.getMenuItemById(itemInput.item_id);
      if (!menuItem) throw new Error(`Menu item #${itemInput.item_id} tidak ditemukan`);
      if (menuItem.stock_status === 'habis') {
        throw new Error(`Menu "${menuItem.name}" sedang habis.`);
      }

      const order_item_id = this.state.nextIds.order_item++;
      const subtotal = Number(menuItem.price) * itemInput.quantity;

      const orderItem: OrderItem = {
        order_item_id,
        order_id,
        item_id: itemInput.item_id,
        quantity: itemInput.quantity,
        notes: itemInput.notes || '',
        subtotal,
        item_name: menuItem.name,
        item_price: menuItem.price,
        item_category: menuItem.category
      };

      this.state.order_items.push(orderItem);
      createdItems.push(orderItem);
    }

    this.save();

    const table = this.getTableById(session.table_id);

    return {
      ...newOrder,
      table_number: table ? table.table_number : `Meja #${session.table_id}`,
      items: createdItems
    };
  }

  getOrdersBySession(sessionId: string) {
    const sessionOrders = this.state.orders.filter(o => o.session_id === sessionId);
    return sessionOrders.map(order => {
      const items = this.state.order_items
        .filter(oi => oi.order_id === order.order_id)
        .map(oi => {
          const menuItem = this.getMenuItemById(oi.item_id);
          return {
            ...oi,
            item_name: menuItem ? menuItem.name : 'Item Terhapus',
            item_price: menuItem ? menuItem.price : 0,
            item_category: menuItem ? menuItem.category : ''
          };
        });

      return {
        ...order,
        items
      };
    });
  }

  updateOrderStatus(orderId: number, status: 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan'): Order | null {
    const order = this.state.orders.find(o => o.order_id === orderId);
    if (!order) return null;
    order.status = status;
    this.save();
    return order;
  }

  cancelOrder(orderId: number, data: {
    reason: string;
    reason_category?: string;
    cancelled_by: number;
    cancelled_by_name?: string;
  }) {
    const order = this.state.orders.find(o => o.order_id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    if (order.status === 'dibatalkan') throw new Error('Pesanan sudah dibatalkan sebelumnya');

    const session = this.getSessionById(order.session_id);
    const user = this.getUserById(data.cancelled_by);
    const userName = data.cancelled_by_name || (user ? user.name : 'Kasir POS');
    const category = data.reason_category || 'Pelanggan Batal Order';
    const now = new Date().toISOString();

    order.status = 'dibatalkan';
    order.cancel_reason = data.reason;
    order.cancel_reason_category = category;
    order.cancelled_by = data.cancelled_by;
    order.cancelled_by_name = userName;
    order.cancelled_at = now;

    // Fetch items of the order for audit summary
    const orderItems = this.state.order_items
      .filter(oi => oi.order_id === orderId)
      .map(oi => {
        const menuItem = this.getMenuItemById(oi.item_id);
        return {
          item_name: menuItem ? menuItem.name : (oi.item_name || `Item #${oi.item_id}`),
          quantity: oi.quantity,
          unit_price: Number(oi.item_price || (menuItem ? menuItem.price : 0)),
          subtotal: Number(oi.subtotal),
          notes: oi.notes || ''
        };
      });

    const totalAmount = orderItems.reduce((sum, it) => sum + it.subtotal, 0);
    const itemsSummary = orderItems.map(it => `${it.quantity}x ${it.item_name}`).join(', ');

    if (!this.state.nextIds.cancel_log) {
      this.state.nextIds.cancel_log = 1;
    }

    const cancelLog: OrderCancelLog = {
      log_id: this.state.nextIds.cancel_log++,
      order_id: orderId,
      session_id: order.session_id,
      table_number: session && session.table ? session.table.table_number : `Meja #${session ? session.table_id : '-'}`,
      channel: order.channel,
      cancelled_by: data.cancelled_by,
      cancelled_by_name: userName,
      reason: data.reason,
      reason_category: category,
      cancelled_at: now,
      total_amount: totalAmount,
      items_summary: itemsSummary,
      items: orderItems
    };

    if (!this.state.order_cancel_logs) {
      this.state.order_cancel_logs = [];
    }
    this.state.order_cancel_logs.unshift(cancelLog);

    this.save();
    return {
      order,
      cancelLog
    };
  }

  getOrderCancelLogs(): OrderCancelLog[] {
    if (!this.state.order_cancel_logs) {
      this.state.order_cancel_logs = [];
    }
    return [...this.state.order_cancel_logs].sort(
      (a, b) => new Date(b.cancelled_at).getTime() - new Date(a.cancelled_at).getTime()
    );
  }

  // --- Reports & Config ---
  getCafeProfile(): CafeProfile {
    if (!this.state.cafe_profile) {
      this.state.cafe_profile = {
        cafe_name: 'KAFE & RESTO KITA',
        tagline: 'Sistem POS & Layanan Pemesanan Meja',
        address: 'Jl. Utama No. 12, Pusat Kota',
        phone: '0812-3456-7890',
        email: 'kontak@kaferesto.id',
        instagram: '@kaferestokita',
        wifi_ssid: 'KafeResto_Guest_5G',
        wifi_password: 'selamatmenikmati',
        receipt_footer: 'Terima kasih atas kunjungan Anda! Selamat menikmati hidangan.',
        logo_icon: 'Coffee',
        operating_hours: 'Setiap Hari (08:00 - 23:00 WIB)'
      };
    }
    return { ...this.state.cafe_profile };
  }

  updateCafeProfile(profile: Partial<CafeProfile>): CafeProfile {
    const current = this.getCafeProfile();
    this.state.cafe_profile = {
      ...current,
      ...profile
    };
    this.save();
    return { ...this.state.cafe_profile };
  }

  getTaxServiceConfig(): TaxServiceConfig {
    return { ...this.state.tax_service_config };
  }

  updateTaxServiceConfig(config: Partial<TaxServiceConfig>): TaxServiceConfig {
    this.state.tax_service_config = {
      ...this.state.tax_service_config,
      ...config,
      effective_date: new Date().toISOString()
    };
    this.save();
    return { ...this.state.tax_service_config };
  }

  getStockLogs(): StockChangeLog[] {
    return [...this.state.stock_changes_log];
  }

  getPayments(): Payment[] {
    return [...this.state.payments].sort((a, b) => new Date(b.payment_time).getTime() - new Date(a.payment_time).getTime());
  }

  getSalesReport(range: 'today' | 'week' | 'month' | 'all' = 'today') {
    const now = new Date();
    let startDate: Date;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    } else {
      startDate = new Date(0);
    }

    const filteredPayments = this.state.payments.filter(p => new Date(p.payment_time) >= startDate);

    const totalSales = filteredPayments.reduce((acc, p) => acc + Number(p.total), 0);
    const totalSubtotal = filteredPayments.reduce((acc, p) => acc + Number(p.subtotal), 0);
    const totalTax = filteredPayments.reduce((acc, p) => acc + Number(p.tax), 0);
    const totalService = filteredPayments.reduce((acc, p) => acc + Number(p.service_charge), 0);
    const transactionCount = filteredPayments.length;
    const avgOrderValue = transactionCount > 0 ? Math.round(totalSales / transactionCount) : 0;

    // Payment methods breakdown
    const paymentMethods: Record<string, { count: number; total: number }> = {
      tunai: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      EDC: { count: 0, total: 0 }
    };

    filteredPayments.forEach(p => {
      if (paymentMethods[p.payment_method]) {
        paymentMethods[p.payment_method].count += 1;
        paymentMethods[p.payment_method].total += Number(p.total);
      }
    });

    // Top selling items
    const sessionIds = filteredPayments.map(p => p.session_id);
    const orderIds = this.state.orders.filter(o => sessionIds.includes(o.session_id) && o.status !== 'dibatalkan').map(o => o.order_id);
    const items = this.state.order_items.filter(oi => orderIds.includes(oi.order_id));

    const itemAggregates: Record<number, { item_id: number; name: string; category: string; quantity: number; revenue: number }> = {};

    items.forEach(oi => {
      const menuItem = this.getMenuItemById(oi.item_id);
      if (!itemAggregates[oi.item_id]) {
        itemAggregates[oi.item_id] = {
          item_id: oi.item_id,
          name: menuItem ? menuItem.name : `Item #${oi.item_id}`,
          category: menuItem ? menuItem.category : 'Lainnya',
          quantity: 0,
          revenue: 0
        };
      }
      itemAggregates[oi.item_id].quantity += oi.quantity;
      itemAggregates[oi.item_id].revenue += Number(oi.subtotal);
    });

    const topItems = Object.values(itemAggregates).sort((a, b) => b.quantity - a.quantity);

    // Sales by category
    const categorySales: Record<string, number> = {};
    topItems.forEach(it => {
      categorySales[it.category] = (categorySales[it.category] || 0) + it.revenue;
    });

    // Hourly / Daily breakdown for charts
    const chartData: { label: string; sales: number; transactions: number }[] = [];
    if (range === 'today') {
      // 8AM to 10PM hourly
      for (let hour = 8; hour <= 22; hour += 2) {
        const hourLabel = `${hour < 10 ? '0' + hour : hour}:00`;
        const hourSales = filteredPayments
          .filter(p => {
            const h = new Date(p.payment_time).getHours();
            return h >= hour && h < hour + 2;
          })
          .reduce((sum, p) => sum + Number(p.total), 0);

        const count = filteredPayments.filter(p => {
          const h = new Date(p.payment_time).getHours();
          return h >= hour && h < hour + 2;
        }).length;

        chartData.push({
          label: hourLabel,
          sales: hourSales,
          transactions: count
        });
      }
    } else {
      // Daily breakdown
      const daysCount = range === 'week' ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const dayKey = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 24 * 3600 * 1000;

        const dayPayments = filteredPayments.filter(p => {
          const pt = new Date(p.payment_time).getTime();
          return pt >= dayStart && pt < dayEnd;
        });

        chartData.push({
          label: dayKey,
          sales: dayPayments.reduce((sum, p) => sum + Number(p.total), 0),
          transactions: dayPayments.length
        });
      }
    }

    return {
      range,
      totalSales,
      totalSubtotal,
      totalTax,
      totalService,
      transactionCount,
      avgOrderValue,
      paymentMethods,
      topItems: topItems.slice(0, 10),
      categorySales,
      chartData,
      recentPayments: filteredPayments.slice(0, 20)
    };
  }
}

export const db = new DatabaseService();
