REVOKE ALL ON FUNCTION public.is_tax_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tax_staff(uuid) TO authenticated;