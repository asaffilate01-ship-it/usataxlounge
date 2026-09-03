-- TaxCenda client-workflow parity: annual organizers, invoices, tax payments,
-- portable sharing, contextual collaboration, activity history and provider hooks.
-- Provider credentials and raw bank credentials must never be stored here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.tax_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.firm_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'preparer', 'reviewer', 'billing', 'support')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firm_id, user_id)
);

CREATE TABLE public.client_firm_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id uuid NOT NULL REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'tax_preparation' CHECK (access_level IN ('documents_only', 'tax_preparation', 'bookkeeping', 'full')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, firm_id)
);

CREATE TABLE public.household_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  relationship text NOT NULL DEFAULT 'spouse' CHECK (relationship IN ('spouse', 'partner', 'dependent', 'assistant', 'advisor', 'other')),
  access_level text NOT NULL DEFAULT 'collaborate' CHECK (access_level IN ('view', 'upload', 'collaborate')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, invited_email)
);

CREATE TABLE public.organizer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  item_type text NOT NULL DEFAULT 'document' CHECK (item_type IN ('document', 'question', 'review', 'signature', 'payment')),
  required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'submitted', 'completed', 'waived')),
  due_date date,
  remind_at timestamptz,
  last_reminded_at timestamptz,
  reminder_count integer NOT NULL DEFAULT 0 CHECK (reminder_count >= 0),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  client_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES public.tax_firms(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency ~ '^[a-z]{3}$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'void', 'overdue', 'refunded')),
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz,
  invoice_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  payment_method text CHECK (payment_method IS NULL OR payment_method IN ('card', 'us_bank_account', 'external')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firm_id, invoice_number)
);

CREATE TABLE public.tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authority_type text NOT NULL CHECK (authority_type IN ('federal', 'state', 'local')),
  authority_name text NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('balance_due', 'estimated', 'extension', 'amended', 'penalty', 'other')),
  tax_period text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'scheduled', 'processing', 'paid', 'cancelled', 'failed', 'overdue')),
  payment_method text CHECK (payment_method IS NULL OR payment_method IN ('irs_direct_pay', 'eftps', 'state_portal', 'ach', 'check', 'external')),
  voucher_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  provider_reference text,
  confirmation_number text,
  tracking_number text,
  paid_at timestamptz,
  client_marked_paid_at timestamptz,
  professional_cleared_at timestamptz,
  professional_cleared_by uuid REFERENCES auth.users(id),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.institution_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  form_type text NOT NULL,
  provider_connection_id uuid,
  status text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'authorizing', 'requested', 'retrieved', 'failed', 'expired')),
  expected_by date,
  retrieved_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.provider_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.tax_entities(id) ON DELETE CASCADE,
  provider_type text NOT NULL CHECK (provider_type IN ('document_retrieval', 'bank_feed', 'invoice_payment', 'tax_payment', 'efile', 'tax_software', 'push')),
  provider_slug text NOT NULL,
  status text NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured', 'pending', 'active', 'reauthorization_required', 'disabled', 'error')),
  external_reference text,
  scopes text[] NOT NULL DEFAULT '{}',
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_user_id IS NOT NULL OR firm_id IS NOT NULL)
);

ALTER TABLE public.institution_document_requests
  ADD CONSTRAINT institution_document_requests_provider_connection_fkey
  FOREIGN KEY (provider_connection_id) REFERENCES public.provider_connections(id) ON DELETE SET NULL;

CREATE TABLE public.document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number integer CHECK (page_number IS NULL OR page_number > 0),
  annotation_type text NOT NULL DEFAULT 'note' CHECK (annotation_type IN ('note', 'highlight', 'question', 'resolved')),
  content text NOT NULL,
  position jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engagement_id uuid REFERENCES public.tax_engagements(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  resource_type text,
  resource_id uuid,
  action_url text,
  undo_until timestamptz,
  undone_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key uuid NOT NULL,
  device_label text NOT NULL,
  platform text,
  browser text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_key)
);

CREATE TABLE public.provider_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS context_type text,
  ADD COLUMN IF NOT EXISTS context_id uuid,
  ADD COLUMN IF NOT EXISTS thread_subject text;

CREATE OR REPLACE FUNCTION public.has_household_entity_access(
  p_entity_id uuid, p_required_level text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_access ha
    WHERE ha.entity_id = p_entity_id
      AND ha.delegate_user_id = auth.uid()
      AND ha.status = 'active'
      AND ha.revoked_at IS NULL
      AND CASE p_required_level
        WHEN 'collaborate' THEN ha.access_level = 'collaborate'
        WHEN 'upload' THEN ha.access_level IN ('upload', 'collaborate')
        ELSE ha.access_level IN ('view', 'upload', 'collaborate')
      END
  );
$$;

CREATE INDEX organizer_items_user_status_idx ON public.organizer_items(user_id, status, due_date);
CREATE INDEX invoices_user_status_idx ON public.invoices(user_id, status, due_date);
CREATE INDEX tax_payments_user_due_idx ON public.tax_payments(user_id, status, due_date);
CREATE INDEX activity_events_user_created_idx ON public.activity_events(user_id, created_at DESC);
CREATE INDEX annotations_document_idx ON public.document_annotations(document_id, created_at);
CREATE INDEX provider_connections_owner_idx ON public.provider_connections(owner_user_id, provider_type, status);
CREATE INDEX provider_webhook_events_created_idx ON public.provider_webhook_events(provider, created_at DESC);

ALTER TABLE public.tax_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_firm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage firms" ON public.tax_firms FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));
CREATE POLICY "members read firms" ON public.tax_firms FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.firm_memberships fm WHERE fm.firm_id = id AND fm.user_id = auth.uid() AND fm.status = 'active'));
CREATE POLICY "connected clients read firms" ON public.tax_firms FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.client_firm_connections cfc
  WHERE cfc.firm_id = id AND cfc.owner_user_id = auth.uid() AND cfc.status = 'active'
));

CREATE POLICY "staff manage memberships" ON public.firm_memberships FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));
CREATE POLICY "members read own membership" ON public.firm_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "owners read firm connections" ON public.client_firm_connections FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());
CREATE POLICY "staff manage firm connections" ON public.client_firm_connections FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "owners manage household access" ON public.household_access FOR ALL TO authenticated
USING (owner_user_id = auth.uid()) WITH CHECK (
  owner_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.tax_engagements e
    WHERE e.entity_id = household_access.entity_id AND e.user_id = auth.uid()
  )
);
CREATE POLICY "invitees read household invitations" ON public.household_access FOR SELECT TO authenticated
USING (delegate_user_id = auth.uid() OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "clients read organizer" ON public.organizer_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "household delegates read organizer" ON public.organizer_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tax_engagements e
  WHERE e.id = engagement_id AND public.has_household_entity_access(e.entity_id, 'view')
));
CREATE POLICY "staff manage organizer" ON public.organizer_items FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "clients read invoices" ON public.invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "household delegates read invoices" ON public.invoices FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tax_engagements e
  WHERE e.id = engagement_id AND public.has_household_entity_access(e.entity_id, 'view')
));
CREATE POLICY "staff manage invoices" ON public.invoices FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "clients read tax payments" ON public.tax_payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "household delegates read tax payments" ON public.tax_payments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tax_engagements e
  WHERE e.id = engagement_id AND public.has_household_entity_access(e.entity_id, 'view')
));
CREATE POLICY "staff manage tax payments" ON public.tax_payments FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "clients read retrieval requests" ON public.institution_document_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "household delegates read retrieval requests" ON public.institution_document_requests FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tax_engagements e
  WHERE e.id = engagement_id AND public.has_household_entity_access(e.entity_id, 'view')
));
CREATE POLICY "staff manage retrieval requests" ON public.institution_document_requests FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "owners read provider connections" ON public.provider_connections FOR SELECT TO authenticated
USING (owner_user_id = auth.uid() OR public.is_tax_staff(auth.uid()));
CREATE POLICY "staff manage provider connections" ON public.provider_connections FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "document participants manage annotations" ON public.document_annotations FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR public.is_tax_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (d.user_id = auth.uid() OR (d.entity_id IS NOT NULL AND public.has_household_entity_access(d.entity_id, 'view')))
  )
) WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND (
      d.user_id = auth.uid() OR public.is_tax_staff(auth.uid())
      OR (d.entity_id IS NOT NULL AND public.has_household_entity_access(d.entity_id, 'collaborate'))
    )
  )
);

CREATE POLICY "clients read activity" ON public.activity_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "household delegates read activity" ON public.activity_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tax_engagements e
  WHERE e.id = engagement_id AND public.has_household_entity_access(e.entity_id, 'view')
));
CREATE POLICY "staff manage activity" ON public.activity_events FOR ALL TO authenticated
USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "users read device sessions" ON public.device_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "staff read device sessions" ON public.device_sessions FOR SELECT TO authenticated
USING (public.is_tax_staff(auth.uid()));

CREATE POLICY "household delegates read entities" ON public.tax_entities FOR SELECT TO authenticated
USING (public.has_household_entity_access(id, 'view'));
CREATE POLICY "household delegates read engagements" ON public.tax_engagements FOR SELECT TO authenticated
USING (public.has_household_entity_access(entity_id, 'view'));
CREATE POLICY "household delegates read documents" ON public.documents FOR SELECT TO authenticated
USING (entity_id IS NOT NULL AND public.has_household_entity_access(entity_id, 'view'));
CREATE POLICY "household delegates read stored documents" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.household_access ha
    WHERE ha.owner_user_id::text = (storage.foldername(name))[1]
      AND ha.delegate_user_id = auth.uid()
      AND ha.status = 'active'
      AND ha.revoked_at IS NULL
  )
);

CREATE OR REPLACE FUNCTION public.seed_annual_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organizer_items (engagement_id, user_id, title, description, category, item_type, required, due_date, remind_at)
  VALUES
    (NEW.id, NEW.user_id, 'Government-issued photo ID', 'Upload a current passport or driver licence for identity verification.', 'identity', 'document', true, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, 'Prior-year tax return', 'Upload the complete federal and state return from the prior year.', 'prior_year', 'document', true, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, 'W-2 wage statements', 'Upload every W-2 received for the tax year.', 'income', 'document', false, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, '1099 and investment statements', 'Upload applicable 1099-NEC, 1099-MISC, 1099-INT, 1099-DIV and brokerage statements.', 'income', 'document', false, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, '1098 and deduction records', 'Upload mortgage, tuition, student-loan, charitable and other deduction evidence.', 'deductions', 'document', false, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, 'Confirm household and dependants', 'Review spouse, dependant and filing-status information for this tax year.', 'household', 'question', true, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END),
    (NEW.id, NEW.user_id, 'Bank details for refund or payment', 'Confirm the account and routing details through an approved secure provider.', 'payment', 'review', false, NEW.due_date, CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::timestamptz - interval '7 days' END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_annual_organizer_after_engagement
AFTER INSERT ON public.tax_engagements
FOR EACH ROW EXECUTE FUNCTION public.seed_annual_organizer();

-- Existing engagements receive the same starter organizer without duplicating
-- any workspace that already has organizer items.
INSERT INTO public.organizer_items (
  engagement_id, user_id, title, description, category, item_type, required, due_date, remind_at
)
SELECT e.id, e.user_id, template.title, template.description, template.category,
       template.item_type, template.required, e.due_date,
       CASE WHEN e.due_date IS NULL THEN NULL ELSE (e.due_date::timestamptz - interval '7 days') END
FROM public.tax_engagements e
CROSS JOIN (VALUES
  ('Government-issued photo ID', 'Upload a current passport or driver licence for identity verification.', 'identity', 'document', true),
  ('Prior-year tax return', 'Upload the complete federal and state return from the prior year.', 'prior_year', 'document', true),
  ('W-2 wage statements', 'Upload every W-2 received for the tax year.', 'income', 'document', false),
  ('1099 and investment statements', 'Upload applicable 1099-NEC, 1099-MISC, 1099-INT, 1099-DIV and brokerage statements.', 'income', 'document', false),
  ('1098 and deduction records', 'Upload mortgage, tuition, student-loan, charitable and other deduction evidence.', 'deductions', 'document', false),
  ('Confirm household and dependants', 'Review spouse, dependant and filing-status information for this tax year.', 'household', 'question', true),
  ('Bank details for refund or payment', 'Confirm the account and routing details through an approved secure provider.', 'payment', 'review', false)
) AS template(title, description, category, item_type, required)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizer_items existing WHERE existing.engagement_id = e.id
);

CREATE OR REPLACE FUNCTION public.accept_household_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.household_access
  SET delegate_user_id = auth.uid(), status = 'active', accepted_at = now(), updated_at = now()
  WHERE id = p_invite_id
    AND status = 'pending'
    AND expires_at > now()
    AND lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''));
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation is invalid or expired'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_organizer_item(p_item_id uuid, p_document_id uuid DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_document_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.documents d WHERE d.id = p_document_id AND d.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Document is not available to this client';
  END IF;
  UPDATE public.organizer_items
  SET status = 'submitted', document_id = coalesce(p_document_id, document_id), client_note = p_note,
      completed_at = now(), updated_at = now()
  WHERE id = p_item_id AND (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.tax_engagements e
      WHERE e.id = organizer_items.engagement_id
        AND public.has_household_entity_access(e.entity_id, 'collaborate')
    )
  );
  IF NOT FOUND THEN RAISE EXCEPTION 'Organizer item not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_tax_payment_paid(p_payment_id uuid, p_confirmation text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tax_payments
  SET status = 'processing', payment_method = coalesce(payment_method, 'external'), confirmation_number = nullif(trim(p_confirmation), ''),
      client_marked_paid_at = now(), updated_at = now()
  WHERE id = p_payment_id AND user_id = auth.uid() AND status IN ('unpaid', 'overdue', 'scheduled', 'processing');
  IF NOT FOUND THEN RAISE EXCEPTION 'Tax payment is not available to mark paid'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_device_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.device_sessions SET revoked_at = now()
  WHERE id = p_session_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Device session not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_firm_connection(p_connection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_firm_connections
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE id = p_connection_id AND owner_user_id = auth.uid() AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active firm connection not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_device_session(
  p_device_key uuid, p_device_label text, p_platform text DEFAULT NULL, p_browser text DEFAULT NULL
)
RETURNS TABLE(session_id uuid, is_revoked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE current_id uuid; current_revoked_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT id, revoked_at INTO current_id, current_revoked_at
  FROM public.device_sessions
  WHERE user_id = auth.uid() AND device_key = p_device_key;

  IF current_id IS NOT NULL AND current_revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT current_id, true;
    RETURN;
  END IF;

  INSERT INTO public.device_sessions (user_id, device_key, device_label, platform, browser, last_seen_at)
  VALUES (auth.uid(), p_device_key, left(trim(p_device_label), 120), left(trim(p_platform), 120), left(trim(p_browser), 120), now())
  ON CONFLICT (user_id, device_key) DO UPDATE
    SET device_label = EXCLUDED.device_label,
        platform = EXCLUDED.platform,
        browser = EXCLUDED.browser,
        last_seen_at = now()
  RETURNING id INTO current_id;

  RETURN QUERY SELECT current_id, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_client_activity(
  p_user_id uuid, p_engagement_id uuid, p_event_type text, p_title text,
  p_detail text DEFAULT NULL, p_resource_type text DEFAULT NULL, p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE event_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF auth.uid() <> p_user_id
     AND NOT public.is_tax_staff(auth.uid())
     AND NOT EXISTS (
       SELECT 1 FROM public.tax_engagements e
       WHERE e.id = p_engagement_id
         AND e.user_id = p_user_id
         AND public.has_household_entity_access(e.entity_id, 'collaborate')
     )
  THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.activity_events (user_id, engagement_id, actor_user_id, event_type, title, detail, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_engagement_id, auth.uid(), p_event_type, p_title, p_detail, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO event_id;
  RETURN event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_annual_organizer() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_household_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_organizer_item(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_tax_payment_paid(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_device_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_firm_connection(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_device_session(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_client_activity(uuid, uuid, text, text, text, text, uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_household_entity_access(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_household_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_organizer_item(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_tax_payment_paid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_device_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_firm_connection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_device_session(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_client_activity(uuid, uuid, text, text, text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_household_entity_access(uuid, text) TO authenticated;
GRANT ALL ON public.provider_webhook_events TO service_role;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'tax_firms','client_firm_connections','household_access','organizer_items','invoices','tax_payments',
    'institution_document_requests','provider_connections','document_annotations'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', table_name, table_name);
  END LOOP;
END $$;
