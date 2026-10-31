import { describe, expect, it } from "vitest";
import { canEditEngagementEntries, validateFinancialEntry } from "@/lib/financialEntry";

const valid = { type: "expense" as const, category: "Software", amount: 123.45, transactionDate: "2025-06-13", businessUsePercentage: 100 };

describe("client financial entry guards", () => {
  it("requires a real date rather than assuming today", () => {
    expect(validateFinancialEntry({ ...valid, transactionDate: "" })).toContain("actual transaction date");
    expect(validateFinancialEntry({ ...valid, transactionDate: "2025-02-29" })).not.toBeNull();
    expect(validateFinancialEntry({ ...valid, transactionDate: "2024-02-29" })).toBeNull();
  });
  it("requires positive finite amounts and cents precision", () => {
    for (const amount of [0, -10, NaN, Infinity, 2.555]) {
      expect(validateFinancialEntry({ ...valid, amount })).not.toBeNull();
    }
    expect(validateFinancialEntry({ ...valid, amount: 0.01 })).toBeNull();
  });
  it("preserves zero percent business use but rejects missing and invalid percentages", () => {
    expect(validateFinancialEntry({ ...valid, businessUsePercentage: 0 })).toBeNull();
    for (const businessUsePercentage of [-1, 100.01, NaN, 21.123]) {
      expect(validateFinancialEntry({ ...valid, businessUsePercentage })).not.toBeNull();
    }
  });
  it("requires category and an editable review state", () => {
    expect(validateFinancialEntry({ ...valid, category: "  " })).not.toBeNull();
    expect(canEditEngagementEntries("collecting")).toBe(true);
    expect(canEditEngagementEntries("client_questions")).toBe(true);
    for (const status of ["accountant_review", "approved_to_file", "transmitted", "accepted", "completed"]) {
      expect(canEditEngagementEntries(status)).toBe(false);
    }
  });
});
