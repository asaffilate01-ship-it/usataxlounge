import type { TaxEngagement, TaxEntity } from "@/integrations/supabase/taxcenda";

export type ReviewQueueFilter = "all" | "blocked" | "review" | "due" | "provider";

export type ReviewQueueItem = {
  engagement: TaxEngagement;
  entity: TaxEntity | null;
  openQuestions: number;
  pendingAnswers: number;
  blockingQuestions: number;
  openDuplicates: number;
};

export const getBlockingCount = (item: ReviewQueueItem): number =>
  item.blockingQuestions + item.openDuplicates;

export const daysUntilDate = (date: string | null, today: string): number | null => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const due = Date.parse(`${date}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  return Number.isFinite(due) && Number.isFinite(now) ? Math.round((due - now) / 86400000) : null;
};

export const reviewQueueSummary = (items: ReviewQueueItem[], today: string) => ({
  active: items.filter(item => item.engagement.workflow_status !== "completed").length,
  blocked: items.filter(item => getBlockingCount(item) > 0).length,
  review: items.filter(item => item.engagement.workflow_status === "accountant_review").length,
  overdue: items.filter(item => item.engagement.workflow_status !== "completed" && (daysUntilDate(item.engagement.due_date, today) ?? 0) < 0).length,
  awaitingProvider: items.filter(item => item.engagement.workflow_status === "transmitted").length,
});

export const reviewQueueItems = (items: ReviewQueueItem[], filter: ReviewQueueFilter, search: string, today: string): ReviewQueueItem[] => {
  const needle = search.trim().toLowerCase();
  const matches = items.filter(item => {
    const due = daysUntilDate(item.engagement.due_date, today);
    const status = item.engagement.workflow_status;
    const filterMatches =
      filter === "all"
      || (filter === "blocked" && getBlockingCount(item) > 0)
      || (filter === "review" && status === "accountant_review")
      || (filter === "provider" && (status === "transmitted" || status === "rejected"))
      || (filter === "due" && status !== "completed" && due !== null && due <= 7);
    if (!filterMatches) return false;
    return !needle || [
      item.entity?.legal_name ?? "",
      String(item.engagement.tax_year),
      status.replace(/_/g, " "),
    ].some(value => value.toLowerCase().includes(needle));
  });
  const rank = (item: ReviewQueueItem) => {
    const due = daysUntilDate(item.engagement.due_date, today);
    if (item.engagement.workflow_status === "completed") return 9;
    if (due !== null && due < 0) return 0;
    if (item.engagement.workflow_status === "rejected") return 1;
    if (getBlockingCount(item) > 0) return 2;
    if (item.engagement.workflow_status === "accountant_review") return 3;
    if (due !== null && due <= 7) return 4;
    if (item.engagement.workflow_status === "transmitted") return 6;
    return 5;
  };
  return matches.sort((a,b) => {
    const order = rank(a) - rank(b);
    if (order) return order;
    const aDue = a.engagement.due_date ?? "9999-12-31";
    const bDue = b.engagement.due_date ?? "9999-12-31";
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    const updated = a.engagement.updated_at.localeCompare(b.engagement.updated_at);
    return updated || a.engagement.id.localeCompare(b.engagement.id);
  });
};
