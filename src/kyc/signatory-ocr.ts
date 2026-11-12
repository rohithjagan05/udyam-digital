export interface SignatoryFields {
  name: string | null;
  forBusiness: string | null;
  validTill: string | null;
}

// Returns the first non-empty line after a label line. OCR puts the value below the label.
function valueBelow(text: string, label: string): string | null {
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) => line.trim().toLowerCase() === label.toLowerCase());
  if (index === -1) {
    return null;
  }
  for (let i = index + 1; i < lines.length; i++) {
    const value = lines[i]!.trim();
    if (value !== "") {
      return value;
    }
  }
  return null;
}

export function parseSignatoryId(ocrText: string): SignatoryFields {
  return {
    name: valueBelow(ocrText, "Name"),
    forBusiness: valueBelow(ocrText, "For business"),
    validTill: valueBelow(ocrText, "Valid till"),
  };
}