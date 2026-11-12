export const ADDRESS_PROOF_MAX_AGE_DAYS = 90;

// The check date used for the pilot (see docs/decisions.md, D-002). Confirm before the pilot.
export const PILOT_CHECK_DATE = "2026-07-15";

export type AddressProofResult =
  | { ok: true; ageDays: number }
  | { ok: false; reason: "future_dated" | "too_old"; ageDays: number };

// Converts a YYYY-MM-DD date into a whole number of days since 1970.
function toDays(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const days = Date.UTC(year, month - 1, day) / 86_400_000;
  if (Number.isNaN(days)) {
    throw new Error(`Dates must be in the form YYYY-MM-DD, got "${isoDate}"`);
  }
  return days;
}

// The address proof must be dated within 90 days before the check date.
export function checkAddressProof(
  proofDate: string,
  checkDate: string = PILOT_CHECK_DATE,
): AddressProofResult {
  const ageDays = toDays(checkDate) - toDays(proofDate);

  if (ageDays < 0) {
    return { ok: false, reason: "future_dated", ageDays };
  }
  if (ageDays > ADDRESS_PROOF_MAX_AGE_DAYS) {
    return { ok: false, reason: "too_old", ageDays };
  }
  return { ok: true, ageDays };
}