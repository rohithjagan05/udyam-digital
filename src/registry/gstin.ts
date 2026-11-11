import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// One row of the GSTIN registry, with every column as text.
export interface GstinRecord {
  gstin: string;
  legal_name: string;
  trade_name: string;
  constitution: string;
  principal_place_of_business: string;
  state: string;
  registration_date: string;
  status: string;
}

// The app only talks to this interface. A mock and a real API both implement it,
// so switching later means changing one class, not the whole app.
export interface GstinRegistry {
  lookup(gstin: string): Promise<GstinRecord | null>;
}

// Reads the mock CSV once and answers lookups from memory.
export class MockGstinRegistry implements GstinRegistry {
  private readonly records: Map<string, GstinRecord>;

  constructor(path: string) {
    const rows = parse(readFileSync(path, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as GstinRecord[];

    this.records = new Map(
      rows.map((row): [string, GstinRecord] => [row.gstin.toUpperCase(), row]),
    );
  }

  async lookup(gstin: string): Promise<GstinRecord | null> {
    // Users may type spaces or lower-case letters, so normalise first.
    return this.records.get(gstin.trim().toUpperCase()) ?? null;
  }
}