import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadCatalogue } from "../src/catalogue/load";

const file = resolve(process.cwd(), "data/product_catalogue.csv");

describe("catalogue loader", () => {
  it("loads all 25 products", () => {
    expect(loadCatalogue(file)).toHaveLength(25);
  });

  it("reads the minimum price for Biz Fibre 100", () => {
    const product = loadCatalogue(file).find((p) => p.product_id === "P01");
    expect(product?.product_name).toBe("Biz Fibre 100");
    expect(product?.price_min_inr_per_month).toBe(999);
  });

  it("splits city tiers and dependency lists into arrays", () => {
    const products = loadCatalogue(file);
    const fibre300 = products.find((p) => p.product_id === "P02");
    const backup = products.find((p) => p.product_id === "P09");
    const fibre1g = products.find((p) => p.product_id === "P03");

    expect(fibre300?.available_city_tiers).toEqual([1, 2]);
    expect(backup?.requires_one_of).toEqual(["P01", "P02", "P03", "P05", "P06"]);
    expect(fibre1g?.requires_gstin).toBe(true);
    expect(fibre1g?.available_city_tiers).toEqual([1]);
  });
});