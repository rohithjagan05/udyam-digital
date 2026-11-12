import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadCatalogue } from "../src/catalogue/load";
import { buildQuote, compareWithCurrent } from "../src/quote/calc";

const products = loadCatalogue(resolve(process.cwd(), "data/product_catalogue.csv"));

describe("quote calculator", () => {
  it("prices the clinic bundle at Rs 3,020 a month", () => {
    const quote = buildQuote(
      [
        { productId: "P01", quantity: 1 }, // Biz Fibre 100
        { productId: "P07", quantity: 3 }, // 3 business mobile lines
        { productId: "P16", quantity: 5 }, // 5 email users
        { productId: "P17", quantity: 1 }, // cloud backup
      ],
      products,
    );
    expect(quote.monthlyInr).toBe(3020);
    expect(quote.setupInr).toBe(0);
  });

  it("prices the multi-site bundle at Rs 4,494 a month with Rs 4,500 setup", () => {
    const quote = buildQuote(
      [
        { productId: "P01", quantity: 3 },
        { productId: "P09", quantity: 3 }, // failover backup for each site
      ],
      products,
    );
    expect(quote.monthlyInr).toBe(4494);
    expect(quote.setupInr).toBe(4500);
  });

  it("prices the kirana bundle at Rs 1,198 a month", () => {
    const quote = buildQuote(
      [
        { productId: "P04", quantity: 1 },
        { productId: "P18", quantity: 1 },
      ],
      products,
    );
    expect(quote.monthlyInr).toBe(1198);
  });

  it("uses the longest contract in the bundle", () => {
    const quote = buildQuote(
      [
        { productId: "P01", quantity: 1 }, // 12 months
        { productId: "P06", quantity: 1 }, // 24 months
      ],
      products,
    );
    expect(quote.contractMonths).toBe(24);
  });

  it("rejects a failover backup bought without a connection", () => {
    expect(() => buildQuote([{ productId: "P09", quantity: 1 }], products)).toThrow(/P09/);
  });

  it("rejects a quantity that is not a whole number of at least 1", () => {
    expect(() => buildQuote([{ productId: "P01", quantity: 0 }], products)).toThrow();
    expect(() => buildQuote([{ productId: "P01", quantity: 1.5 }], products)).toThrow();
  });

  it("shows the owner's current spend next to the bundle price", () => {
    const quote = buildQuote([{ productId: "P01", quantity: 1 }], products);
    const comparison = compareWithCurrent(2600, quote);
    expect(comparison.bundleMonthlyInr).toBe(999);
    expect(comparison.differenceInr).toBe(1601);
  });
});