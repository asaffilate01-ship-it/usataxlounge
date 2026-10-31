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
BEFORE UPDATE OF workflow_status ON public.tax_engagements
FOR EACH ROW EXECUTE FUNCTION public.taxcenda_guard_engagement_provider_status();

COMMENT ON FUNCTION public.taxcenda_guard_filing_status() IS
  'Fail-closed filing status boundary: authorised user sessions cannot forge transmission/IRS response fields; provider adapter and audited service-role ingestion are still required.';
COMMENT ON FUNCTION public.taxcenda_guard_engagement_provider_status() IS
  'Fail-closed engagement status boundary: only trusted provider-ingestion channel can record transmission or acknowledgement status.';
