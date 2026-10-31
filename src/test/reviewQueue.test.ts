import { describe, expect, it } from "vitest";
import { daysUntilDate, getBlockingCount, reviewQueueItems, reviewQueueSummary, type ReviewQueueItem } from "@/lib/reviewQueue";

const today = "2026-10-31";
const item = (id: string, status: string, due: string | null, block = 0): ReviewQueueItem => ({
  engagement: { id, tax_year: 2025, due_date: due, updated_at: "2026-10-29T00:00:00Z", workflow_status: status } as ReviewQueueItem["engagement"],
  entity: { legal_name: `Client ${id}` } as ReviewQueueItem["entity"],
  openQuestions: block,
  pendingAnswers: 0,
  blockingQuestions: block,
  openDuplicates: 0,
});

describe("review queue decisions", () => {
  const sample = [
    item("regular", "collecting", null),
    item("past", "client_questions", "2026-10-20"),
    item("review", "accountant_review", null, 2),
    item("provider", "transmitted", null),
    item("soon", "bookkeeping_review", "2026-11-04"),
    item("completed", "completed", "2026-10-01"),
  ];
  it("counts exact blocking conditions rather than all unanswered questions", () => {
    const draft = { ...item("draft", "collecting", null), openQuestions: 3, pendingAnswers: 4 };
    expect(getBlockingCount(draft)).toBe(0);
    expect(reviewQueueSummary(sample, today)).toEqual({
      active: 5, blocked: 1, review: 1, overdue: 1, awaitingProvider: 1,
    });
  });
  it("puts overdue cases first, then blocker cases, without showing completed as overdue", () => {
    expect(reviewQueueItems(sample, "all", "", today).map(v=>v.engagement.id)).toEqual([
      "past", "review", "soon", "regular", "provider", "completed",
    ]);
  });
  it("supports due, provider, review and name search filters", () => {
    expect(reviewQueueItems(sample, "due", "", today).map(v=>v.engagement.id)).toEqual(["past", "soon"]);
    expect(reviewQueueItems(sample, "provider", "", today).map(v=>v.engagement.id)).toEqual(["provider"]);
    expect(reviewQueueItems(sample, "review", "", today).map(v=>v.engagement.id)).toEqual(["review"]);
    expect(reviewQueueItems(sample, "all", "client regular", today)).toHaveLength(1);
  });
  it("calculates calendar deadlines without local timezone drift", () => {
    expect(daysUntilDate("2026-10-31",today)).toBe(0);
    expect(daysUntilDate("2026-11-01",today)).toBe(1);
    expect(daysUntilDate("2026-10-30",today)).toBe(-1);
    expect(daysUntilDate(null,today)).toBeNull();
  });
});
