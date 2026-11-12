import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { ConsentStore, ConsentRequiredError } from "../src/consent/store";
import { KycService } from "../src/kyc/service";
import { MockGstinRegistry } from "../src/registry/gstin";
import { MockUdyamRegistry } from "../src/registry/udyam";

const gstinRegistry = new MockGstinRegistry(resolve(process.cwd(), "data/mock_gstin_registry.csv"));
const udyamRegistry = new MockUdyamRegistry(resolve(process.cwd(), "data/mock_udyam_registry.csv"));

function setup() {
  const consents = new ConsentStore();
  const kyc = new KycService(consents, gstinRegistry, udyamRegistry);
  return { consents, kyc };
}

describe("consent store", () => {
  it("records consent and reports it for that lead", () => {
    const { consents } = setup();
    consents.record("L1", "en");
    expect(consents.hasConsent("L1")).toBe(true);
    expect(consents.hasConsent("L2")).toBe(false);
  });

  it("refuses to continue for a lead without consent", () => {
    const { consents } = setup();
    expect(() => consents.requireConsent("L1")).toThrow(ConsentRequiredError);
  });

  it("keeps records frozen so they cannot be altered", () => {
    const { consents } = setup();
    const record = consents.record("L1", "hi");
    expect(() => {
      (record as { leadId: string }).leadId = "someone-else";
    }).toThrow(TypeError);
  });

  it("keeps every consent event in the history", () => {
    const { consents } = setup();
    consents.record("L1", "en");
    consents.record("L1", "ta");
    expect(consents.history("L1")).toHaveLength(2);
  });
});

describe("KYC service: consent gate", () => {
  it("blocks a GSTIN lookup when there is no consent", async () => {
    const { kyc } = setup();
    await expect(kyc.verifyGstin("L1", "32TTNXB7384T1ZW")).rejects.toThrow(ConsentRequiredError);
  });

  it("blocks a Udyam lookup when there is no consent", async () => {
    const { kyc } = setup();
    await expect(kyc.verifyUdyam("L1", "UDYAM-KL-00-3078801")).rejects.toThrow(ConsentRequiredError);
  });
});

describe("KYC service: GSTIN", () => {
  it("returns found for an active GSTIN after consent", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    const result = await kyc.verifyGstin("L1", "32TTNXB7384T1ZW");
    expect(result.status).toBe("found");
  });

  it("rejects a bad checksum before calling the registry", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    expect(await kyc.verifyGstin("L1", "32TTNXB7384T1ZA")).toEqual({
      status: "invalid",
      reason: "bad_checksum",
    });
  });

  it("returns not_found for a well-formed GSTIN that is not in the registry", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    expect(await kyc.verifyGstin("L1", "00AAAAA0000A1ZI")).toEqual({ status: "not_found" });
  });
});

describe("KYC service: Udyam", () => {
  it("finds a registered number and marks district 00 as a test record", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    const result = await kyc.verifyUdyam("L1", "UDYAM-KL-00-3078801");
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.testRecord).toBe(true);
    }
  });

  it("rejects a number in the wrong format", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    expect(await kyc.verifyUdyam("L1", "UDYAM-KL-0-3078801")).toEqual({ status: "invalid" });
  });

  it("returns not_found for a well-formed number that is not in the registry", async () => {
    const { consents, kyc } = setup();
    consents.record("L1", "en");
    expect(await kyc.verifyUdyam("L1", "UDYAM-XX-99-1234567")).toEqual({ status: "not_found" });
  });
});