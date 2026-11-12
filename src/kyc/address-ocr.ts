// Reads the bill date from an electricity bill's OCR text, e.g. "Bill date 2026-06-26".
export function parseBillDate(ocrText: string): string | null {
  const match = ocrText.match(/Bill date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i);
  return match ? match[1]! : null;
}