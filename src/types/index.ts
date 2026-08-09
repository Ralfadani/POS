export interface User {
  user_id: number;
  name: string;
  role: 'kasir' | 'admin';
  username: string;
  created_at?: string;
}

export interface Table {
  table_id: number;
  table_number: string;
  capacity?: number;
  area?: string;
  status: 'kosong' | 'terisi';
  active_session_id?: string;
  active_session_start?: string;
  current_order_count?: number;
  current_bill_total?: number;
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
  session_id: string;
  table_id: number;
  table_number?: string;
  start_time: string;
  end_time: string | null;
  status: 'aktif' | 'ditutup';
  orders_count?: number;
  subtotal?: number;
  total_amount?: number;
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

export interface Order {
  order_id: number;
  session_id: string;
  order_time: string;
  created_at?: string;
  status: 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan';
  channel: 'self_order' | 'pos_manual';
  cancel_reason?: string;
  cancel_reason_category?: string;
  cancelled_by_name?: string;
  cancelled_at?: string;
  table_number?: string;
  items: OrderItem[];
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

export interface CalculationBreakdown {
  subtotal: number;
  service_charge_rate: number;
  is_service_active: boolean;
  service_charge: number;
  tax_rate: number;
  is_tax_active: boolean;
  tax: number;
  total: number;
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

export interface SalesReport {
  range: string;
  totalSales: number;
  totalSubtotal: number;
  totalTax: number;
  totalService: number;
  transactionCount: number;
  avgOrderValue: number;
  paymentMethods: Record<string, { count: number; total: number }>;
  topItems: { item_id: number; name: string; category: string; quantity: number; revenue: number }[];
  categorySales: Record<string, number>;
  chartData: { label: string; sales: number; transactions: number }[];
  recentPayments: Payment[];
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}
