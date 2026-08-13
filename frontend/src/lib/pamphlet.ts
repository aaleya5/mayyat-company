const API_BASE = "http://localhost:4000/api";

/**
 * Fetches the pamphlet HTML (from the /pamphlet endpoint added in 5.1) and
 * opens it in a new window, triggering the browser's print dialog once the
 * content - including the Gujarati web font - has actually loaded.
 */
export async function printPamphlet(recordId: string, lang: "gu" | "en", token: string) {
  const res = await fetch(`${API_BASE}/records/${recordId}/pamphlet?lang=${lang}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to load pamphlet");
  }

  const html = await res.text();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked - please allow popups for this site to print");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    // Wait for the Noto Sans Gujarati web font to actually be ready before
    // printing - same reasoning as the backend PDF renderer in lib/pdf.ts,
    // otherwise the print dialog could open on a tofu-box fallback render.
    printWindow.document.fonts.ready.then(() => {
      printWindow.focus();
      printWindow.print();
    });
  };
}

/**
 * Downloads the PDF version (from the /pamphlet.pdf endpoint added in 5.3).
 * Can't use a plain <a href> since the endpoint requires an Authorization
 * header - fetches as a blob and triggers the download via a temporary
 * anchor element instead.
 */
export async function downloadPamphletPdf(
  recordId: string,
  lang: "gu" | "en",
  token: string,
  recordName: string
) {
  const res = await fetch(`${API_BASE}/records/${recordId}/pamphlet.pdf?lang=${lang}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to generate PDF");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${recordName.replace(/[^a-z0-9]+/gi, "-")}-${lang}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
