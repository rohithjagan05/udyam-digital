import type { Product } from "../catalogue/load";

// What we know about the business, after the advisor's questions (step 1.2).
export interface BusinessProfile {
  segment: "micro" | "prof" | "multi" | "mfg"; // the codes used in target_segments
  cityTier: number;
  employeeCount: number;
  numSites: number;
  hasGstin: boolean;
}

// Can this business buy this one product? Every rule in the catalogue is checked here.
export function isEligible(product: Product, profile: BusinessProfile): boolean {
  return (
    product.target_segments.includes(profile.segment) &&
    product.available_city_tiers.includes(profile.cityTier) &&
    profile.employeeCount >= product.min_employees &&
    profile.numSites >= product.min_sites &&
    (!product.requires_gstin || profile.hasGstin)
  );
}

// All products this business may buy.
export function eligibleProducts(products: Product[], profile: BusinessProfile): Product[] {
  return products.filter((product) => isEligible(product, profile));
}

// Some products only work with another product in the same bundle, for example
// the failover backup needs a connection. This returns the products whose
// requirement is not met. An empty list means the bundle is valid.
export function missingDependencies(bundle: string[], products: Product[]): string[] {
  const chosen = new Set(bundle);

  return bundle.filter((productId) => {
    const product = products.find((p) => p.product_id === productId);
    if (!product) {
      return true; // an unknown product can never be valid
    }
    if (product.requires_one_of.length === 0) {
      return false;
    }
    return !product.requires_one_of.some((required) => chosen.has(required));
  });
}