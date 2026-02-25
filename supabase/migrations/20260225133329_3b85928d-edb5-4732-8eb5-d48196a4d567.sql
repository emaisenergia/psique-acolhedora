-- FIX: google_calendar_tokens - add explicit owner-only policy
-- (Edge functions use service_role which bypasses RLS)
CREATE POLICY "Only token owner can view own tokens"
  ON public.google_calendar_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only token owner can manage own tokens"
  ON public.google_calendar_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- FIX: admin_profiles - create a restricted view for patients
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.admin_profiles;

-- Psychologists/admins see all profiles
CREATE POLICY "Staff can view all profiles"
  ON public.admin_profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'psychologist')
  );

-- Patients can only see name (via a safe view)
CREATE POLICY "Users can view their own profile"
  ON public.admin_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Safe view for patient portal (name only)
CREATE OR REPLACE VIEW public.admin_profiles_safe AS
SELECT id, name FROM public.admin_profiles;
ALTER VIEW public.admin_profiles_safe SET (security_invoker = on);
