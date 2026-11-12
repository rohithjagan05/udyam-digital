import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import type { Product } from "../src/catalogue/load";
import { loadCatalogue } from "../src/catalogue/load";
import {
  eligibleProducts,
  isEligible,
  missingDependencies,
  type BusinessProfile,
} from "../src/advisor/rules";

const products = loadCatalogue(resolve(process.cwd(), "data/product_catalogue.csv"));
const idsOf = (list: Product[]) => list.map((p) => p.product_id);
const productById = (id: string) => products.find((p) => p.product_id === id)!;

const clinic: BusinessProfile = {
  segment: "prof",
  cityTier: 1,
  employeeCount: 3,
  numSites: 1,
  hasGstin: true,
};

describe("eligibility rules", () => {
  it("offers Biz Fibre 100 to a 3-staff clinic in tier 1", () => {
    expect(idsOf(eligibleProducts(products, clinic))).toContain("P01");
  });

  it("hides Biz Fibre 1G from a 3-staff clinic, which needs 5 staff", () => {
    expect(isEligible(productById("P03"), clinic)).toBe(false);
  });

  it("hides a product that needs a GSTIN from a business without one", () => {
    const bigNoGstin: BusinessProfile = { ...clinic, employeeCount: 6, hasGstin: false };
    expect(isEligible(productById("P03"), bigNoGstin)).toBe(false);
  });

  it("respects city tier: Biz Fibre 1G is tier 1 only", () => {
    const tier2: BusinessProfile = { ...clinic, employeeCount: 6, cityTier: 2 };
    expect(isEligible(productById("P03"), tier2)).toBe(false);
    expect(isEligible(productById("P01"), tier2)).toBe(true);
  });

  it("hides the multi-site SD-WAN from a business with one site", () => {
    const oneSite: BusinessProfile = { ...clinic, segment: "multi", employeeCount: 12, numSites: 1 };
    expect(isEligible(productById("P10"), oneSite)).toBe(false);
  });

  it("hides products whose target segment does not match", () => {
    const micro: BusinessProfile = { ...clinic, segment: "micro", employeeCount: 1 };
    expect(isEligible(productById("P10"), micro)).toBe(false); // P10 targets multi-site only
  });
});

describe("bundle dependencies", () => {
  it("flags the failover backup when it is bought without a connection", () => {
    expect(missingDependencies(["P09"], products)).toEqual(["P09"]);
  });

  it("accepts the failover backup when a connection is in the bundle", () => {
    expect(missingDependencies(["P09", "P01"], products)).toEqual([]);
  });

  it("treats an unknown product ID as missing", () => {
    expect(missingDependencies(["P99"], products)).toEqual(["P99"]);
  });
});