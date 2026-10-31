import { isValidReceiptDate } from "@/lib/receiptExtraction";

/** Client-side validation only: server-side RLS and database constraints remain authoritative. */
export interface FinancialEntryFacts {
  type: "income" | "expense";
  category: string;
  amount: number;
  transactionDate: string;
  businessUsePercentage: number;
}

export const validateFinancialEntry = (item: FinancialEntryFacts): string | null => {
  if (item.type !== "income" && item.type !== "expense") return "Choose income or expense.";
  if (!item.category.trim()) return "Enter a financial category.";
  if (!Number.isFinite(item.amount) || item.amount <= 0) return "Enter a positive, finite amount.";
  if (Math.abs(item.amount * 100 - Math.round(item.amount * 100)) > 1e-6)
    return "Enter amounts to no more than two decimal places.";
  if (item.amount > 999999999999.99) return "Amount exceeds the supported range.";
  if (!isValidReceiptDate(item.transactionDate))
    return "Enter the actual transaction date from your records. No date will be assumed.";
  if (!Number.isFinite(item.businessUsePercentage) || item.businessUsePercentage < 0 || item.businessUsePercentage > 100)
    return "Business use must be between 0% and 100%.";
  if (Math.abs(item.businessUsePercentage * 100 - Math.round(item.businessUsePercentage * 100)) > 1e-6)
    return "Business use must have no more than two decimal places.";
  return null;
};

export const canEditEngagementEntries = (status: string): boolean =>
  status === "collecting" || status === "client_questions";
