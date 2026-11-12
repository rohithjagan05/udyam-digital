import type { GstinRecord } from "../registry/gstin";
import type { UdyamRecord } from "../registry/udyam";

export interface FieldMismatch {
  field: string;
  certificate: string;
  registry: string;
}

export interface CrossCheck {
  ok: boolean; // true only when every field was found and matches the registry
  mismatches: FieldMismatch[];
  missing: string[]; // fields the OCR could not read from the certificate
}

// Finds a "Label value" line in OCR text. Returns the value, or null if the label is absent.
function readField(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

// Letters and digits only, lower case. So "Ganesh  Woodcraft." matches "ganesh woodcraft".
function same(a: string, b: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean(a) === clean(b);
}

// Compares each field read from the certificate with the registry value.
function compare(
  fromCertificate: Record<string, string | null>,
  fromRegistry: Record<string, string>,
): CrossCheck {
  const mismatches: FieldMismatch[] = [];
  const missing: string[] = [];

  for (const [name, certValue] of Object.entries(fromCertificate)) {
    if (certValue === null) {
      missing.push(name);
      continue;
    }
    const registryValue = fromRegistry[name] ?? "";
    if (!same(certValue, registryValue)) {
      mismatches.push({ field: name, certificate: certValue, registry: registryValue });
    }
  }

  return { ok: missing.length === 0 && mismatches.length === 0, mismatches, missing };
}

// Checks a GST certificate's OCR text against the GSTIN registry record.
export function crossCheckGst(ocrText: string, record: GstinRecord): CrossCheck {
  return compare(
    {
      gstin: readField(ocrText, /GSTIN\s*[:\-]?\s*([0-9A-Z]{15})/i),
      legal_name: readField(ocrText, /^\s*Legal name\s*[:\-]?\s*(.+)$/im),
      trade_name: readField(ocrText, /^\s*Trade name\s*[:\-]?\s*(.+)$/im),
    },
    {
      gstin: record.gstin,
      legal_name: record.legal_name,
      trade_name: record.trade_name,
    },
  );
}

// Checks a Udyam certificate's OCR text against the Udyam registry record.
export function crossCheckUdyam(ocrText: string, record: UdyamRecord): CrossCheck {
  return compare(
    {
      udyam_number: readField(ocrText, /(UDYAM-[A-Z]{2}-\d{2}-\d{7})/i),
      enterprise_name: readField(ocrText, /^\s*Enterprise name\s*[:\-]?\s*(.+)$/im),
      city: readField(ocrText, /^\s*City\s*[:\-]?\s*(.+)$/im),
      state: readField(ocrText, /^\s*State\s*[:\-]?\s*(.+)$/im),
      date_of_registration: readField(ocrText, /Date of registration\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i),
    },
    {
      udyam_number: record.udyam_number,
      enterprise_name: record.enterprise_name,
      city: record.city,
      state: record.state,
      date_of_registration: record.date_of_registration,
    },
  );
}