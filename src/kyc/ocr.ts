import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Runs the Tesseract program on one image and returns the text it reads.
// On Windows, set TESSERACT_CMD to the full path of tesseract.exe if it is not on PATH.
export async function runOcr(imagePath: string, languages = "eng"): Promise<string> {
  const command = process.env.TESSERACT_CMD ?? "tesseract";
  const { stdout } = await run(command, [imagePath, "stdout", "-l", languages], {
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

// OCR often reads 0 as O, 1 as I, and so on. In a GSTIN, some positions must be digits
// and others must be letters, so we fix each character to match its position.
// Positions (0-based): 0-1 digits, 2-6 letters, 7-10 digits, 11 letter, 12 alphanumeric, 13 Z, 14 alphanumeric.
const DIGIT_FIX: Record<string, string> = { O: "0", Q: "0", D: "0", I: "1", L: "1", S: "5", B: "8", Z: "2" };
const LETTER_FIX: Record<string, string> = { "0": "O", "1": "I", "5": "S", "8": "B", "2": "Z" };
const DIGIT_POSITIONS = new Set([0, 1, 7, 8, 9, 10]);
const LETTER_POSITIONS = new Set([2, 3, 4, 5, 6, 11]);

export function correctGstinOcr(raw: string): string {
  const chars = raw.toUpperCase().split("");
  return chars
    .map((c, i) => {
      if (DIGIT_POSITIONS.has(i)) return DIGIT_FIX[c] ?? c;
      if (LETTER_POSITIONS.has(i)) return LETTER_FIX[c] ?? c;
      return c;
    })
    .join("");
}

// OCR can add spaces inside a Udyam number and read 0 as O in the digit groups.
// A Udyam number has the form UDYAM-XX-NN-NNNNNNN, so only the last two groups are digits.
export function correctUdyamOcr(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  const [prefix, state, district, serial] = compact.split("-");
  const fixDigits = (group: string | undefined) =>
    (group ?? "").split("").map((c) => DIGIT_FIX[c] ?? c).join("");
  return [prefix, state, fixDigits(district), fixDigits(serial)].join("-");
}