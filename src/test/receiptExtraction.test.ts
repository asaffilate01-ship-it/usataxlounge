import { describe, expect, it } from "vitest";
import { isValidReceiptDate, normalizeReceiptFields } from "@/lib/receiptExtraction";

describe("receipt extraction reliability", () => {
  it("preserves a real zero-percent business-use allocation", () => {
    const parsed = normalizeReceiptFields({ date: "2025-09-12", amount: 42.95, businessUsePercentage: 0, confidence: 0.8 });
    expect(parsed.businessUsePercentage).toBe(0);
    expect(parsed.date).toBe("2025-09-12");
    expect(parsed.amount).toBe(42.95);
  });

  it("never substitutes today's date for an unknown or impossible receipt date", () => {
    expect(normalizeReceiptFields({ amount: 30 }).date).toBe("");
    expect(normalizeReceiptFields({ date: "2026-02-30" }).date).toBe("");
    expect(isValidReceiptDate("2024-02-29")).toBe(true);
    expect(isValidReceiptDate("2025-02-29")).toBe(false);
  });

  it("leaves missing or out-of-bounds business use unresolved", () => {
    expect(normalizeReceiptFields({}).businessUsePercentage).toBeNull();
    expect(normalizeReceiptFields({ businessUsePercentage: 110 }).businessUsePercentage).toBeNull();
    expect(normalizeReceiptFields({ businessUsePercentage: "-1" }).businessUsePercentage).toBeNull();
    expect(normalizeReceiptFields({ businessUsePercentage: "0" }).businessUsePercentage).toBe(0);
    expect(normalizeReceiptFields({ businessUsePercentage: "100" }).businessUsePercentage).toBe(100);
  });

  it("rejects unknown or negative amounts instead of silently reversing their sign", () => {
    expect(normalizeReceiptFields({ amount: -49.5 }).amount).toBe(0);
    expect(normalizeReceiptFields({ amount: "not a number" }).amount).toBe(0);
    expect(normalizeReceiptFields({ amount: "49.50" }).amount).toBe(49.5);
  });

  it("keeps provider warnings and adds precise missing-field prompts", () => {
    const parsed = normalizeReceiptFields({ needsConfirmation: ["Check merchant name"], confidence: 9 });
    expect(parsed.confidence).toBe(1);
    expect(parsed.needsConfirmation).toContain("Check merchant name");
    expect(parsed.needsConfirmation.some((message) => message.includes("Document date"))).toBe(true);
    expect(parsed.needsConfirmation.some((message) => message.includes("Business-use percentage"))).toBe(true);
  });
});
