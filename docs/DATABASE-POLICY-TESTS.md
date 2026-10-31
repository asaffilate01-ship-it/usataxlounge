# TaxCenda: database policy test matrix (not yet executed)

The PR contains `supabase/tests/taxcenda_rls_test.sql`, a pgTAP suite with ten synthetic, rollback-only assertions:
- Allow client to open a genuine collecting engagement.
- Reject client-created accepted engagement.
- Reject engagement creation under another taxpayer.
- Allow in-scope, unreviewed financial entry, including 0% business use.
- Reject unlinked entry, client-approved entry, promotion to approved, and mismatched tax year.
- Reject client-approved asset.
- Prevent cross-user reading.

**Status:** source-authored only. No TaxCenda staging/database connection is available through the current Supabase connector; the connected Supabase project is a different application. These tests have NOT been executed and the new migration has NOT been applied to any database. Application TypeScript/Vitest/lint/build checks do **not** test SQL behaviour.

## Critical precondition: migration-history reconciliation
The existing repository includes a combined `20260828090000_taxcenda_accounting_foundation.sql` migration and subsequent `20260828123443...` / `20260828123559...` / `20260828123645...` split foundation migrations. Their overlapping unconditional `CREATE TABLE`/policy statements make an unmodified full replay into a fresh database potentially conflict. Do **not** delete, rewrite, squash, reapply or mark historical versions applied without comparing the actual `supabase_migrations.schema_migrations` table, database objects and backup in a designated TaxCenda staging environment.

Recommended validation:
1. Provision an isolated TaxCenda staging project and retrieve the actual applied migration ledger.
2. Back up schema/data. Compare combined and split foundation changes; reconcile only with explicit forward repair actions informed by live schema.
3. Run a clean local migration chain or approved staging clone without production credentials.
4. Run `supabase test db` and inspect all 10 assertions; repeat cross-role tests with real Supabase JS sessions using synthetic accounts.
5. Confirm storage buckets are private, new and legacy entries remain usable, provider status guard cannot be bypassed, and no UI workflow shows a false accepted return.
6. Review the changes and apply the forward migration to production separately only after staging succeeds.

Refer to `docs/FILING-STATUS-PROVENANCE.md` for the provider-specific acceptance requirements.
