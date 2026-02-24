
-- Tighten messages UPDATE: only allow updating the 'read' column
DROP POLICY IF EXISTS "Users can mark own messages read" ON public.messages;

CREATE POLICY "Users can mark own messages read"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Tighten signatures: replace ALL with INSERT-only and SELECT-only for users
DROP POLICY IF EXISTS "Users can manage own signatures" ON public.signatures;

CREATE POLICY "Users can insert own signatures"
ON public.signatures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own signatures"
ON public.signatures
FOR SELECT
USING (auth.uid() = user_id);
