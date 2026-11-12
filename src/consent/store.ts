import { randomUUID } from "node:crypto";

// Bump this when the consent text changes. Owners who agreed to an older version are asked again.
export const CONSENT_VERSION = "1.0";

export type Language = "en" | "hi" | "ta";

export interface ConsentRecord {
  readonly consentId: string;
  readonly leadId: string;
  readonly version: string;
  readonly language: Language;
  readonly acceptedAt: string;
}

export class ConsentRequiredError extends Error {
  constructor(leadId: string) {
    super(`No consent on record for lead ${leadId}`);
    this.name = "ConsentRequiredError";
  }
}

// Append-only: records can be added and read, but never changed or removed.
export class ConsentStore {
  private readonly records: ConsentRecord[] = [];

  record(leadId: string, language: Language, now: Date = new Date()): ConsentRecord {
    const record: ConsentRecord = Object.freeze({
      consentId: randomUUID(),
      leadId,
      version: CONSENT_VERSION,
      language,
      acceptedAt: now.toISOString(),
    });
    this.records.push(record);
    return record;
  }

  hasConsent(leadId: string): boolean {
    return this.records.some((r) => r.leadId === leadId && r.version === CONSENT_VERSION);
  }

  // Throws if the owner has not agreed to the current consent text.
  requireConsent(leadId: string): void {
    if (!this.hasConsent(leadId)) {
      throw new ConsentRequiredError(leadId);
    }
  }

  history(leadId: string): readonly ConsentRecord[] {
    return this.records.filter((r) => r.leadId === leadId);
  }
}