/**
 * Recommendations drawn only from recorded engagement facts.
 * No calculated score or AI recommendation can change the filing status.
 */
export type ClientNextActionTarget = "questions" | "documents" | "sign" | "filings" | null;
export type ClientNextAction = {
  title: string;
  description: string;
  target: ClientNextActionTarget;
  buttonLabel?: string;
  category: "action" | "waiting" | "recorded";
};
export type ClientActionInput = {
  status: string;
  documentsCount: number;
  openQuestionsCount: number;
  openDuplicatesCount: number;
};

export const clientNextAction = (input: ClientActionInput): ClientNextAction => {
  switch (input.status) {
    case "completed":
      return { title: "Tax year completed", description: "The engagement is recorded as complete. Confirm the final documents and acknowledgements with your tax professional.", target: "filings", buttonLabel: "View filings", category: "recorded" };
    case "accepted":
      return { title: "Acceptance recorded", description: "An acceptance is recorded in the workspace. Check your filing records and retain the official acknowledgement.", target: "filings", buttonLabel: "View filings", category: "recorded" };
    case "rejected":
      return { title: "Correction needed", description: "A rejection is recorded. Your preparer must review the provider response and determine what should be corrected.", target: null, category: "waiting" };
    case "transmitted":
      return { title: "Submitted — awaiting a verified outcome", description: "Transmission is not IRS acceptance. Your tax professional will review the provider acknowledgement or rejection.", target: null, category: "waiting" };
    case "approved_to_file":
      return { title: "Approved, not yet transmitted", description: "Your approval is recorded. Filing is a separate action that requires an authorised provider and verified submission.", target: null, category: "waiting" };
    case "signature_complete":
      return { title: "Signature recorded", description: "Your professional must complete the remaining filing-authorisation and provider checks before transmission.", target: null, category: "waiting" };
    case "client_review":
      return { title: "Review your final filing package", description: "Check the tax documents, resolve any outstanding questions and give your authorisation if the package is correct.", target: "sign", buttonLabel: "Review & approve", category: "action" };
  }

  if (input.openQuestionsCount > 0) {
    return { title: `Answer ${input.openQuestionsCount} outstanding ${input.openQuestionsCount === 1 ? "question" : "questions"}`, description: "Your tax professional needs more information before the review can proceed.", target: "questions", buttonLabel: "Review questions", category: "action" };
  }
  if (input.openDuplicatesCount > 0) {
    return { title: `Review ${input.openDuplicatesCount} possible ${input.openDuplicatesCount === 1 ? "duplicate" : "duplicates"}`, description: "Confirm whether the source records refer to the same transaction or separate records.", target: "questions", buttonLabel: "Resolve duplicates", category: "action" };
  }
  if (input.documentsCount === 0) {
    return { title: "Start with your source documents", description: "Upload available receipts, statements and tax forms so your professional can review the original evidence.", target: "documents", buttonLabel: "Open documents", category: "action" };
  }
  return { title: "Awaiting professional review", description: "No client questions or duplicate decisions are currently open. Your preparer may request more information as review continues.", target: null, category: "waiting" };
};
