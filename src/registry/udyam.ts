import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// One row of the Udyam registry, with every column as text.
export interface UdyamRecord {
  udyam_number: string;
  enterprise_name: string;
  enterprise_type: string;
  major_activity: string;
  nic_description: string;
  state: string;
  city: string;
  date_of_registration: string;
}

export interface UdyamRegistry {
  lookup(udyamNumber: string): Promise<UdyamRecord | null>;
}

export class MockUdyamRegistry implements UdyamRegistry {
  private readonly records: Map<string, UdyamRecord>;

  constructor(path: string) {
    const rows = parse(readFileSync(path, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as UdyamRecord[];

    this.records = new Map(
      rows.map((row): [string, UdyamRecord] => [row.udyam_number.toUpperCase(), row]),
    );
  }

  async lookup(udyamNumber: string): Promise<UdyamRecord | null> {
    return this.records.get(udyamNumber.trim().toUpperCase()) ?? null;
  }
}