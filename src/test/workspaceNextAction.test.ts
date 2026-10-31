import { describe, expect, it } from "vitest";
import { clientNextAction } from "@/lib/workspaceNextAction";

const state = { status: "collecting", documentsCount: 1, openQuestionsCount: 0, openDuplicatesCount: 0 };

describe("client tax workspace next action", () => {
  it("does not equate submission with acceptance", () => {
    const result = clientNextAction({ ...state, status: "transmitted" });
    expect(result.title).toContain("awaiting a verified outcome");
    expect(result.description).toContain("not IRS acceptance");
    expect(result.target).toBeNull();
  });

  it("prioritises outstanding reviewer questions", () => {
    expect(clientNextAction({ ...state, openQuestionsCount: 2, openDuplicatesCount: 3 }).target).toBe("questions");
  });

  it("directs taxpayers to upload evidence when none exists", () => {
    expect(clientNextAction({ ...state, documentsCount: 0 }).target).toBe("documents");
  });

  it("does not skip the final client review because documents are absent", () => {
    expect(clientNextAction({ ...state, status: "client_review", documentsCount: 0 }).target).toBe("sign");
  });

  it("does not advertise filing when approval is recorded but not transmitted", () => {
    const result = clientNextAction({ ...state, status: "approved_to_file" });
    expect(result.title).toContain("not yet transmitted");
    expect(result.target).toBeNull();
  });

  it("distinguishes recorded acceptance from pending transmission", () => {
    expect(clientNextAction({ ...state, status: "accepted" }).target).toBe("filings");
  });
});
