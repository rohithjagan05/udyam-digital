import type { Product } from "../catalogue/load";
import { missingDependencies } from "../advisor/rules";

// One product in the bundle and how many the owner wants.
export interface QuoteLine {
  productId: string;
  quantity: number;
}

export interface Quote {
  monthlyInr: number;
  setupInr: number;
  contractMonths: number;
  lines: { productName: string; quantity: number; monthlyInr: number; setupInr: number }[];
}

export interface CurrentSpendComparison {
  currentMonthlyInr: number;
  bundleMonthlyInr: number;
  differenceInr: number; // positive means the bundle costs less than what they pay now
}

// Works out the totals. The minimum catalogue price is used, so the owner sees the lowest figure.
export function buildQuote(lines: QuoteLine[], products: Product[]): Quote {
  const invalid = missingDependencies(
    lines.map((line) => line.productId),
    products,
  );
  if (invalid.length > 0) {
    throw new Error(`These products cannot be sold in this bundle: ${invalid.join(", ")}`);
  }

  const quoteLines = lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Quantity for ${line.productId} must be a whole number of at least 1`);
    }
    const product = products.find((p) => p.product_id === line.productId)!;
    return {
      productName: product.product_name,
      quantity: line.quantity,
      monthlyInr: product.price_min_inr_per_month * line.quantity,
      setupInr: product.one_time_setup_inr * line.quantity,
      contractMonths: product.min_contract_months,
    };
  });

  return {
    monthlyInr: quoteLines.reduce((sum, l) => sum + l.monthlyInr, 0),
    setupInr: quoteLines.reduce((sum, l) => sum + l.setupInr, 0),
    contractMonths: Math.max(...quoteLines.map((l) => l.contractMonths)),
    lines: quoteLines.map(({ contractMonths: _ignored, ...line }) => line),
  };
}

// Puts the owner's current spend next to the bundle price.
export function compareWithCurrent(currentMonthlyInr: number, quote: Quote): CurrentSpendComparison {
  return {
    currentMonthlyInr,
    bundleMonthlyInr: quote.monthlyInr,
    differenceInr: currentMonthlyInr - quote.monthlyInr,
  };
}