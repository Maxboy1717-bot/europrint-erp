/**
 * @module pos-print
 * @description Hidden-iframe print pipeline (Savdo-sity referens naqshi, POS.tsx:1569-1599).
 *   `window.open(...).print()` popup-blocker tomonidan JIM o'chirilishi mumkin — hech narsa
 *   chiqmaydi, xato ham ko'rinmaydi. Ko'zga-ko'rinmas iframe hech qachon bloklanmaydi.
 */

export function printHtml(bodyHtml: string, pageCss: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(
    `<html><head><title>Chop etish</title><style>@page{${pageCss}}html,body{margin:0;padding:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>${bodyHtml}</body></html>`,
  );
  doc.close();
  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return;
  }
  // 250ms — kontent joylashishi (layout) uchun kutish; 1000ms'dan keyin tozalash.
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}
