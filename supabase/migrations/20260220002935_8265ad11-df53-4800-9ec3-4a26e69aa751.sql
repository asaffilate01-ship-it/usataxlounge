
-- Fix overly permissive SELECT on contract_templates — restrict to authenticated users
DROP POLICY "Clients can view templates assigned to them" ON public.contract_templates;

CREATE POLICY "Authenticated users can view templates"
  ON public.contract_templates FOR SELECT
  TO authenticated
  USING (true);
