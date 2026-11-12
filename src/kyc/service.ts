import { checkGstin } from "../validators/gstin";
import type { GstinRecord, GstinRegistry } from "../registry/gstin";
import type { UdyamRecord, UdyamRegistry } from "../registry/udyam";
import type { ConsentStore } from "../consent/store";

// Udyam numbers look like UDYAM-KL-00-3078801: state, district, then 7 digits.
const UDYAM_FORMAT = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

export type GstinResult =
  | { status: "invalid"; reason: "wrong_length" | "bad_format" | "bad_checksum" }
  | { status: "not_found" }
  | { status: "found"; record: GstinRecord };

export type UdyamResult =
  | { status: "invalid" }
  | { status: "not_found" }
  | { status: "found"; record: UdyamRecord; testRecord: boolean };

export class KycService {
  constructor(
    private readonly consents: ConsentStore,
    private readonly gstinRegistry: GstinRegistry,
    private readonly udyamRegistry: UdyamRegistry,
  ) {}

  // Every check starts with the consent gate, so no registry is called without consent.
  async verifyGstin(leadId: string, input: string): Promise<GstinResult> {
    this.consents.requireConsent(leadId);

    const check = checkGstin(input);
    if (!check.valid) {
      return { status: "invalid", reason: check.reason };
    }

    const record = await this.gstinRegistry.lookup(input);
    return record ? { status: "found", record } : { status: "not_found" };
  }

  async verifyUdyam(leadId: string, input: string): Promise<UdyamResult> {
    this.consents.requireConsent(leadId);

    const number = input.trim().toUpperCase();
    if (!UDYAM_FORMAT.test(number)) {
      return { status: "invalid" };
    }

    const record = await this.udyamRegistry.lookup(number);
    if (!record) {
      return { status: "not_found" };
    }

    // District code 00 appears only in test data (see docs/decisions.md, D-001).
    return { status: "found", record, testRecord: number.split("-")[2] === "00" };
  }
}