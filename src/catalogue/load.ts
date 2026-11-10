import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// One product, with each CSV column given a proper type.
export interface Product {
  product_id: string;
  category: string;
  product_name: string;
  description: string;
  unit: string;
  price_min_inr_per_month: number;
  price_max_inr_per_month: number;
  one_time_setup_inr: number;
  min_contract_months: number;
  available_city_tiers: number[];
  min_employees: number;
  min_sites: number;
  requires_gstin: boolean;
  requires_one_of: string[];
  typical_install_days: number;
  target_segments: string[];
}

// "1;2" becomes ["1", "2"]. An empty cell becomes [].
function splitList(value: string, separator: string): string[] {
  if (value.trim() === "") {
    return [];
  }
  return value.split(separator).map((item) => item.trim());
}

// "999" becomes 999. Anything that isn't a number throws an error.
function toNumber(value: string, field: string): number {
  const n = Number(value);
  if (value.trim() === "" || Number.isNaN(n)) {
    throw new Error(`Invalid number for ${field}: "${value}"`);
  }
  return n;
}

export function loadCatalogue(path: string): Product[] {
  const text = readFileSync(path, "utf8");
  const rows = parse(text, {
    columns: true, // use the first line as column names
    skip_empty_lines: true,
    trim: true,
    bom: true, // skip the hidden marker some Windows-saved files start with
  }) as Record<string, string>[];

  return rows.map((row) => ({
    product_id: row.product_id,
    category: row.category,
    product_name: row.product_name,
    description: row.description,
    unit: row.unit,
    price_min_inr_per_month: toNumber(row.price_min_inr_per_month, "price_min_inr_per_month"),
    price_max_inr_per_month: toNumber(row.price_max_inr_per_month, "price_max_inr_per_month"),
    one_time_setup_inr: toNumber(row.one_time_setup_inr, "one_time_setup_inr"),
    min_contract_months: toNumber(row.min_contract_months, "min_contract_months"),
    available_city_tiers: splitList(row.available_city_tiers, ";").map((v) =>
      toNumber(v, "available_city_tiers"),
    ),
    min_employees: toNumber(row.min_employees, "min_employees"),
    min_sites: toNumber(row.min_sites, "min_sites"),
    requires_gstin: row.requires_gstin === "Y",
    requires_one_of: splitList(row.requires_one_of, "|"),
    typical_install_days: toNumber(row.typical_install_days, "typical_install_days"),
    target_segments: splitList(row.target_segments, ";"),
  }));
}