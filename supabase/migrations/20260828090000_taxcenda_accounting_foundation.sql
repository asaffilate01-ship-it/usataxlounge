-- TaxCenda accounting, evidence, review, and filing-control foundation.
-- This is a forward-only migration. It preserves all legacy portal records.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'preparer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reviewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance';

CREATE OR REPLACE FUNCTION public.is_tax_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'preparer', 'reviewer', 'compliance')
  )
$$;

CREATE TABLE public.tax_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  legal_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN (
    'individual', 'sole_proprietor', 'single_member_llc', 'partnership',
    's_corporation', 'c_corporation', 'trust', 'exempt_organization', 'other'
  )),
  tin_last4 text CHECK (tin_last4 IS NULL OR tin_last4 ~ '^[0-9]{4}$'),
  accounting_method text NOT NULL DEFAULT 'cash' CHECK (accounting_method IN ('cash', 'accrual', 'hybrid')),
  base_currency text NOT NULL DEFAULT 'USD' CHECK (base_currency ~ '^[A-Z]{3}$'),
  tax_home_state text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, legal_name, entity_type)
);

ALTER TABLE public.tax_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own tax entities" ON public.tax_entities
FOR SELECT TO authenticated USING (owner_user_id = auth.uid());

CREATE POLICY "Clients create own tax entities" ON public.tax_entities
FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Clients update own tax entities" ON public.tax_entities
FOR UPDATE TO authenticated USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Tax staff manage tax entities" ON public.tax_entities
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.tax_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year integer NOT NULL CHECK (tax_year BETWEEN 2000 AND 2100),
  scope text[] NOT NULL DEFAULT ARRAY['federal_income_tax']::text[],
  workflow_status text NOT NULL DEFAULT 'collecting' CHECK (workflow_status IN (
    'collecting', 'processing', 'client_questions', 'bookkeeping_review',
    'reconciled', 'tax_preparation', 'accountant_review', 'client_review',
    'signature_complete', 'approved_to_file', 'transmitted', 'accepted',
    'rejected', 'completed', 'amended'
  )),
  progress smallint NOT NULL DEFAULT 5 CHECK (progress BETWEEN 0 AND 100),
  current_step text NOT NULL DEFAULT 'Upload your records',
  assigned_preparer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_reviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  materiality_threshold numeric(14,2) NOT NULL DEFAULT 1 CHECK (materiality_threshold >= 0),
  due_date date,
  locked_at timestamptz,
  final_package_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, tax_year)
);

ALTER TABLE public.tax_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own engagements" ON public.tax_engagements
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Clients create own engagements" ON public.tax_engagements
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tax_entities e
    WHERE e.id = entity_id AND e.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Tax staff manage engagements" ON public.tax_engagements
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.tax_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  ADD COLUMN IF NOT EXISTS content_sha256 text,
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'not_started'
    CHECK (extraction_status IN ('not_started', 'processing', 'completed', 'needs_review', 'failed')),
  ADD COLUMN IF NOT EXISTS extraction_confidence numeric(5,4)
    CHECK (extraction_confidence IS NULL OR extraction_confidence BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS duplicate_status text NOT NULL DEFAULT 'unchecked'
    CHECK (duplicate_status IN ('unchecked', 'clear', 'candidate', 'confirmed_duplicate', 'keep_both', 'superseded')),
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.income_expenses
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.tax_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_date date,
  ADD COLUMN IF NOT EXISTS entry_kind text NOT NULL DEFAULT 'other'
    CHECK (entry_kind IN (
      'gross_income', 'sales', 'salary_wages', 'interest_income', 'rental_income',
      'sundry_income', 'operating_expense', 'cost_of_goods', 'capital_asset',
      'owner_contribution', 'owner_draw', 'loan_proceeds', 'loan_repayment', 'other'
    )),
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  ADD COLUMN IF NOT EXISTS business_use_percentage numeric(5,2) NOT NULL DEFAULT 100
    CHECK (business_use_percentage BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (review_status IN ('unreviewed', 'needs_client', 'confirmed', 'approved', 'excluded')),
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_source text NOT NULL DEFAULT 'manual'
    CHECK (created_source IN ('manual', 'document_ai', 'bank_feed', 'import', 'journal', 'legacy'));

ALTER TABLE public.filings
  ADD COLUMN IF NOT EXISTS engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE SET NULL;

ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS filing_snapshot_hash text;

UPDATE public.income_expenses
SET transaction_date = COALESCE(transaction_date, created_at::date),
    entry_kind = CASE
      WHEN entry_kind = 'other' AND type = 'income' THEN 'gross_income'
      WHEN entry_kind = 'other' AND type = 'expense' THEN 'operating_expense'
      ELSE entry_kind
    END,
    created_source = CASE WHEN created_source = 'manual' THEN 'legacy' ELSE created_source END
WHERE transaction_date IS NULL OR entry_kind = 'other' OR created_source = 'manual';

ALTER TABLE public.income_expenses
  DROP CONSTRAINT IF EXISTS income_expenses_positive_amount,
  ADD CONSTRAINT income_expenses_positive_amount CHECK (amount > 0);

CREATE TABLE public.clarification_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  source_entry_id uuid REFERENCES public.income_expenses(id) ON DELETE SET NULL,
  topic text NOT NULL,
  question text NOT NULL,
  context text,
  impact text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'blocking')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved', 'dismissed')),
  answer text,
  evidence_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  asked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clarification_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own clarification questions" ON public.clarification_questions
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff manage clarification questions" ON public.clarification_questions
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.answer_clarification_question(
  p_question_id uuid,
  p_answer text,
  p_evidence_document_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(trim(COALESCE(p_answer, ''))) < 2 THEN
    RAISE EXCEPTION 'An answer is required';
  END IF;

  UPDATE public.clarification_questions
  SET answer = trim(p_answer),
      evidence_document_id = p_evidence_document_id,
      status = 'answered',
      answered_at = now(),
      updated_at = now()
  WHERE id = p_question_id
    AND user_id = auth.uid()
    AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or cannot be answered';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.answer_clarification_question(uuid, text, uuid) TO authenticated;

CREATE TABLE public.fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  source_entry_id uuid REFERENCES public.income_expenses(id) ON DELETE SET NULL,
  description text NOT NULL,
  asset_class text NOT NULL DEFAULT 'other',
  placed_in_service_date date NOT NULL,
  cost numeric(14,2) NOT NULL CHECK (cost > 0),
  business_use_percentage numeric(5,2) NOT NULL DEFAULT 100 CHECK (business_use_percentage BETWEEN 0 AND 100),
  book_method text NOT NULL DEFAULT 'straight_line',
  book_life_years numeric(6,2) CHECK (book_life_years IS NULL OR book_life_years > 0),
  tax_method text,
  recovery_period_years numeric(6,2) CHECK (recovery_period_years IS NULL OR recovery_period_years > 0),
  convention text,
  section_179_elected numeric(14,2) NOT NULL DEFAULT 0 CHECK (section_179_elected >= 0),
  bonus_depreciation_elected boolean NOT NULL DEFAULT false,
  prior_depreciation numeric(14,2) NOT NULL DEFAULT 0 CHECK (prior_depreciation >= 0),
  current_depreciation numeric(14,2) NOT NULL DEFAULT 0 CHECK (current_depreciation >= 0),
  status text NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review', 'approved', 'disposed', 'excluded')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own fixed assets" ON public.fixed_assets
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Clients create own fixed assets" ON public.fixed_assets
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.id = engagement_id AND e.user_id = auth.uid() AND e.entity_id = entity_id
  )
);

CREATE POLICY "Tax staff manage fixed assets" ON public.fixed_assets
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE TABLE public.duplicate_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  candidate_document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  match_type text NOT NULL CHECK (match_type IN ('exact_hash', 'same_reference', 'amount_date_vendor', 'visual', 'manual')),
  score numeric(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed_duplicate', 'keep_both', 'superseded', 'dismissed')),
  resolution_reason text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (primary_document_id <> candidate_document_id),
  UNIQUE (primary_document_id, candidate_document_id)
);

ALTER TABLE public.duplicate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own duplicate candidates" ON public.duplicate_candidates
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Tax staff manage duplicate candidates" ON public.duplicate_candidates
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.resolve_duplicate_candidate(
  p_candidate_id uuid,
  p_resolution text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate public.duplicate_candidates%ROWTYPE;
BEGIN
  IF p_resolution NOT IN ('confirmed_duplicate', 'keep_both', 'superseded', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid duplicate resolution';
  END IF;

  SELECT * INTO v_candidate
  FROM public.duplicate_candidates
  WHERE id = p_candidate_id AND user_id = auth.uid() AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Duplicate candidate not found or already resolved';
  END IF;

  UPDATE public.duplicate_candidates
  SET status = p_resolution,
      resolution_reason = NULLIF(trim(COALESCE(p_reason, '')), ''),
      resolved_by = auth.uid(),
      resolved_at = now()
  WHERE id = p_candidate_id;

  UPDATE public.documents
  SET duplicate_status = CASE
    WHEN p_resolution = 'confirmed_duplicate' THEN 'confirmed_duplicate'
    WHEN p_resolution = 'superseded' THEN 'superseded'
    WHEN p_resolution = 'keep_both' THEN 'keep_both'
    ELSE 'clear'
  END
  WHERE id = v_candidate.candidate_document_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_duplicate_candidate(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.detect_document_duplicates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing record;
  v_match_type text;
  v_score numeric(5,4);
  v_reasons jsonb;
BEGIN
  FOR v_existing IN
    SELECT d.id, d.content_sha256, d.amount, d.document_date, d.vendor_name
    FROM public.documents d
    WHERE d.user_id = NEW.user_id
      AND d.id <> NEW.id
      AND d.duplicate_status NOT IN ('confirmed_duplicate', 'superseded')
      AND (
        (NEW.content_sha256 IS NOT NULL AND d.content_sha256 = NEW.content_sha256)
        OR (
          NEW.amount IS NOT NULL AND d.amount = NEW.amount
          AND NEW.document_date IS NOT NULL AND d.document_date = NEW.document_date
          AND NEW.vendor_name IS NOT NULL AND d.vendor_name IS NOT NULL
          AND lower(trim(d.vendor_name)) = lower(trim(NEW.vendor_name))
        )
      )
  LOOP
    IF NEW.content_sha256 IS NOT NULL AND v_existing.content_sha256 = NEW.content_sha256 THEN
      v_match_type := 'exact_hash';
      v_score := 1;
      v_reasons := '["Same file fingerprint"]'::jsonb;
    ELSE
      v_match_type := 'amount_date_vendor';
      v_score := 0.9;
      v_reasons := '["Same vendor, date and amount"]'::jsonb;
    END IF;

    INSERT INTO public.duplicate_candidates (
      engagement_id, user_id, primary_document_id, candidate_document_id,
      match_type, score, reasons
    ) VALUES (
      NEW.engagement_id,
      NEW.user_id,
      LEAST(v_existing.id, NEW.id),
      GREATEST(v_existing.id, NEW.id),
      v_match_type,
      v_score,
      v_reasons
    ) ON CONFLICT (primary_document_id, candidate_document_id) DO NOTHING;

    UPDATE public.documents
    SET duplicate_status = 'candidate'
    WHERE id IN (v_existing.id, NEW.id) AND duplicate_status IN ('unchecked', 'clear');
  END LOOP;

  IF NOT FOUND THEN
    UPDATE public.documents SET duplicate_status = 'clear' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS detect_document_duplicates_after_insert ON public.documents;
CREATE TRIGGER detect_document_duplicates_after_insert
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.detect_document_duplicates();

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

GRANT EXECUTE ON FUNCTION public.advance_tax_engagement(uuid, text, text) TO authenticated;

-- Signature requests must reference the client's own filing. Clients cannot
-- create or alter request records directly; signing is handled by a verified
-- server function that records server time and request metadata.
DROP POLICY IF EXISTS "Users can manage own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Users can insert own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Users can update own unsigned signatures" ON public.signatures;
DROP POLICY IF EXISTS "Users can view own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Users can delete own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Admins can view all signatures" ON public.signatures;

CREATE POLICY "Clients view own signature requests" ON public.signatures
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.filings f
    WHERE f.id = filing_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Tax staff manage signature requests" ON public.signatures
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (
  public.is_tax_staff(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.filings f
    WHERE f.id = filing_id AND f.user_id = signatures.user_id
  )
);

-- Message attachments were initially created as a public bucket. Keep it
-- private so access always goes through the participant policies.
UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- Lock accounting evidence after initial intake. Clients can correct entries
-- during collection, but cannot alter signed filing evidence or final filings.
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Clients delete recent document intake" ON public.documents
FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  AND created_at > now() - interval '15 minutes'
  AND status IN ('received', 'client_confirmed')
);

DROP POLICY IF EXISTS "Users can manage own income_expenses" ON public.income_expenses;
CREATE POLICY "Clients view own income expenses" ON public.income_expenses
FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Clients create income expenses during intake" ON public.income_expenses
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND (
    engagement_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.tax_engagements e
      WHERE e.id = income_expenses.engagement_id AND e.user_id = auth.uid()
        AND e.workflow_status IN ('collecting', 'client_questions')
    )
  )
);
CREATE POLICY "Clients correct income expenses during intake" ON public.income_expenses
FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
  AND (
    engagement_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.tax_engagements e
      WHERE e.id = income_expenses.engagement_id AND e.user_id = auth.uid()
        AND e.workflow_status IN ('collecting', 'client_questions')
    )
  )
) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Clients remove income expenses during intake" ON public.income_expenses
FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  AND (
    engagement_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.tax_engagements e
      WHERE e.id = income_expenses.engagement_id AND e.user_id = auth.uid()
        AND e.workflow_status IN ('collecting', 'client_questions')
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own filings" ON public.filings;
DROP POLICY IF EXISTS "Users can delete own filings" ON public.filings;

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Clients delete recent document uploads" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > now() - interval '15 minutes'
);

-- Staff access to the existing operational records.
CREATE POLICY "Tax staff manage documents" ON public.documents
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff manage income expenses" ON public.income_expenses
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff manage filings" ON public.filings
FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid()))
WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff upload client documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND public.is_tax_staff(auth.uid())
);

CREATE POLICY "Tax staff delete client documents" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND public.is_tax_staff(auth.uid())
);

CREATE INDEX IF NOT EXISTS tax_entities_owner_idx ON public.tax_entities(owner_user_id);
CREATE INDEX IF NOT EXISTS tax_engagements_user_year_idx ON public.tax_engagements(user_id, tax_year DESC);
CREATE INDEX IF NOT EXISTS documents_user_hash_idx ON public.documents(user_id, content_sha256) WHERE content_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS documents_engagement_status_idx ON public.documents(engagement_id, status, extraction_status);
CREATE INDEX IF NOT EXISTS income_expenses_engagement_date_idx ON public.income_expenses(engagement_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS questions_engagement_status_idx ON public.clarification_questions(engagement_id, status, priority);
CREATE INDEX IF NOT EXISTS fixed_assets_engagement_idx ON public.fixed_assets(engagement_id, status);
CREATE INDEX IF NOT EXISTS duplicate_candidates_engagement_idx ON public.duplicate_candidates(engagement_id, status);
CREATE INDEX IF NOT EXISTS bank_transactions_review_idx ON public.bank_transactions(engagement_id, review_status, transaction_date DESC);
CREATE INDEX IF NOT EXISTS journal_entries_engagement_idx ON public.journal_entries(engagement_id, status, entry_date);
CREATE INDEX IF NOT EXISTS ai_usage_events_user_created_idx ON public.ai_usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS signatures_pending_filing_idx
ON public.signatures(filing_id) WHERE signed_at IS NULL;
CREATE INDEX IF NOT EXISTS filings_engagement_idx ON public.filings(engagement_id, status);

CREATE TRIGGER update_tax_entities_updated_at BEFORE UPDATE ON public.tax_entities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_engagements_updated_at BEFORE UPDATE ON public.tax_engagements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clarification_questions_updated_at BEFORE UPDATE ON public.clarification_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixed_assets_updated_at BEFORE UPDATE ON public.fixed_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_connections_updated_at BEFORE UPDATE ON public.bank_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chart_accounts_updated_at BEFORE UPDATE ON public.chart_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
