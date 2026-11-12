import { describe, it, expect } from "vitest";
import { buildProfile, parseNumber } from "../src/advisor/questions";

describe("advisor answers", () => {
  it("turns a clinic's answers into a professional-segment profile", () => {
    const profile = buildProfile(
      { businessType: "professional", sites: 1, staff: 3, internet: "fibre", monthlySpend: 2600 },
      1,
    );
    expect(profile).toEqual({
      segment: "prof",
      cityTier: 1,
      employeeCount: 3,
      numSites: 1,
      hasGstin: false,
    });
  });

  it("marks a valid GSTIN as present and an invalid one as absent", () => {
    const base = { businessType: "shop" as const, sites: 1, staff: 1 };
    expect(buildProfile({ ...base, gstin: "32TTNXB7384T1ZW" }, 1).hasGstin).toBe(true);
    expect(buildProfile({ ...base, gstin: "32TTNXB7384T1ZA" }, 1).hasGstin).toBe(false);
  });

  it("refuses to build a profile when a required answer is missing", () => {
    expect(() => buildProfile({ sites: 1, staff: 3 }, 1)).toThrow();
  });

  it("accepts numbers with commas and rejects values out of range", () => {
    expect(parseNumber("1,00,000", 0, 200000)).toBe(100000);
    expect(parseNumber("0", 1, 50)).toBeNull();
    expect(parseNumber("abc", 0, 50)).toBeNull();
    expect(parseNumber("", 0, 50)).toBeNull();
  });
});