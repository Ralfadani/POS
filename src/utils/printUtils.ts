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
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
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
          // Wait for all images to load before printing
          Promise.all(Array.from(document.images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })).then(() => {
            setTimeout(() => {
              window.print();
            }, 300);
          });
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

/**
 * Prints HTML content directly from the main window using a temporary DOM injection.
 * This is the most reliable method for PWA and Android Print Services (e.g. RawBT),
 * as it avoids popup blockers, Blob URL cross-origin issues, and iframe freezes.
 */
export const printHtmlDirectly = (htmlContent: string) => {
  // Cleanup any existing print containers
  const existingContainer = document.getElementById('global-print-container');
  if (existingContainer) existingContainer.remove();
  const existingStyle = document.getElementById('global-print-style');
  if (existingStyle) existingStyle.remove();

  // Create temporary container
  const container = document.createElement('div');
  container.id = 'global-print-container';
  container.innerHTML = htmlContent;
  
  // Create print-specific styles to hide everything else
  const style = document.createElement('style');
  style.id = 'global-print-style';
  style.innerHTML = `
    @media screen {
      #global-print-container { display: none !important; }
    }
    @media print {
      body > *:not(#global-print-container) { display: none !important; }
      #global-print-container { 
        display: block !important; 
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background: white;
        margin: 0;
        padding: 0;
      }
      /* Remove default header/footer from browsers if possible */
      @page { margin: 0; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(container);
  
  // Wait for React/DOM to render and any embedded images to load
  setTimeout(() => {
    window.print();
    // Cleanup after print dialog is closed
    setTimeout(() => {
      const containerToRemove = document.getElementById('global-print-container');
      if (containerToRemove) containerToRemove.remove();
      const styleToRemove = document.getElementById('global-print-style');
      if (styleToRemove) styleToRemove.remove();
    }, 2000);
  }, 500);
};
