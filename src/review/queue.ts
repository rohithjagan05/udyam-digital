import type { CrossCheck } from "../kyc/certificates";

export type CaseKind = "gst" | "udyam" | "signatory" | "address";
export type Decision = "approved" | "rejected" | "reupload_requested";
export type CaseStatus = "open" | Decision;

export interface ReviewCase {
  caseId: number;
  leadId: string;
  kind: CaseKind;
  problems: string[]; // field names, e.g. "date_of_registration"
  status: CaseStatus;
  openedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  note: string | null;
}

export interface ReviewEvent {
  at: string;
  caseId: number;
  action: "opened" | Decision;
  by: string | null;
}

// Mismatches go here for a person to decide. Nothing is approved or rejected automatically.
export class ReviewQueue {
  private readonly cases: ReviewCase[] = [];
  private readonly events: ReviewEvent[] = [];

  constructor(private readonly now: () => Date = () => new Date()) {}

  open(leadId: string, kind: CaseKind, problems: string[]): ReviewCase {
    if (problems.length === 0) {
      throw new Error("A review case needs at least one problem");
    }
    const reviewCase: ReviewCase = {
      caseId: this.cases.length + 1,
      leadId,
      kind,
      problems: [...problems],
      status: "open",
      openedAt: this.stamp(),
      decidedAt: null,
      decidedBy: null,
      note: null,
    };
    this.cases.push(reviewCase);
    this.log(reviewCase.caseId, "opened", null);
    return reviewCase;
  }

  listOpen(): ReviewCase[] {
    return this.cases.filter((c) => c.status === "open");
  }

  forLead(leadId: string): ReviewCase[] {
    return this.cases.filter((c) => c.leadId === leadId);
  }

  decide(caseId: number, decision: Decision, adminId: string, note = ""): ReviewCase {
    const reviewCase = this.find(caseId);
    if (reviewCase.status !== "open") {
      throw new Error(`Case ${caseId} is already ${reviewCase.status}`);
    }
    if (adminId.trim() === "") {
      throw new Error("An admin ID is required to decide a case");
    }
    if (decision !== "approved" && note.trim() === "") {
      throw new Error("A note is required to reject a case or ask for a re-upload");
    }

    reviewCase.status = decision;
    reviewCase.decidedAt = this.stamp();
    reviewCase.decidedBy = adminId;
    reviewCase.note = note.trim() === "" ? null : note.trim();
    this.log(caseId, decision, adminId);
    return reviewCase;
  }

  auditLog(): readonly ReviewEvent[] {
    return this.events;
  }

  private find(caseId: number): ReviewCase {
    const reviewCase = this.cases.find((c) => c.caseId === caseId);
    if (!reviewCase) {
      throw new Error(`No review case ${caseId}`);
    }
    return reviewCase;
  }

  private stamp(): string {
    return this.now().toISOString();
  }

  private log(caseId: number, action: ReviewEvent["action"], by: string | null) {
    this.events.push({ at: this.stamp(), caseId, action, by });
  }
}

// Opens a case only when the cross-check found something to look at.
export function openFromCrossCheck(
  queue: ReviewQueue,
  leadId: string,
  kind: CaseKind,
  check: CrossCheck,
): ReviewCase | null {
  if (check.ok) {
    return null;
  }
  const problems = [
    ...check.mismatches.map((m) => m.field),
    ...check.missing.map((f) => `${f} (not readable)`),
  ];
  return queue.open(leadId, kind, problems);
}

// The message the owner sees. It names the field and asks for that document only (decision D-003).
export function ownerMessage(problem: string): string {
  const labels: Record<string, string> = {
    gstin: "GSTIN",
    legal_name: "legal name",
    trade_name: "trade name",
    udyam_number: "Udyam number",
    enterprise_name: "enterprise name",
    city: "city",
    state: "state",
    date_of_registration: "registration date",
    name_mismatch: "name on the signatory ID",
    business_mismatch: "business named on the signatory ID",
    id_expired: "expiry date on the signatory ID",
    too_old: "date on the address proof",
  };
  const label = problem.replace(/ \(not readable\)$/, "");
  const name = labels[label] ?? label;
  if (problem.endsWith("(not readable)")) {
    return `We could not read the ${name} on your document. Please upload a clearer photo of it.`;
  }
  return `The ${name} on your document does not match our records. Please upload that document again.`;
}