-- Create user_presence table for online/offline status
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view presence
CREATE POLICY "Authenticated users can view presence"
ON public.user_presence FOR SELECT
TO authenticated
USING (true);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON public.user_presence FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON public.user_presence FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;