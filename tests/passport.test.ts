import { describe, it, expect } from "vitest";
import { PassportStore } from "../src/passport/store";

const fixedClock = () => new Date("2026-07-15T10:00:00Z");
const fields = { business_name: "Vindhya Tours & Travels", gstin_status: "Active" };

describe("Trust Passport", () => {
  it("shares nothing until the owner grants it", () => {
    const store = new PassportStore(fixedClock);
    store.storeVerified("B1", fields);
    expect(store.read("B1", "telco")).toEqual({});
  });

  it("shares a field only with the provider it was granted to", () => {
    const store = new PassportStore(fixedClock);
    store.storeVerified("B1", fields);
    store.grant("B1", "business_name", "telco");
    expect(store.read("B1", "telco")).toEqual({ business_name: "Vindhya Tours & Travels" });
    expect(store.read("B1", "bank")).toEqual({});
  });

  it("stops sharing a field once it is revoked", () => {
    const store = new PassportStore(fixedClock);
    store.storeVerified("B1", fields);
    store.grant("B1", "business_name", "telco");
    store.revoke("B1", "business_name", "telco");
    expect(store.read("B1", "telco")).toEqual({});
  });

  it("refuses to grant a field that was never verified", () => {
    const store = new PassportStore(fixedClock);
    expect(() => store.grant("B1", "pan", "telco")).toThrow(/No verified value/);
  });

  it("records every store, grant, revoke and read in the audit log", () => {
    const store = new PassportStore(fixedClock);
    store.storeVerified("B1", fields);
    store.grant("B1", "business_name", "telco");
    store.read("B1", "telco");
    store.revoke("B1", "business_name", "telco");
    const actions = store.auditLog().map((e) => e.action);
    expect(actions).toEqual(["store", "store", "grant", "read", "revoke"]);
  });

  it("refuses to share a value that has been changed after it was stored", () => {
    const store = new PassportStore(fixedClock);
    store.storeVerified("B1", fields);
    store.grant("B1", "business_name", "telco");
    const internal = store as unknown as { values: Map<string, { value: string; hash: string }> };
    internal.values.get("B1|business_name")!.value = "Tampered Name";
    expect(() => store.read("B1", "telco")).toThrow(/Integrity check failed/);
  });
});