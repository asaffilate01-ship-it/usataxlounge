
-- Create a rate limiting function for contact form submissions
-- Limits to 3 submissions per email per hour
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(sender_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.contact_messages
  WHERE email = sender_email
    AND created_at > now() - interval '1 hour';
  
  RETURN recent_count < 3;
END;
$$;
