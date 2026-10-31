# Filing status provenance and migration acceptance

The pre-existing `advance_tax_engagement` RPC permits staff to transition `transmitted` -> `accepted`; before this change it did not require a provider acceptance event. Separately, staff access to `filings` could update `status`, `submitted_at` and `irs_confirmation`. These are authority/data-provenance gaps.

The added forward migration `20261031112000_taxcenda_verified_status_guard.sql` **has not been deployed** and must be evaluated in staging before any rollout. It fails closed:
- Authenticated preparer/reviewer/admin/client requests may create and edit draft filings, but may not set or change submitted/filed/accepted/rejected states or provider-sourced receipt fields.
- Authenticated requests may not transition tax engagements to transmitted, accepted or rejected through the normal RPC or direct table updates.
- The reviewer UI no longer presents manual "Advance to accepted" after transmission.
- Only a separately controlled trusted service-role channel can write provider-driven states; the adapter must independently verify and record the provider ACK, reconcile it to an engagement and preserve the audit trail before any such write.

## Staging tests required before merge/deployment
1. Under an authenticated staff JWT, attempt `UPDATE filings SET status='accepted'` and `irs_confirmation='made-up'`; both must fail without mutating rows.
2. Under staff JWT, attempt `advance_tax_engagement(...,'accepted')` from a transmitted engagement; it must fail, without inserting a misleading workflow event.
3. Test trusted service-role transition with a **synthetic, verified fixture** for submitted/accepted/rejected and confirm clients only see their own rows.
4. Verify ordinary draft creation, uploads, review gates, client signatures and non-provider workflow transitions still work.
5. Confirm service-role credentials are held only in server secrets, never public Vite environment variables, browser requests or MCP agents.
6. Confirm RLS/storage policies and historical provider statuses are not unintentionally changed. Audit and review historical records for unsupported acceptance claims.
7. Verify provider event and IRS/MeF ACK schema, idempotency, signature/auth requirements, retry/rejection handling and raw-payload retention outside client-visible documents before enabling real transmissions.

This migration enforces a **trusted-origin boundary**, not the full provider-verification feature. There is no approved e-file integration in this PR, and the adapter/event-storage implementation remains blocked pending provider onboarding. Do not claim that the database alone proves an IRS acceptance.
