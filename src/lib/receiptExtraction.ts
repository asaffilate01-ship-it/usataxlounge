/** Parse AI suggestions without inventing transaction facts. Unknown fields remain unresolved. */
export const isValidReceiptDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const normalizeReceiptFields = (input: unknown) => {
  const data: Record<string, unknown> =
    input !== null && typeof input === "object" && !Array.isArray(input)
      ? input as Record<string, unknown>
      : {};
  const rawDate = typeof data.date === "string" ? data.date.trim() : "";
  const date = isValidReceiptDate(rawDate) ? rawDate : "";

  const rawAmount = data.amount;
  const candidateAmount = typeof rawAmount === "number" || (typeof rawAmount === "string" && rawAmount.trim())
    ? Number(rawAmount)
    : NaN;
  const amount = Number.isFinite(candidateAmount) && candidateAmount > 0 ? candidateAmount : 0;

  const rawBusinessUse = data.businessUsePercentage;
  const candidateBusinessUse = typeof rawBusinessUse === "number" || (typeof rawBusinessUse === "string" && rawBusinessUse.trim())
    ? Number(rawBusinessUse)
    : NaN;
  const businessUsePercentage = Number.isFinite(candidateBusinessUse) && candidateBusinessUse >= 0 && candidateBusinessUse <= 100
    ? candidateBusinessUse
    : null;

  const rawConfidence = Number(data.confidence);
  const confidence = Number.isFinite(rawConfidence) ? Math.min(1, Math.max(0, rawConfidence)) : 0;
  const needsConfirmation: string[] = Array.isArray(data.needsConfirmation)
    ? data.needsConfirmation.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  if (!date) needsConfirmation.push("Document date not recognised. Enter the date shown on the source document.");
  if (businessUsePercentage === null) needsConfirmation.push("Business-use percentage missing or invalid. Enter the verified value (0–100%).");
  if (!amount) needsConfirmation.push("Positive transaction amount not recognised. Verify the amount and any refunds or credits.");

  return { date, amount, businessUsePercentage, confidence, needsConfirmation };
};
