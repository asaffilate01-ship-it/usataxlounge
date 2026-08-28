-- TaxCenda foundation (part 3): evidence lock-down, staff access, indexes, timestamps.

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
CREATE INDEX IF NOT EXISTS signatures_pending_filing_idx ON public.signatures(filing_id) WHERE signed_at IS NULL;
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