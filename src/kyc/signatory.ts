import { PILOT_CHECK_DATE } from "./address";
import { sameText } from "./text";

export interface SignatoryId {
  name: string;
  forBusiness: string;
  validTill: string; // YYYY-MM-DD
}

export interface LeadContact {
  contactName: string;
  businessName: string;
}

export type SignatoryProblem = "name_mismatch" | "business_mismatch" | "id_expired";

export interface SignatoryCheck {
  ok: boolean;
  problems: SignatoryProblem[];
}

// Checks that the person on the ID is the contact on the lead, acting for the same business,
// and that the ID is still valid on the check date.
export function checkSignatory(
  id: SignatoryId,
  contact: LeadContact,
  checkDate: string = PILOT_CHECK_DATE,
): SignatoryCheck {
  const problems: SignatoryProblem[] = [];

  if (!sameText(id.name, contact.contactName)) {
    problems.push("name_mismatch");
  }
  if (!sameText(id.forBusiness, contact.businessName)) {
    problems.push("business_mismatch");
  }
  // ISO dates (YYYY-MM-DD) sort correctly as plain text.
  if (id.validTill < checkDate) {
    problems.push("id_expired");
  }

  return { ok: problems.length === 0, problems };
}