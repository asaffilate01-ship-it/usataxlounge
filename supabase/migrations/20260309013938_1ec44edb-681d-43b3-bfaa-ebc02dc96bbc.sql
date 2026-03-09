-- First drop existing policies if any
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);