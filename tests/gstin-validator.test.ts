import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { checkGstin } from "../src/validators/gstin";

const gstinFile = resolve(process.cwd(), "data/mock_gstin_registry.csv");
const VALID = "32TTNXB7384T1ZW"; // from the registry; its 4th PAN character is X

describe("GSTIN validator", () => {
  it("accepts a GSTIN from the registry", () => {
    expect(checkGstin(VALID)).toEqual({ valid: true });
  });

  it("accepts X as the 4th character of the PAN", () => {
    // In VALID, the 4th PAN character is X. The validator must not reject it.
    expect(VALID[5]).toBe("X");
    expect(checkGstin(VALID).valid).toBe(true);
  });

  it("accepts every GSTIN in the mock registry", () => {
    const rows = parse(readFileSync(gstinFile, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as { gstin: string }[];

    const failures = rows.filter((row) => !checkGstin(row.gstin).valid);
    expect(failures).toHaveLength(0);
  });

  it("rejects a wrong check character as bad_checksum", () => {
    const wrongCheck = VALID.slice(0, 14) + "A"; // the correct one is W
    expect(checkGstin(wrongCheck)).toEqual({ valid: false, reason: "bad_checksum" });
  });

  it("rejects a GSTIN that is too short as wrong_length", () => {
    expect(checkGstin(VALID.slice(0, 14))).toEqual({ valid: false, reason: "wrong_length" });
  });

  it("rejects a GSTIN that is too long as wrong_length", () => {
    expect(checkGstin(VALID + "1")).toEqual({ valid: false, reason: "wrong_length" });
  });

  it("rejects a GSTIN with the wrong letter where Z must be as bad_format", () => {
    // The 14th character must be Z. Changing it breaks the format before the checksum is tried.
    const badFormat = VALID.slice(0, 13) + "A" + VALID.slice(14);
    expect(checkGstin(badFormat)).toEqual({ valid: false, reason: "bad_format" });
  });

  it("normalises case and surrounding spaces before checking", () => {
    expect(checkGstin("  32ttnxb7384t1zw ")).toEqual({ valid: true });
  });
});