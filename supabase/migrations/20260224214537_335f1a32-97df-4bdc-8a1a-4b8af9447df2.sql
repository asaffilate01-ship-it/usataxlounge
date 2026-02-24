
-- Add missing INSERT policy for filings (users can create own filings)
CREATE POLICY "Users can insert own filings"
ON public.filings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add missing UPDATE/DELETE policies for documents
CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for messages (sender or receiver can delete)
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Add missing UPDATE policy for signatures (only before signing)
CREATE POLICY "Users can update own unsigned signatures"
ON public.signatures FOR UPDATE
USING (auth.uid() = user_id AND signed_at IS NULL);

-- Add missing DELETE policy for clients
CREATE POLICY "Clients can delete own record"
ON public.clients FOR DELETE
USING (auth.uid() = user_id);

-- Add admin role management policies for user_roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
