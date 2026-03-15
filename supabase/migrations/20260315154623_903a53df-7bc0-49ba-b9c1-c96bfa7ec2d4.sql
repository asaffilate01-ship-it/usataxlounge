-- Allow users to delete their own profile (GDPR Right to Erasure)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own filings (GDPR Right to Erasure)
CREATE POLICY "Users can delete own filings"
ON public.filings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own signatures (GDPR Right to Erasure)
CREATE POLICY "Users can delete own signatures"
ON public.signatures
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own notifications (GDPR Right to Erasure)
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);