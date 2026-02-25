-- Fix SECURITY DEFINER views to use SECURITY INVOKER
ALTER VIEW public.patient_profile_safe SET (security_invoker = on);
ALTER VIEW public.patient_sessions_safe SET (security_invoker = on);
