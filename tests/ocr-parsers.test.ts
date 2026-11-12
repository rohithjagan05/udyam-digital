import { describe, it, expect } from "vitest";
import { parseSignatoryId } from "../src/kyc/signatory-ocr";
import { parseBillDate } from "../src/kyc/address-ocr";
import { checkSignatory } from "../src/kyc/signatory";
import { checkAddressProof } from "../src/kyc/address";

// Text as Tesseract reads the K01 signatory ID: each label on its own line, value below.
const SIGNATORY_TEXT = `Specimen: Authorised Signatory ID
Name
Neha Kaur
Designation
Office admin
For business
Vindhya Tours & Travels
ID no.
SYN-ID-346190
Valid till
2028-03-26`;

describe("signatory ID OCR", () => {
  it("reads the name, business and expiry when labels and values are on separate lines", () => {
    expect(parseSignatoryId(SIGNATORY_TEXT)).toEqual({
      name: "Neha Kaur",
      forBusiness: "Vindhya Tours & Travels",
      validTill: "2028-03-26",
    });
  });

  it("returns null for a field whose label is missing", () => {
    expect(parseSignatoryId("Name\nNeha Kaur").validTill).toBeNull();
  });

  it("passes the signatory check when the owner's contact matches", () => {
    const fields = parseSignatoryId(SIGNATORY_TEXT);
    const result = checkSignatory(
      { name: fields.name!, forBusiness: fields.forBusiness!, validTill: fields.validTill! },
      { contactName: "Neha Kaur", businessName: "Vindhya Tours & Travels" },
      "2026-07-15",
    );
    expect(result.ok).toBe(true);
  });
});

describe("address proof OCR", () => {
  it("reads the bill date and checks it against the 90-day rule", () => {
    const date = parseBillDate("Bill date 2026-06-26\nUnits consumed 2203");
    expect(date).toBe("2026-06-26");
    expect(checkAddressProof(date!, "2026-07-15")).toEqual({ ok: true, ageDays: 19 });
  });

  it("returns null when there is no bill date", () => {
    expect(parseBillDate("Units consumed 2203")).toBeNull();
  });
});