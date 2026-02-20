
-- Contract templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  fields JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract templates"
  ON public.contract_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view templates assigned to them"
  ON public.contract_templates FOR SELECT
  USING (true);

-- Documents table (contracts, receipts, signed forms, etc.)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document',
  category TEXT,
  file_url TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- E-signatures table update: add consent fields
ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS typed_name TEXT,
  ADD COLUMN IF NOT EXISTS consent_text TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Triggers for updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add more fields to clients for better management
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS occupation TEXT;
