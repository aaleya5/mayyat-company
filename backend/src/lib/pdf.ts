/**
 * src/lib/pdf.ts
 *
 * Renders HTML to PDF via Puppeteer (headless Chrome). Used by the pamphlet
 * PDF endpoint - reuses the exact same HTML from pamphletTemplate.ts that
 * the browser "Print" view uses, so the PDF and the print view can never
 * visually drift apart from each other.
 *
 * Singleton browser instance, same pattern as the Prisma client in lib/db.ts:
 * launching headless Chrome is expensive, so one instance is launched lazily
 * on first use and reused across requests rather than relaunched every time.
 */

import puppeteer, { Browser } from "puppeteer";

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

/**
 * Renders an HTML string to a PDF buffer. The page size comes from the
 * HTML's own `@page` CSS rule (pamphletTemplate.ts sets A5), so no size is
 * passed here - `preferCSSPageSize: true` respects that.
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });

    // setContent() doesn't support networkidle waits in this Puppeteer
    // version - wait on the Font Loading API directly instead, which is
    // actually the more precise signal for "Noto Sans Gujarati is ready to
    // render" rather than an indirect network-activity heuristic.
    await page.evaluate(() => (globalThis as any).document.fonts.ready);

    const pdfBuffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Close the browser cleanly on process exit, so `npm run dev`'s tsx watch
// restarts don't leak headless Chrome processes.
process.on("SIGTERM", async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
  }
});
