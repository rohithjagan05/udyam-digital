// The characters a GSTIN can use, in value order: 0-9 are 0-9, A-Z are 10-35.
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Shape of a GSTIN: 2 state digits, 5 letters, 4 digits, 1 letter (the PAN),
// 1 entity code, the letter Z, then the check character.
const FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type GstinCheck =
  | { valid: true }
  | { valid: false; reason: "wrong_length" | "bad_format" | "bad_checksum" };

// Works out the check character from the first 14 characters.
function checkCharacter(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    // Every second character is doubled, starting with the second one.
    const value = CHARS.indexOf(body[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(value / 36) + (value % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

export function checkGstin(input: string): GstinCheck {
  // Users may type spaces or lower-case letters, so normalise first.
  const gstin = input.trim().toUpperCase();

  if (gstin.length !== 15) {
    return { valid: false, reason: "wrong_length" };
  }
  if (!FORMAT.test(gstin)) {
    return { valid: false, reason: "bad_format" };
  }
  if (checkCharacter(gstin.slice(0, 14)) !== gstin[14]) {
    return { valid: false, reason: "bad_checksum" };
  }
  return { valid: true };
}