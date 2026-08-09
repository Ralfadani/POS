/**
 * Prints a specific HTML element by rendering it in a hidden iframe.
 * This avoids popup blockers (unlike window.open) and doesn't require complex @media print CSS for the entire app.
 */
export const printElementById = (elementId: string, title: string = 'Cetak') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemen dengan ID ${elementId} tidak ditemukan.`);
    return;
  }

  // Hapus iframe lama jika ada
  const oldIframe = document.getElementById('hidden-print-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'hidden-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: white;
            color: #0f172a;
          }
          .printable-card {
            border: 2px dashed #cbd5e1;
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            max-width: 300px;
            margin: 0 auto;
          }
          /* Tambahan gaya khusus agar SVG / Gambar QR tidak kebesaran */
          svg, img {
            max-width: 100%;
            height: auto;
            margin: 0 auto;
            display: block;
          }
          h2 { margin: 10px 0; font-size: 24px; }
          p { margin: 5px 0; font-size: 12px; color: #64748b; }
          .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            background: #fef3c7; 
            color: #78350f; 
            border-radius: 99px; 
            font-size: 10px; 
            font-weight: bold; 
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="printable-card">
          ${element.innerHTML}
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  doc.close();

  // Fokus iframe agar print dialog muncul untuk iframe ini
  iframe.contentWindow?.focus();
  
  // Bersihkan iframe setelah selesai (asumsi print dialog ditutup)
  setTimeout(() => {
    const iframeToRemove = document.getElementById('hidden-print-iframe');
    if (iframeToRemove) iframeToRemove.remove();
  }, 10000); 
};
