-- TaxCenda foundation (part 2): bank feeds, chart of accounts, journals, workflow control.

CREATE TABLE public.bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_item_reference text NOT NULL,
  secret_reference text NOT NULL,
  institution_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'reauth_required', 'revoked', 'error')),
  consent_expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_item_reference)
);

COMMENT ON COLUMN public.bank_connections.secret_reference IS
  'Opaque reference to a token held in the deployment secret store. Never store a raw provider access token here.';

GRANT SELECT ON public.bank_connections TO authenticated;
GRANT ALL ON public.bank_connections TO service_role;

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own bank connections" ON public.bank_connections
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff view bank connections" ON public.bank_connections
FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));

CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_account_id text NOT NULL,
  name text NOT NULL,
  official_name text,
  account_type text,
  account_subtype text,
  mask text,
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, provider_account_id)
);

GRANT SELECT ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own bank accounts" ON public.bank_accounts
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff view bank accounts" ON public.bank_accounts
FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));

CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_transaction_id text NOT NULL,
  transaction_date date NOT NULL,
  authorized_date date,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  direction text NOT NULL CHECK (direction IN ('credit', 'debit')),
  merchant_name text,
  description text NOT NULL,
  pending boolean NOT NULL DEFAULT false,
  suggested_category text,
  matched_income_expense_id uuid REFERENCES public.income_expenses(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'matched', 'needs_client', 'approved', 'excluded')),
  normalized_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_transaction_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;
GRANT ALL ON public.bank_transactions TO service_role;

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own bank transactions" ON public.bank_transactions
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff manage bank transactions" ON public.bank_transactions
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.chart_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'cost_of_goods', 'expense')),
  normal_balance text NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  tax_line_code text,
  active boolean NOT NULL DEFAULT true,
  system_account boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_accounts TO authenticated;
GRANT ALL ON public.chart_accounts TO service_role;

ALTER TABLE public.chart_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own chart" ON public.chart_accounts
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_entities e WHERE e.id = entity_id AND e.owner_user_id = auth.uid())
);

CREATE POLICY "Tax staff manage chart" ON public.chart_accounts
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.create_default_chart_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chart_accounts (entity_id, code, name, account_type, normal_balance, system_account)
  VALUES
    (NEW.id, '1000', 'Cash and bank clearing', 'asset', 'debit', true),
    (NEW.id, '1100', 'Accounts receivable', 'asset', 'debit', true),
    (NEW.id, '1500', 'Fixed assets', 'asset', 'debit', true),
    (NEW.id, '1590', 'Accumulated depreciation', 'asset', 'credit', true),
    (NEW.id, '2000', 'Accounts payable', 'liability', 'credit', true),
    (NEW.id, '2200', 'Loans payable', 'liability', 'credit', true),
    (NEW.id, '3000', 'Owner equity', 'equity', 'credit', true),
    (NEW.id, '3100', 'Owner draws', 'equity', 'debit', true),
    (NEW.id, '4000', 'Gross receipts and sales', 'income', 'credit', true),
    (NEW.id, '4900', 'Other income', 'income', 'credit', true),
    (NEW.id, '5000', 'Cost of goods sold', 'cost_of_goods', 'debit', true),
    (NEW.id, '6100', 'Operating expenses', 'expense', 'debit', true),
    (NEW.id, '6500', 'Depreciation expense', 'expense', 'debit', true);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_default_chart_accounts() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS create_default_chart_after_entity ON public.tax_entities;
CREATE TRIGGER create_default_chart_after_entity
AFTER INSERT ON public.tax_entities
FOR EACH ROW EXECUTE FUNCTION public.create_default_chart_accounts();

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  description text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_at timestamptz,
  reversal_of uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own journal entries" ON public.journal_entries
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_engagements e WHERE e.id = engagement_id AND e.user_id = auth.uid())
);

CREATE POLICY "Tax staff manage journal entries" ON public.journal_entries
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.chart_accounts(id) ON DELETE RESTRICT,
  description text,
  debit numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;

ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own journal lines" ON public.journal_lines
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.journal_entries j
    JOIN public.tax_engagements e ON e.id = j.engagement_id
    WHERE j.id = journal_entry_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Tax staff manage journal lines" ON public.journal_lines
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workflow_events TO authenticated;
GRANT ALL ON public.workflow_events TO service_role;

ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own workflow events" ON public.workflow_events
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_engagements e WHERE e.id = engagement_id AND e.user_id = auth.uid())
);

CREATE POLICY "Tax staff manage workflow events" ON public.workflow_events
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'rate_limited')),
  input_bytes bigint NOT NULL DEFAULT 0 CHECK (input_bytes >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own AI usage" ON public.ai_usage_events
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff view AI usage" ON public.ai_usage_events
FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.advance_tax_engagement(
  p_engagement_id uuid,
  p_target_status text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current text;
  v_user_id uuid;
  v_allowed boolean := false;
  v_blockers integer;
  v_progress smallint;
  v_step text;
BEGIN
  IF NOT public.is_tax_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only authorised tax staff can change engagement status';
  END IF;

  SELECT workflow_status, user_id INTO v_current, v_user_id
  FROM public.tax_engagements
  WHERE id = p_engagement_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  v_allowed := (v_current, p_target_status) IN (
    ('collecting', 'processing'),
    ('processing', 'client_questions'),
    ('processing', 'bookkeeping_review'),
    ('client_questions', 'bookkeeping_review'),
    ('bookkeeping_review', 'reconciled'),
    ('reconciled', 'tax_preparation'),
    ('tax_preparation', 'accountant_review'),
    ('accountant_review', 'client_review'),
    ('client_review', 'signature_complete'),
    ('signature_complete', 'approved_to_file'),
    ('approved_to_file', 'transmitted'),
    ('transmitted', 'accepted'),
    ('transmitted', 'rejected'),
    ('rejected', 'approved_to_file'),
    ('accepted', 'completed'),
    ('completed', 'amended')
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid workflow transition from % to %', v_current, p_target_status;
  END IF;

  IF p_target_status IN ('reconciled', 'tax_preparation', 'accountant_review', 'client_review', 'signature_complete', 'approved_to_file', 'transmitted') THEN
    SELECT
      (SELECT count(*) FROM public.clarification_questions q
       WHERE q.engagement_id = p_engagement_id AND q.status IN ('open', 'answered') AND q.priority IN ('high', 'blocking'))
      +
      (SELECT count(*) FROM public.duplicate_candidates d
       WHERE d.engagement_id = p_engagement_id AND d.status = 'open')
    INTO v_blockers;

    IF v_blockers > 0 THEN
      RAISE EXCEPTION 'Resolve % blocking question(s) or duplicate candidate(s) first', v_blockers;
    END IF;
  END IF;

  IF p_target_status IN ('signature_complete', 'approved_to_file') AND NOT EXISTS (
    SELECT 1
    FROM public.filings f
    JOIN public.signatures s ON s.filing_id = f.id
    WHERE f.engagement_id = p_engagement_id
      AND f.file_url IS NOT NULL
      AND s.signed_at IS NOT NULL
      AND s.filing_snapshot_hash IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'A signed authorization tied to the final filing package is required';
  END IF;

  IF p_target_status = 'transmitted' AND NOT EXISTS (
    SELECT 1 FROM public.filings f
    WHERE f.engagement_id = p_engagement_id
      AND f.status IN ('submitted', 'accepted')
      AND f.submitted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Record an actual provider transmission before marking the engagement transmitted';
  END IF;

  SELECT progress, step INTO v_progress, v_step
  FROM (VALUES
    ('collecting', 10::smallint, 'Upload and confirm source records'),
    ('processing', 20::smallint, 'Documents are being processed'),
    ('client_questions', 30::smallint, 'Client clarification required'),
    ('bookkeeping_review', 45::smallint, 'Bookkeeping review'),
    ('reconciled', 58::smallint, 'Books reconciled'),
    ('tax_preparation', 70::smallint, 'Tax workpapers and forms'),
    ('accountant_review', 80::smallint, 'Accountant review'),
    ('client_review', 88::smallint, 'Client review'),
    ('signature_complete', 92::smallint, 'Signature complete'),
    ('approved_to_file', 95::smallint, 'Approved for transmission'),
    ('transmitted', 97::smallint, 'Awaiting acknowledgement'),
    ('accepted', 99::smallint, 'Accepted'),
    ('rejected', 90::smallint, 'Submission correction required'),
    ('completed', 100::smallint, 'Completed'),
    ('amended', 60::smallint, 'Amendment in progress')
  ) AS states(status, progress, step)
  WHERE status = p_target_status;

  UPDATE public.tax_engagements
  SET workflow_status = p_target_status,
      progress = v_progress,
      current_step = v_step,
      locked_at = CASE WHEN p_target_status IN ('signature_complete', 'approved_to_file', 'transmitted', 'accepted', 'completed') THEN now() ELSE locked_at END,
      updated_at = now()
  WHERE id = p_engagement_id;

  INSERT INTO public.workflow_events (engagement_id, actor_user_id, from_status, to_status, reason)
  VALUES (p_engagement_id, auth.uid(), v_current, p_target_status, NULLIF(trim(COALESCE(p_reason, '')), ''));
END;
$$;

REVOKE ALL ON FUNCTION public.advance_tax_engagement(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_tax_engagement(uuid, text, text) TO authenticated;