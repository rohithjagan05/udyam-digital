import { describe, it, expect } from "vitest";
import { checkSignatory } from "../src/kyc/signatory";

const contact = { contactName: "Neha Kaur", businessName: "Vindhya Tours & Travels" };
const idValid = { name: "Neha Kaur", forBusiness: "Vindhya Tours & Travels", validTill: "2028-03-26" };

describe("signatory check", () => {
  it("passes when the ID matches the contact and the business and is still valid", () => {
    expect(checkSignatory(idValid, contact, "2026-07-15")).toEqual({ ok: true, problems: [] });
  });

  it("flags a name that does not match the contact", () => {
    const result = checkSignatory({ ...idValid, name: "Neha Sharma" }, contact, "2026-07-15");
    expect(result.problems).toEqual(["name_mismatch"]);
  });

  it("flags an ID that is for a different business", () => {
    const result = checkSignatory({ ...idValid, forBusiness: "Other Co" }, contact, "2026-07-15");
    expect(result.problems).toEqual(["business_mismatch"]);
  });

  it("flags an expired ID", () => {
    const result = checkSignatory({ ...idValid, validTill: "2026-06-30" }, contact, "2026-07-15");
    expect(result.problems).toEqual(["id_expired"]);
  });

  it("accepts an ID that is valid on the check date itself", () => {
    const result = checkSignatory({ ...idValid, validTill: "2026-07-15" }, contact, "2026-07-15");
    expect(result.ok).toBe(true);
  });
});