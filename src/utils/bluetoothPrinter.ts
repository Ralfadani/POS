import { PrintReceiptData } from './thermalPrinter.js';
import { formatRupiah, formatDateTime } from './formatters.js';

export interface BluetoothPrinterConfig {
  deviceName: string;
  deviceId: string;
  paperWidth: '58mm' | '80mm';
  autoPrintReceipt: boolean;
  autoPrintKitchen: boolean;
  copies: number;
  separatorChar: '-' | '=';
}

const DEFAULT_CONFIG: BluetoothPrinterConfig = {
  deviceName: '',
  deviceId: '',
  paperWidth: '58mm',
  autoPrintReceipt: true,
  autoPrintKitchen: false,
  copies: 1,
  separatorChar: '-'
};

const STORAGE_KEY = 'pos_bluetooth_printer_config';

// Global state for active GATT connection
let activeDevice: BluetoothDevice | null = null;
let activeGattServer: BluetoothRemoteGATTServer | null = null;
let activeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let connectionListeners: Array<(connected: boolean, deviceName: string) => void> = [];

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function getStoredPrinterConfig(): BluetoothPrinterConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error loading printer config:', err);
  }
  return DEFAULT_CONFIG;
}

export function savePrinterConfig(config: Partial<BluetoothPrinterConfig>): BluetoothPrinterConfig {
  const current = getStoredPrinterConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving printer config:', err);
  }
  return updated;
}

export function subscribePrinterStatus(listener: (connected: boolean, deviceName: string) => void) {
  connectionListeners.push(listener);
  listener(isPrinterConnected(), activeDevice?.name || getStoredPrinterConfig().deviceName || '');
  return () => {
    connectionListeners = connectionListeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  const connected = isPrinterConnected();
  const name = activeDevice?.name || getStoredPrinterConfig().deviceName || '';
  connectionListeners.forEach(listener => listener(connected, name));
}

export function isPrinterConnected(): boolean {
  return Boolean(activeDevice && activeGattServer && activeGattServer.connected && activeCharacteristic);
}

export function getActivePrinterName(): string {
  if (activeDevice && activeDevice.name) return activeDevice.name;
  const cfg = getStoredPrinterConfig();
  return cfg.deviceName || 'Printer Tidak Terhubung';
}

/**
 * Common Bluetooth Thermal Printer Service UUIDs
 */
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Thermal Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posnet / Xprinter
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic ESC/POS
  '0000ae01-0000-1000-8000-00805f9b34fb', // Custom POS Service
  '00001101-0000-0000-0000-00805f9b34fb'  // SPP Serial Port Profile
];

/**
 * Connect to a Bluetooth thermal printer via Web Bluetooth API
 */
export async function scanAndConnectBluetoothPrinter(): Promise<{ success: boolean; deviceName?: string; message?: string }> {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      message: 'Web Bluetooth API tidak didukung di browser ini. Gunakan Google Chrome / Microsoft Edge di Android/Desktop.'
    };
  }

  try {
    // Disconnect previous device if any
    if (activeDevice && activeDevice.gatt?.connected) {
      activeDevice.gatt.disconnect();
    }

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES
    });

    if (!device) {
      return { success: false, message: 'Pemilihan perangkat dibatalkan.' };
    }

    device.addEventListener('gattserverdisconnected', () => {
      console.warn('Bluetooth printer disconnected.');
      activeCharacteristic = null;
      notifyListeners();
    });

    const server = await device.gatt?.connect();
    if (!server) {
      return { success: false, message: 'Gagal terhubung ke GATT server printer.' };
    }

    // Try finding write characteristic
    let foundChar: BluetoothRemoteGATTCharacteristic | null = null;
    const services = await server.getPrimaryServices().catch(() => []);

    for (const service of services) {
      const characteristics = await service.getCharacteristics().catch(() => []);
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          foundChar = char;
          break;
        }
      }
      if (foundChar) break;
    }

    if (!foundChar) {
      // Direct characteristic fallback attempt
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundChar = char;
              break;
            }
          }
        } catch (_) {}
        if (foundChar) break;
      }
    }

    if (!foundChar) {
      server.disconnect();
      return {
        success: false,
        message: `Terhubung ke ${device.name || 'Device'}, tetapi karakteristik penulisan ESC/POS tidak ditemukan.`
      };
    }

    activeDevice = device;
    activeGattServer = server;
    activeCharacteristic = foundChar;

    savePrinterConfig({
      deviceName: device.name || 'Bluetooth Thermal Printer',
      deviceId: device.id
    });

    notifyListeners();

    return {
      success: true,
      deviceName: device.name || 'Bluetooth Thermal Printer',
      message: `Berhasil terhubung ke ${device.name || 'Printer Bluetooth'}`
    };
  } catch (err: any) {
    console.error('Bluetooth connection error:', err);
    notifyListeners();
    return {
      success: false,
      message: err.message || 'Gagal menghubungkan printer Bluetooth.'
    };
  }
}

export function disconnectBluetoothPrinter() {
  if (activeDevice && activeDevice.gatt?.connected) {
    activeDevice.gatt.disconnect();
  }
  activeDevice = null;
  activeGattServer = null;
  activeCharacteristic = null;
  notifyListeners();
}

/**
 * Send binary ESC/POS data buffer to Bluetooth characteristic in chunks
 */
async function sendRawEscPosData(buffer: Uint8Array): Promise<boolean> {
  if (!activeCharacteristic) {
    throw new Error('Printer Bluetooth belum terhubung.');
  }

  const CHUNK_SIZE = 64; // Safe chunk size for BLE MTU
  for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
    const chunk = buffer.subarray(i, i + CHUNK_SIZE);
    if (activeCharacteristic.properties.writeWithoutResponse) {
      await activeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await activeCharacteristic.writeValue(chunk);
    }
    // Small delay to prevent Bluetooth buffer overload
    await new Promise(res => setTimeout(res, 25));
  }
  return true;
}

/**
 * ESC/POS Command Encoder Helper
 */
class EscPosEncoder {
  private buffer: number[] = [];

  // Initialize printer (ESC @)
  init() {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // Set alignment: 0=Left, 1=Center, 2=Right (ESC a n)
  align(align: 'left' | 'center' | 'right') {
    const n = align === 'left' ? 0 : align === 'center' ? 1 : 2;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  // Set text size (GS ! n)
  textSize(width: number = 1, height: number = 1) {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  // Bold text toggle (ESC E n)
  bold(enable: boolean = true) {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  // Print text string
  text(str: string) {
    const bytes = new TextEncoder().encode(str);
    for (const b of bytes) {
      this.buffer.push(b);
    }
    return this;
  }

  // Add newline (LF)
  line(count: number = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // Print formatted text row with left & right alignment (e.g. Item Name ..... Rp 25.000)
  row(left: string, right: string, maxLen: number = 32) {
    const rightLen = right.length;
    const availableLeft = maxLen - rightLen - 1;

    let displayLeft = left;
    if (displayLeft.length > availableLeft) {
      displayLeft = displayLeft.substring(0, availableLeft - 1) + '.';
    }

    const spaces = Math.max(1, maxLen - displayLeft.length - rightLen);
    const lineStr = displayLeft + ' '.repeat(spaces) + right;
    this.text(lineStr).line();
    return this;
  }

  // Print divider line (e.g. --------------------------------)
  divider(char: string = '-', maxLen: number = 32) {
    this.text(char.repeat(maxLen)).line();
    return this;
  }

  // Feed & Cut Paper (GS V m)
  cut() {
    this.line(3);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  // Build Uint8Array
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Print receipt via connected Bluetooth Printer using ESC/POS
 */
export async function printReceiptBluetooth(data: PrintReceiptData, customConfig?: Partial<BluetoothPrinterConfig>): Promise<boolean> {
  const cfg = { ...getStoredPrinterConfig(), ...customConfig };
  const maxLen = cfg.paperWidth === '80mm' ? 48 : 32;

  const encoder = new EscPosEncoder();
  encoder.init();

  // Header Info
  const cafeName = data.cafeName || 'BREW & BYTE CAFE';
  const cafeAddress = data.cafeAddress || 'Jl. Melati No. 45';
  const cafePhone = data.cafePhone || '';
  const isKitchen = data.type === 'order_kitchen' || data.type === 'kitchen_slip';
  const isDraft = data.type === 'draft_bill';

  encoder.align('center').bold(true).textSize(2, 2).text(cafeName).line();
  encoder.textSize(1, 1).bold(false);

  if (data.tagline) {
    encoder.text(data.tagline).line();
  }
  if (cafeAddress) {
    encoder.text(cafeAddress).line();
  }
  if (cafePhone) {
    encoder.text(`Telp/WA: ${cafePhone}`).line();
  }

  encoder.divider(cfg.separatorChar, maxLen);

  // Title & Table Header
  let title = 'STRUK PEMBAYARAN';
  if (isKitchen) title = 'TIKET DAPUR / BAR';
  else if (isDraft) title = 'TAGIHAN SEMENTARA';

  encoder.align('center').bold(true).text(`*** ${title} ***`).line();
  encoder.textSize(2, 2).text(`MEJA: ${data.tableNumber}`).line();
  encoder.textSize(1, 1).bold(false);

  encoder.divider(cfg.separatorChar, maxLen);

  // Order Info
  encoder.align('left');
  if (data.orderId) encoder.text(`No. Order : #ORD-${data.orderId}`).line();
  if (data.cashierName) encoder.text(`Petugas   : ${data.cashierName}`).line();
  encoder.text(`Waktu     : ${formatDateTime(new Date().toISOString())}`).line();

  encoder.divider(cfg.separatorChar, maxLen);

  // Items List
  data.items.forEach(item => {
    const qtyStr = `${item.quantity}x `;
    const priceStr = !isKitchen && item.subtotal !== undefined ? formatRupiah(item.subtotal) : '';

    if (!isKitchen) {
      encoder.row(`${qtyStr}${item.name}`, priceStr, maxLen);
    } else {
      encoder.bold(true).textSize(1, 2).text(`${qtyStr}${item.name}`).line().textSize(1, 1).bold(false);
    }

    if (item.notes) {
      encoder.text(`  Note: ${item.notes}`).line();
    }
  });

  // Calculation Breakdown
  if (!isKitchen && data.calculation) {
    encoder.divider(cfg.separatorChar, maxLen);
    const calc = data.calculation;

    encoder.row('Subtotal', formatRupiah(calc.subtotal), maxLen);

    if (calc.is_service_active && calc.service_charge > 0) {
      encoder.row(`Service Charge (${calc.service_charge_rate}%)`, formatRupiah(calc.service_charge), maxLen);
    }
    if (calc.is_tax_active && calc.tax > 0) {
      encoder.row(`PB1 Resto (${calc.tax_rate}%)`, formatRupiah(calc.tax), maxLen);
    }

    encoder.divider('=', maxLen);
    encoder.bold(true).textSize(1, 2).row('TOTAL', formatRupiah(calc.total), maxLen).textSize(1, 1).bold(false);

    if (data.payment) {
      encoder.divider(cfg.separatorChar, maxLen);
      encoder.row('Metode Bayar', data.payment.payment_method.toUpperCase(), maxLen);
      if (data.payment.payment_method === 'tunai') {
        encoder.row('Uang Tunai', formatRupiah(data.payment.nominal), maxLen);
        encoder.row('Kembalian', formatRupiah(data.payment.change || 0), maxLen);
      }
    }
  }

  // Footer & Wifi
  if (!isKitchen) {
    if (data.wifiSsid || data.wifiPassword) {
      encoder.divider(cfg.separatorChar, maxLen);
      encoder.align('center').bold(true).text('📶 FREE GUEST WIFI').line().bold(false);
      if (data.wifiSsid) encoder.text(`SSID: ${data.wifiSsid}`).line();
      if (data.wifiPassword) encoder.text(`Pass: ${data.wifiPassword}`).line();
    }

    encoder.divider(cfg.separatorChar, maxLen);
    encoder.align('center');
    encoder.text(data.receiptFooter || 'Terima kasih atas kunjungan Anda!').line();
    if (data.instagram) encoder.text(`IG: ${data.instagram}`).line();
  } else {
    encoder.divider(cfg.separatorChar, maxLen);
    encoder.align('center').bold(true).text('*** SEGERA DISIAPKAN ***').line();
  }

  encoder.cut();

  const buffer = encoder.encode();
  const copies = Math.max(1, cfg.copies || 1);

  for (let c = 0; c < copies; c++) {
    await sendRawEscPosData(buffer);
    if (c < copies - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return true;
}

/**
 * Test Print Function to verify ESC/POS bluetooth output
 */
export async function printTestReceiptBluetooth(): Promise<boolean> {
  const testData: PrintReceiptData = {
    type: 'customer_invoice',
    cafeName: 'BREW & BYTE CAFE',
    cafeAddress: 'Jl. Melati No. 45, Kota Baru',
    cafePhone: '0812-3456-7890',
    tagline: 'Coffee & Dine POS System',
    wifiSsid: 'KafeResto_Guest',
    wifiPassword: 'selamatmenikmati',
    receiptFooter: 'Terima kasih telah mencoba printer Bluetooth!',
    instagram: '@kaferestokita',
    tableNumber: 'Meja Test',
    orderId: 9999,
    cashierName: 'Kasir Demo',
    items: [
      { name: 'Caramel Macchiato (Hot)', quantity: 1, price: 32000, subtotal: 32000, notes: 'Less sugar' },
      { name: 'Croissant Butter Original', quantity: 2, price: 22000, subtotal: 44000 }
    ],
    calculation: {
      subtotal: 76000,
      service_charge_rate: 5,
      is_service_active: true,
      service_charge: 3800,
      tax_rate: 10,
      is_tax_active: true,
      tax: 7980,
      total: 87780
    },
    payment: {
      payment_id: 100,
      session_id: 'test-session',
      payment_method: 'tunai',
      nominal: 100000,
      change: 12220,
      payment_time: new Date().toISOString(),
      kasir_id: 1,
      subtotal: 76000,
      service_charge: 3800,
      tax: 7980,
      total: 87780
    }
  };

  return printReceiptBluetooth(testData);
}
