import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { correctGstinOcr, correctUdyamOcr, runOcr } from "../src/kyc/ocr";
import { checkGstin } from "../src/validators/gstin";
import { MockGstinRegistry } from "../src/registry/gstin";
import { MockUdyamRegistry } from "../src/registry/udyam";
import { crossCheckGst, crossCheckUdyam } from "../src/kyc/certificates";

const hasTesseract = spawnSync(process.env.TESSERACT_CMD ?? "tesseract", ["--version"]).status === 0;

describe("GSTIN OCR correction", () => {
  it("turns a letter O in a digit position into a zero", () => {
    expect(correctGstinOcr("27XUIXGO767D1ZP")).toBe("27XUIXG0767D1ZP");
  });

  it("makes the corrected GSTIN pass the checksum", () => {
    expect(checkGstin(correctGstinOcr("27XUIXGO767D1ZP")).valid).toBe(true);
  });

  it("leaves a correct GSTIN unchanged", () => {
    expect(correctGstinOcr("27XUIXG0767D1ZP")).toBe("27XUIXG0767D1ZP");
  });
});

describe("Udyam OCR correction", () => {
  it("removes a space OCR inserted inside the number", () => {
    expect(correctUdyamOcr("UDYAM-MH- 00-6131836")).toBe("UDYAM-MH-00-6131836");
  });

  it("turns a letter O in the digit groups into zero", () => {
    expect(correctUdyamOcr("UDYAM-MH-OO-6131836")).toBe("UDYAM-MH-00-6131836");
  });
});

describe.skipIf(!hasTesseract)("OCR on the specimen certificates", () => {
  const docs = resolve(process.cwd(), "data/kyc_documents");
  const gstinRegistry = new MockGstinRegistry(resolve(process.cwd(), "data/mock_gstin_registry.csv"));
  const udyamRegistry = new MockUdyamRegistry(resolve(process.cwd(), "data/mock_udyam_registry.csv"));

  it("reads the K03 GST certificate and matches the registry after correction", async () => {
    const text = await runOcr(resolve(docs, "K03_gst_certificate.png"));
    const record = (await gstinRegistry.lookup("27XUIXG0767D1ZP"))!;
    expect(crossCheckGst(text, record)).toEqual({ ok: true, mismatches: [], missing: [] });
  });

  it("reads the K02 Udyam certificate and flags only the registration date", async () => {
    const text = await runOcr(resolve(docs, "K02_udyam_certificate.png"));
    const record = (await udyamRegistry.lookup("UDYAM-WB-00-5053330"))!;
    const result = crossCheckUdyam(text, record);
    expect(result.missing).toEqual([]);
    expect(result.mismatches.map((m) => m.field)).toEqual(["date_of_registration"]);
  });

  it("reads the K04 Udyam certificate, fixes the space, and flags the registration date", async () => {
    const text = await runOcr(resolve(docs, "K04_udyam_certificate.png"));
    const record = (await udyamRegistry.lookup("UDYAM-MH-00-6131836"))!;
    expect(crossCheckUdyam(text, record)).toEqual({
      ok: false,
      missing: [],
      mismatches: [{ field: "date_of_registration", certificate: "2025-05-17", registry: "2020-10-24" }],
    });
  });
});