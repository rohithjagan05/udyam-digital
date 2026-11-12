import { describe, it, expect } from "vitest";
import { checkAddressProof } from "../src/kyc/address";

describe("90-day address proof rule", () => {
  it("rejects a proof dated 91 days before the check date", () => {
    // 2026-04-15 is 91 days before 2026-07-15
    expect(checkAddressProof("2026-04-15", "2026-07-15")).toEqual({
      ok: false,
      reason: "too_old",
      ageDays: 91,
    });
  });

  it("accepts a proof dated 75 days before the check date", () => {
    expect(checkAddressProof("2026-05-01", "2026-07-15")).toEqual({ ok: true, ageDays: 75 });
  });

  it("accepts a proof that is exactly 90 days old", () => {
    expect(checkAddressProof("2026-04-16", "2026-07-15")).toEqual({ ok: true, ageDays: 90 });
  });

  it("rejects a proof dated after the check date", () => {
    expect(checkAddressProof("2026-08-01", "2026-07-15")).toEqual({
      ok: false,
      reason: "future_dated",
      ageDays: -17,
    });
  });

  it("refuses a date that is not in YYYY-MM-DD form", () => {
    expect(() => checkAddressProof("15/04/2026", "2026-07-15")).toThrow();
  });
});