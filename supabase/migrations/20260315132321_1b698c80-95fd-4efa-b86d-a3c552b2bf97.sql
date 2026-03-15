
-- 1. Fix notification RLS: Drop the overly permissive ALL policy, replace with SELECT + UPDATE
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can select own notifications"
ON public.notifications FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Create audit_logs table for admin compliance tracking
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
