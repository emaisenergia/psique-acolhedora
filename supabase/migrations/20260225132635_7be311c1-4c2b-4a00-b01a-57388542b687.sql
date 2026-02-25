
-- Restrict get_user_roles to only return roles for the requesting user or admins
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() OR EXISTS(
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN (
      SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
      FROM public.user_roles WHERE user_id = _user_id
    )
    ELSE ARRAY[]::app_role[]
  END;
$$;
