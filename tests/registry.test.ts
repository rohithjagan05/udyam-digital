import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { MockGstinRegistry } from "../src/registry/gstin";
import { MockUdyamRegistry } from "../src/registry/udyam";

const gstinFile = resolve(process.cwd(), "data/mock_gstin_registry.csv");
const udyamFile = resolve(process.cwd(), "data/mock_udyam_registry.csv");

describe("GSTIN mock registry", () => {
  const registry = new MockGstinRegistry(gstinFile);

  it("finds an active GSTIN", async () => {
    const record = await registry.lookup("32TTNXB7384T1ZW");
    expect(record?.legal_name).toBe("Balaji Dental Care LLP");
    expect(record?.status).toBe("Active");
  });

  it("returns a cancelled GSTIN with its status, not as missing", async () => {
    const record = await registry.lookup("37IHKXV5167L1ZS");
    expect(record).not.toBeNull();
    expect(record?.status).toBe("Cancelled");
  });

  it("returns null for a GSTIN that is not in the registry", async () => {
    expect(await registry.lookup("00AAAAA0000A1Z5")).toBeNull();
  });

  it("ignores case and surrounding spaces", async () => {
    const record = await registry.lookup("  32ttnxb7384t1zw ");
    expect(record?.gstin).toBe("32TTNXB7384T1ZW");
  });

  it("finds the first ten GSTINs in the file", async () => {
    const rows = parse(readFileSync(gstinFile, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as { gstin: string }[];

    for (const row of rows.slice(0, 10)) {
      expect(await registry.lookup(row.gstin)).not.toBeNull();
    }
  });
});

describe("Udyam mock registry", () => {
  const registry = new MockUdyamRegistry(udyamFile);

  it("finds a registered Udyam number", async () => {
    const record = await registry.lookup("UDYAM-KL-00-3078801");
    expect(record?.enterprise_name).toBe("Balaji Dental Care LLP");
  });

  it("returns null for a number that is not in the registry", async () => {
    expect(await registry.lookup("UDYAM-XX-00-0000000")).toBeNull();
  });

  it("ignores case and surrounding spaces", async () => {
    const record = await registry.lookup(" udyam-kl-00-3078801 ");
    expect(record?.udyam_number).toBe("UDYAM-KL-00-3078801");
  });
});