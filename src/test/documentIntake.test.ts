import { describe, expect, it } from "vitest";
import { safeStorageFilename, validateIntakeFile } from "@/lib/documentIntake";
import { filingTaxYear } from "@/integrations/supabase/taxcenda";

describe("document intake controls", () => {
  it("accepts supported tax source documents", () => {
    expect(() => validateIntakeFile(new File(["statement"], "bank.csv", { type: "text/csv" }))).not.toThrow();
    expect(() => validateIntakeFile(new File(["image"], "receipt.jpg", { type: "image/jpeg" }))).not.toThrow();
  });

  it("rejects unsupported or empty uploads", () => {
    expect(() => validateIntakeFile(new File([], "empty.pdf", { type: "application/pdf" }))).toThrow("empty");
    expect(() => validateIntakeFile(new File(["program"], "unsafe.exe", { type: "application/x-msdownload" }))).toThrow("Use a JPG");
  });

  it("creates storage-safe file names", () => {
    expect(safeStorageFilename("Acme / receipt #42 (final).pdf")).toBe("Acme-receipt-42-final-.pdf");
  });
});

describe("filing year", () => {
  it("defaults to the previous calendar year", () => {
    expect(filingTaxYear(new Date("2026-08-28T00:00:00Z"))).toBe(2025);
  });
});
