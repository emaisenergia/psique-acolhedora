
-- Fix overly permissive RLS policies on clinic_schedule_config
DROP POLICY IF EXISTS "Authenticated users can delete schedule configs" ON public.clinic_schedule_config;
DROP POLICY IF EXISTS "Authenticated users can insert schedule configs" ON public.clinic_schedule_config;
DROP POLICY IF EXISTS "Authenticated users can update schedule configs" ON public.clinic_schedule_config;
DROP POLICY IF EXISTS "Authenticated users can view schedule configs" ON public.clinic_schedule_config;

CREATE POLICY "Psychologists and admins can view schedule configs"
ON public.clinic_schedule_config FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can insert schedule configs"
ON public.clinic_schedule_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update schedule configs"
ON public.clinic_schedule_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can delete schedule configs"
ON public.clinic_schedule_config FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

-- Fix overly permissive RLS policies on schedule_breaks
DROP POLICY IF EXISTS "Authenticated users can delete schedule breaks" ON public.schedule_breaks;
DROP POLICY IF EXISTS "Authenticated users can insert schedule breaks" ON public.schedule_breaks;
DROP POLICY IF EXISTS "Authenticated users can update schedule breaks" ON public.schedule_breaks;
DROP POLICY IF EXISTS "Authenticated users can view schedule breaks" ON public.schedule_breaks;

CREATE POLICY "Psychologists and admins can view schedule breaks"
ON public.schedule_breaks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can insert schedule breaks"
ON public.schedule_breaks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update schedule breaks"
ON public.schedule_breaks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can delete schedule breaks"
ON public.schedule_breaks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));
