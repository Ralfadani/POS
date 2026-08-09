import { formatRupiah, formatDateTime } from './formatters.js';
import { Order, Payment, CalculationBreakdown } from '../types/index.js';

export interface PrintReceiptData {
  type: 'order_kitchen' | 'customer_invoice' | 'kitchen_slip' | 'draft_bill';
  cafeName?: string;
  cafeAddress?: string;
  cafePhone?: string;
  tagline?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  receiptFooter?: string;
  instagram?: string;
  tableNumber: string;
  sessionId?: string;
  orderId?: number;
  orderNumber?: string;
  channel?: string;
  cashierName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    subtotal?: number;
    notes?: string;
  }>;
  calculation?: CalculationBreakdown;
  payment?: Payment;
}

export function printThermalReceipt(data: PrintReceiptData) {
  const isKitchen = data.type === 'order_kitchen' || data.type === 'kitchen_slip';
  const isDraft = data.type === 'draft_bill';
  const isInvoice = data.type === 'customer_invoice';

  const cafeName = data.cafeName || 'BREW & BYTE CAFE';
  const cafeAddress = data.cafeAddress || 'Jl. Melati No. 45, Kota Baru';
  const cafePhone = data.cafePhone || '';
  const tagline = data.tagline || '';
  const wifiSsid = data.wifiSsid || '';
  const wifiPassword = data.wifiPassword || '';
  const receiptFooter = data.receiptFooter || '';
  const instagram = data.instagram || '';

  let receiptTitle = 'STRUK PEMBAYARAN';
  if (isKitchen) receiptTitle = 'TIKET DAPUR / BAR (KOT)';
  else if (isDraft) receiptTitle = 'TAGIHAN SEMENTARA (DRAFT BILL)';

  const itemsHtml = data.items
    .map(
      item => `
      <div style="margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px dotted #ccc;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-size: ${isKitchen ? '14pt' : '12pt'}; font-weight: bold; line-height: 1.3;">
            <span style="background: ${isKitchen ? '#000' : 'transparent'}; color: ${isKitchen ? '#fff' : '#000'}; padding: 1px 4px; border-radius: 3px; margin-right: 4px;">${item.quantity}x</span>
            <span>${item.name}</span>
          </div>
          ${!isKitchen && item.subtotal !== undefined ? `<div style="font-size: 12pt; font-weight: 600; white-space: nowrap; margin-left: 6px;">${formatRupiah(item.subtotal)}</div>` : ''}
        </div>
        ${
          item.notes
            ? `<div style="font-size: 11pt; background: #f4f4f4; border-left: 3px solid #000; padding: 2px 6px; margin-top: 4px; font-weight: 600; color: #111;">
                NOTE: ${item.notes}
              </div>`
            : ''
        }
      </div>
    `
    )
    .join('');

  let calculationHtml = '';
  if (!isKitchen && data.calculation) {
    const calc = data.calculation;
    calculationHtml = `
      <div style="border-top: 1px dashed #000; margin: 8px 0; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 12pt; margin-bottom: 3px;">
          <span>Subtotal (${data.items.reduce((a, b) => a + b.quantity, 0)} item):</span>
          <span style="font-weight: 600;">${formatRupiah(calc.subtotal)}</span>
        </div>
        ${
          calc.is_service_active && calc.service_charge > 0
            ? `<div style="display: flex; justify-content: space-between; font-size: 12pt; margin-bottom: 3px;">
                <span>Service Charge (${calc.service_charge_rate}%):</span>
                <span>${formatRupiah(calc.service_charge)}</span>
              </div>`
            : ''
        }
        ${
          calc.is_tax_active && calc.tax > 0
            ? `<div style="display: flex; justify-content: space-between; font-size: 12pt; margin-bottom: 3px;">
                <span>PB1 Resto (${calc.tax_rate}%):</span>
                <span>${formatRupiah(calc.tax)}</span>
              </div>`
            : ''
        }
        <div style="border-top: 2px solid #000; margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 15pt; font-weight: 900;">
          <span>TOTAL:</span>
          <span>${formatRupiah(calc.total)}</span>
        </div>
        ${
          data.payment
            ? `
          <div style="border-top: 1px dashed #666; margin-top: 8px; padding-top: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 12pt; margin-bottom: 2px;">
              <span>Metode Bayar:</span>
              <span style="font-weight: bold; text-transform: uppercase;">${data.payment.payment_method}</span>
            </div>
            ${
              data.payment.payment_method === 'tunai'
                ? `
              <div style="display: flex; justify-content: space-between; font-size: 12pt; margin-bottom: 2px;">
                <span>Uang Tunai:</span>
                <span>${formatRupiah(data.payment.nominal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13pt; font-weight: bold;">
                <span>Kembalian:</span>
                <span>${formatRupiah(data.payment.change || 0)}</span>
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  const printWindow = window.open('', '_blank', 'width=420,height=650');
  if (!printWindow) {
    // Fallback using hidden iframe for iframe/tablet environments where window.open is blocked
    const existingIframe = document.getElementById('thermal-print-iframe');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generateThermalHtml({
        cafeName,
        cafeAddress,
        cafePhone,
        tagline,
        wifiSsid,
        wifiPassword,
        receiptFooter,
        instagram,
        receiptTitle,
        tableNumber: data.tableNumber,
        orderId: data.orderId,
        channel: data.channel,
        cashierName: data.cashierName,
        itemsHtml,
        calculationHtml,
        isKitchen,
        isInvoice,
        isDraft
      }));
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 400);
    }
    return;
  }

  printWindow.document.write(generateThermalHtml({
    cafeName,
    cafeAddress,
    cafePhone,
    tagline,
    wifiSsid,
    wifiPassword,
    receiptFooter,
    instagram,
    receiptTitle,
    tableNumber: data.tableNumber,
    orderId: data.orderId,
    channel: data.channel,
    cashierName: data.cashierName,
    itemsHtml,
    calculationHtml,
    isKitchen,
    isInvoice,
    isDraft
  }));
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}

function generateThermalHtml(params: {
  cafeName: string;
  cafeAddress: string;
  cafePhone?: string;
  tagline?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  receiptFooter?: string;
  instagram?: string;
  receiptTitle: string;
  tableNumber: string;
  orderId?: number;
  channel?: string;
  cashierName?: string;
  itemsHtml: string;
  calculationHtml: string;
  isKitchen: boolean;
  isInvoice: boolean;
  isDraft: boolean;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${params.receiptTitle} - ${params.tableNumber}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
            font-size: 12pt;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
          .table-header {
            background: ${params.isKitchen ? '#000' : '#f0f0f0'};
            color: ${params.isKitchen ? '#fff' : '#000'};
            padding: 6px 8px;
            border-radius: 4px;
            margin: 6px 0;
            text-align: center;
          }
          .wifi-box {
            border: 1px dashed #444;
            padding: 4px 6px;
            margin: 8px 0;
            font-size: 10pt;
            background: #fafafa;
            border-radius: 4px;
            text-align: center;
          }
          .footer { margin-top: 8px; font-size: 11pt; text-align: center; line-height: 1.4; }
          @media print {
            body { width: 100%; padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div style="font-size: 15pt; font-weight: 900; letter-spacing: 0.5px;">${params.cafeName}</div>
          ${params.tagline ? `<div style="font-size: 10pt; font-style: italic; color: #444; margin-top: 1px;">${params.tagline}</div>` : ''}
          <div style="font-size: 10pt; color: #333; margin-top: 2px;">${params.cafeAddress}</div>
          ${params.cafePhone ? `<div style="font-size: 10pt; color: #444;">Telp/WA: ${params.cafePhone}</div>` : ''}
          <div style="font-size: 12pt; font-weight: 800; margin-top: 4px; border-bottom: 1px dotted #000; padding-bottom: 3px;">*** ${params.receiptTitle} ***</div>
        </div>

        <div class="table-header">
          <div style="font-size: 16pt; font-weight: 900; letter-spacing: 1px;">MEJA: ${params.tableNumber}</div>
          <div style="font-size: 10pt; opacity: 0.9;">
            ${params.channel === 'self_order' ? '[ SELF-ORDER QR HP ]' : '[ KASIR POS TABLET ]'}
          </div>
        </div>

        <div style="font-size: 11pt; margin-bottom: 4px;">
          ${params.orderId ? `<div>No. Order: <strong>#ORD-${params.orderId}</strong></div>` : ''}
          ${params.cashierName ? `<div>Petugas: <strong>${params.cashierName}</strong></div>` : ''}
          <div>Waktu: ${formatDateTime(new Date().toISOString())}</div>
        </div>

        <div class="divider-solid"></div>

        <div>
          ${params.itemsHtml}
        </div>

        ${params.calculationHtml}

        ${
          !params.isKitchen && (params.wifiSsid || params.wifiPassword)
            ? `
          <div class="wifi-box">
            <div style="font-weight: bold;">📶 FREE GUEST WIFI</div>
            ${params.wifiSsid ? `<div>SSID: <strong>${params.wifiSsid}</strong></div>` : ''}
            ${params.wifiPassword ? `<div>Pass: <strong>${params.wifiPassword}</strong></div>` : ''}
          </div>
        `
            : ''
        }

        <div class="divider"></div>

        <div class="footer">
          ${
            params.isKitchen
              ? '<strong>*** SEGERA DISIAPKAN OLEH DAPUR/BAR ***</strong>'
              : params.isDraft
              ? '<em>--- Lembar Tagihan Sementara ---<br>Bukan Bukti Pembayaran Sah</em>'
              : `<div>${params.receiptFooter || 'Terima kasih atas kunjungan Anda!<br>Silakan berkunjung kembali.'}</div>
                 ${params.instagram ? `<div style="font-size: 10px; margin-top: 3px; font-weight: bold;">IG: ${params.instagram}</div>` : ''}`
          }
        </div>

        <div class="no-print" style="margin-top: 14px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #1A3A5C; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13pt;">
            🖨️ Cetak Struk (Print)
          </button>
        </div>
      </body>
    </html>
  `;
}

