-- TaxCenda: fail closed on IRS/third-party filing-status mutations until
-- an approved provider integration verifies and records the actual response.
-- Do not change an already-applied historical migration.
-- This deliberately leaves verified event ingestion for the trusted backend
-- integration phase; an authenticated staff session is NOT provider proof.

CREATE OR REPLACE FUNCTION public.taxcenda_guard_filing_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protected_statuses text[] := ARRAY['submitted', 'transmitted', 'filed', 'accepted', 'rejected'];
BEGIN
  -- Only the trusted backend service role may record e-file transmissions,
  -- provider acknowledgements and final filing states. Its application
  -- adapter must validate the provider receipt before writing these values.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF lower(COALESCE(NEW.status::text, '')) = ANY(v_protected_statuses)
       OR NEW.submitted_at IS NOT NULL
       OR NEW.irs_confirmation IS NOT NULL THEN
      RAISE EXCEPTION 'Filing transmission and IRS status require a verified provider event';
    END IF;
    RETURN NEW;
  END IF;

  -- Keep legitimate edits to intake/draft filings possible, while preventing
  -- staff or clients from synthesizing/rewriting a transmission or ACK.
  IF (
    NEW.status IS DISTINCT FROM OLD.status
    AND (
      lower(COALESCE(NEW.status::text, '')) = ANY(v_protected_statuses)
      OR lower(COALESCE(OLD.status::text, '')) = ANY(v_protected_statuses)
    )
  ) OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    OR NEW.irs_confirmation IS DISTINCT FROM OLD.irs_confirmation THEN
    RAISE EXCEPTION 'Filing transmission and IRS status require a verified provider event';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.taxcenda_guard_filing_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS taxcenda_guard_filing_status_trigger ON public.filings;
CREATE TRIGGER taxcenda_guard_filing_status_trigger
BEFORE INSERT OR UPDATE ON public.filings
FOR EACH ROW EXECUTE FUNCTION public.taxcenda_guard_filing_status();

CREATE OR REPLACE FUNCTION public.taxcenda_guard_engagement_provider_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authenticated users may not insert an engagement already in a later
  -- workflow state. Client creation must start in collecting, never accepted.
  IF TG_OP = 'INSERT' THEN
    IF auth.role() IS DISTINCT FROM 'service_role' AND
       (NEW.workflow_status <> 'collecting'
        OR NEW.progress > 10
        OR NEW.final_package_hash IS NOT NULL
        OR NEW.locked_at IS NOT NULL
        OR NEW.assigned_preparer IS NOT NULL
        OR NEW.assigned_reviewer IS NOT NULL) THEN
      RAISE EXCEPTION 'New tax-year engagements must start in collecting with no approval metadata';
    END IF;
    RETURN NEW;
  END IF;

  -- The existing advance_tax_engagement RPC allows transition from
  -- transmitted to accepted. A status-only RPC call is not evidence.
  -- Reject it at the table boundary until a trusted adapter submits the
  -- confirmed provider event from the service-role channel.
  IF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status
     AND NEW.workflow_status IN ('transmitted', 'accepted', 'rejected')
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Provider-verified transmission or ACK is required for this status';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.taxcenda_guard_engagement_provider_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS taxcenda_guard_engagement_provider_status_trigger ON public.tax_engagements;
CREATE TRIGGER taxcenda_guard_engagement_provider_status_trigger
BEFORE INSERT OR UPDATE ON public.tax_engagements
FOR EACH ROW EXECUTE FUNCTION public.taxcenda_guard_engagement_provider_status();

COMMENT ON FUNCTION public.taxcenda_guard_filing_status() IS
  'Fail-closed filing status boundary: authorised user sessions cannot forge transmission/IRS response fields; provider adapter and audited service-role ingestion are still required.';
COMMENT ON FUNCTION public.taxcenda_guard_engagement_provider_status() IS
  'Fail-closed engagement status boundary: only trusted provider-ingestion channel can record transmission or acknowledgement status.';

-- The original client INSERT policy checked ownership but not workflow state:
-- a taxpayer could create an "accepted" engagement directly from the browser.
DROP POLICY IF EXISTS "Clients create own engagements" ON public.tax_engagements;
CREATE POLICY "Clients create own engagements" ON public.tax_engagements
FOR INSERT TO authenticated WITH CHECK (
  user_id = (select auth.uid())
  AND workflow_status = 'collecting'
  AND progress <= 10
  AND assigned_preparer IS NULL
  AND assigned_reviewer IS NULL
  AND final_package_hash IS NULL
  AND locked_at IS NULL
  AND due_date IS NULL
  AND scope = ARRAY['federal_income_tax']::text[]
  AND current_step IN ('Upload your records', 'Upload and confirm source records')
  AND EXISTS (
    SELECT 1 FROM public.tax_entities e
    WHERE e.id = entity_id AND e.owner_user_id = (select auth.uid())
      AND e.status = 'active'
  )
);

-- Link every new client finance entry to its correct taxpayer, tax year and
-- evidence. Existing unlinked/legacy rows remain readable, but clients cannot
-- create or modify unlinked records to bypass a locked engagement.
DROP POLICY IF EXISTS "Clients create income expenses during intake" ON public.income_expenses;
CREATE POLICY "Clients create income expenses during intake" ON public.income_expenses
FOR INSERT TO authenticated WITH CHECK (
  user_id = (select auth.uid())
  AND engagement_id IS NOT NULL AND entity_id IS NOT NULL
  AND transaction_date IS NOT NULL
  AND review_status = 'unreviewed' AND reviewed_by IS NULL AND reviewed_at IS NULL
  AND created_source IN ('manual', 'document_ai')
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = income_expenses.engagement_id
      AND e.user_id = (select auth.uid())
      AND e.entity_id = income_expenses.entity_id
      AND e.tax_year = income_expenses.tax_year
      AND e.workflow_status IN ('collecting', 'client_questions')
  )
  AND (
    (source_document_id IS NULL AND document_url IS NULL)
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = source_document_id
        AND d.user_id = (select auth.uid())
        AND d.engagement_id = income_expenses.engagement_id
        AND d.entity_id = income_expenses.entity_id
        AND d.file_url = income_expenses.document_url
    )
  )
);

DROP POLICY IF EXISTS "Clients correct income expenses during intake" ON public.income_expenses;
CREATE POLICY "Clients correct income expenses during intake" ON public.income_expenses
FOR UPDATE TO authenticated USING (
  user_id = (select auth.uid())
  AND review_status = 'unreviewed'
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = income_expenses.engagement_id
      AND e.user_id = (select auth.uid())
      AND e.workflow_status IN ('collecting', 'client_questions')
  )
) WITH CHECK (
  user_id = (select auth.uid())
  AND review_status = 'unreviewed' AND reviewed_by IS NULL AND reviewed_at IS NULL
  AND created_source IN ('manual', 'document_ai')
  AND entity_id IS NOT NULL AND engagement_id IS NOT NULL AND transaction_date IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = income_expenses.engagement_id
      AND e.entity_id = income_expenses.entity_id
      AND e.tax_year = income_expenses.tax_year
      AND e.user_id = (select auth.uid())
      AND e.workflow_status IN ('collecting', 'client_questions')
  )
  AND (
    (source_document_id IS NULL AND document_url IS NULL)
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = source_document_id
        AND d.user_id = (select auth.uid())
        AND d.engagement_id = income_expenses.engagement_id
        AND d.entity_id = income_expenses.entity_id
        AND d.file_url = income_expenses.document_url
    )
  )
);

DROP POLICY IF EXISTS "Clients remove income expenses during intake" ON public.income_expenses;
CREATE POLICY "Clients remove income expenses during intake" ON public.income_expenses
FOR DELETE TO authenticated USING (
  user_id = (select auth.uid())
  AND review_status = 'unreviewed'
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = income_expenses.engagement_id AND e.user_id = (select auth.uid())
      AND e.workflow_status IN ('collecting', 'client_questions')
  )
);

-- A client may supply asset facts but cannot supply an approved tax treatment,
-- depreciation result, Section 179 election or released asset status.
DROP POLICY IF EXISTS "Clients create own fixed assets" ON public.fixed_assets;
CREATE POLICY "Clients create own fixed assets" ON public.fixed_assets
FOR INSERT TO authenticated WITH CHECK (
  user_id = (select auth.uid())
  AND status = 'needs_review'
  AND tax_method IS NULL AND recovery_period_years IS NULL AND convention IS NULL
  AND section_179_elected = 0 AND bonus_depreciation_elected = false
  AND prior_depreciation = 0 AND current_depreciation = 0
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = fixed_assets.engagement_id
      AND e.user_id = (select auth.uid())
      AND e.entity_id = fixed_assets.entity_id
      AND e.workflow_status IN ('collecting', 'client_questions')
  )
  AND (source_document_id IS NULL OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = fixed_assets.source_document_id
      AND d.user_id = (select auth.uid())
      AND d.engagement_id = fixed_assets.engagement_id
  ))
  AND (source_entry_id IS NULL OR EXISTS (
    SELECT 1 FROM public.income_expenses i
    WHERE i.id = fixed_assets.source_entry_id
      AND i.user_id = (select auth.uid())
      AND i.engagement_id = fixed_assets.engagement_id
  ))
);
