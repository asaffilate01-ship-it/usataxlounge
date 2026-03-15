-- Tighten user_presence: only admins and own user can see presence
DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.user_presence;
CREATE POLICY "Users can view own or admin can view all presence"
  ON public.user_presence FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Tighten contract_templates: only admins can view
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.contract_templates;
CREATE POLICY "Only admins can view templates"
  ON public.contract_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add onboarding data to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS dependents integer DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS income_sources text[] DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deductions text[] DEFAULT '{}';

-- Enable pgcrypto for SSN encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Replace ssn_last4 with encrypted ssn storage
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ssn_encrypted bytea;
