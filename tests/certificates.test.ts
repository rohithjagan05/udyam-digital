import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { MockGstinRegistry } from "../src/registry/gstin";
import { MockUdyamRegistry } from "../src/registry/udyam";
import { crossCheckGst, crossCheckUdyam } from "../src/kyc/certificates";

const gstinRegistry = new MockGstinRegistry(resolve(process.cwd(), "data/mock_gstin_registry.csv"));
const udyamRegistry = new MockUdyamRegistry(resolve(process.cwd(), "data/mock_udyam_registry.csv"));

const GST_TEXT = `Specimen: GST Registration Certificate
GSTIN 27XUIXG0767D1ZP
Legal name Joseph Singh (Prop. Ganesh Woodcraft)
Trade name Ganesh Woodcraft`;

const UDYAM_TEXT = `Specimen: Udyam Registration Certificate
Udyam reg. number UDYAM-WB-00-5053330
Enterprise name Harmony Dental Care
Major activity Services
City Kolkata
State West Bengal
Date of registration 2023-01-11`;

describe("GST certificate cross-check", () => {
  it("passes when the certificate matches the registry", async () => {
    const record = (await gstinRegistry.lookup("27XUIXG0767D1ZP"))!;
    const result = crossCheckGst(GST_TEXT, record);
    expect(result).toEqual({ ok: true, mismatches: [], missing: [] });
  });

  it("ignores case and punctuation differences", async () => {
    const record = (await gstinRegistry.lookup("27XUIXG0767D1ZP"))!;
    const shouted = GST_TEXT.replace("Joseph Singh (Prop. Ganesh Woodcraft)", "JOSEPH SINGH PROP GANESH WOODCRAFT");
    expect(crossCheckGst(shouted, record).ok).toBe(true);
  });

  it("reports a missing trade name instead of passing it", async () => {
    const record = (await gstinRegistry.lookup("27XUIXG0767D1ZP"))!;
    const noTrade = GST_TEXT.replace("Trade name Ganesh Woodcraft", "");
    const result = crossCheckGst(noTrade, record);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["trade_name"]);
  });
});

describe("Udyam certificate cross-check", () => {
  it("flags the registration date when the certificate and registry disagree", async () => {
    const record = (await udyamRegistry.lookup("UDYAM-WB-00-5053330"))!;
    const result = crossCheckUdyam(UDYAM_TEXT, record);
    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      { field: "date_of_registration", certificate: "2023-01-11", registry: "2022-09-27" },
    ]);
  });

  it("passes when the date also matches", async () => {
    const record = (await udyamRegistry.lookup("UDYAM-WB-00-5053330"))!;
    const fixed = UDYAM_TEXT.replace("2023-01-11", "2022-09-27");
    expect(crossCheckUdyam(fixed, record)).toEqual({ ok: true, mismatches: [], missing: [] });
  });

  it("reports every field the OCR could not read", async () => {
    const record = (await udyamRegistry.lookup("UDYAM-WB-00-5053330"))!;
    const partial = "Udyam reg. number UDYAM-WB-00-5053330";
    const result = crossCheckUdyam(partial, record);
    expect(result.missing).toEqual(["enterprise_name", "city", "state", "date_of_registration"]);
    expect(result.ok).toBe(false);
  });
});