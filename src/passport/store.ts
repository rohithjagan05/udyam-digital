import { createHash } from "node:crypto";

// Verified details for each business, with sharing that the owner controls per provider.
// Only verified values are stored, never the documents they came from.

export interface AuditEvent {
  at: string;
  action: "store" | "grant" | "revoke" | "read";
  businessId: string;
  field?: string;
  provider?: string;
}

interface StoredValue {
  value: string;
  hash: string; // used to detect tampering, not to recover the value
}

interface Grant {
  grantedAt: string;
  revokedAt: string | null;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const valueKey = (businessId: string, field: string) => `${businessId}|${field}`;
const grantKey = (businessId: string, field: string, provider: string) =>
  `${businessId}|${field}|${provider}`;

export class PassportStore {
  private readonly values = new Map<string, StoredValue>();
  private readonly grants = new Map<string, Grant>();
  private readonly audit: AuditEvent[] = [];

  constructor(private readonly now: () => Date = () => new Date()) {}

  storeVerified(businessId: string, fields: Record<string, string>): void {
    for (const [field, value] of Object.entries(fields)) {
      this.values.set(valueKey(businessId, field), { value, hash: sha256(value) });
      this.log("store", businessId, field);
    }
  }

  // Default is deny: nothing is shared until the owner grants it.
  grant(businessId: string, field: string, provider: string): void {
    if (!this.values.has(valueKey(businessId, field))) {
      throw new Error(`No verified value stored for ${field}`);
    }
    this.grants.set(grantKey(businessId, field, provider), {
      grantedAt: this.timestamp(),
      revokedAt: null,
    });
    this.log("grant", businessId, field, provider);
  }

  revoke(businessId: string, field: string, provider: string): void {
    const grant = this.grants.get(grantKey(businessId, field, provider));
    if (!grant || grant.revokedAt) {
      return;
    }
    grant.revokedAt = this.timestamp();
    this.log("revoke", businessId, field, provider);
  }

  // Returns only the fields this provider has been granted and not revoked.
  read(businessId: string, provider: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, entry] of this.values) {
      const [owner, field] = key.split("|");
      if (owner !== businessId) {
        continue;
      }
      const grant = this.grants.get(grantKey(businessId, field!, provider));
      if (!grant || grant.revokedAt) {
        continue;
      }
      if (sha256(entry.value) !== entry.hash) {
        throw new Error(`Integrity check failed for ${field}`);
      }
      result[field!] = entry.value;
      this.log("read", businessId, field, provider);
    }

    return result;
  }

  auditLog(): readonly AuditEvent[] {
    return this.audit;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private log(action: AuditEvent["action"], businessId: string, field?: string, provider?: string) {
    this.audit.push({ at: this.timestamp(), action, businessId, field, provider });
  }
}