-- TaxCenda accounting, evidence, review, and filing-control foundation (part 1).

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_entities TO authenticated;
GRANT ALL ON public.tax_entities TO service_role;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_engagements TO authenticated;
GRANT ALL ON public.tax_engagements TO service_role;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clarification_questions TO authenticated;
GRANT ALL ON public.clarification_questions TO service_role;

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

REVOKE ALL ON FUNCTION public.answer_clarification_question(uuid, text, uuid) FROM PUBLIC, anon;
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_assets TO authenticated;
GRANT ALL ON public.fixed_assets TO service_role;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.duplicate_candidates TO authenticated;
GRANT ALL ON public.duplicate_candidates TO service_role;

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

REVOKE ALL ON FUNCTION public.resolve_duplicate_candidate(uuid, text, text) FROM PUBLIC, anon;
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

REVOKE ALL ON FUNCTION public.detect_document_duplicates() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS detect_document_duplicates_after_insert ON public.documents;
CREATE TRIGGER detect_document_duplicates_after_insert
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.detect_document_duplicates();