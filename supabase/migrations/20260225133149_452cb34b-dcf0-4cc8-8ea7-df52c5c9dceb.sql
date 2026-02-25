-- ============================================================
-- FIX 1: patients - Restrict patient self-updates to safe fields only
-- ============================================================

DROP POLICY IF EXISTS "Patients can update their own profile" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own profile" ON public.patients;

CREATE POLICY "Patients can view their own profile"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Patients can update their own profile"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger to prevent patients from modifying sensitive fields
CREATE OR REPLACE FUNCTION public.restrict_patient_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist') THEN
    RETURN NEW;
  END IF;
  IF NEW.notes IS DISTINCT FROM OLD.notes THEN
    NEW.notes := OLD.notes;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;
  IF NEW.is_favorite IS DISTINCT FROM OLD.is_favorite THEN
    NEW.is_favorite := OLD.is_favorite;
  END IF;
  IF NEW.insurance_id IS DISTINCT FROM OLD.insurance_id THEN
    NEW.insurance_id := OLD.insurance_id;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restrict_patient_self_update
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_patient_self_update();

-- Secure view for patient portal (excludes notes)
CREATE OR REPLACE VIEW public.patient_profile_safe AS
SELECT id, user_id, name, email, phone, birth_date, status, insurance_id, is_favorite, created_at, updated_at
FROM public.patients;

-- ============================================================
-- FIX 2: sessions - Restrict patient access to non-sensitive fields
-- ============================================================

DROP POLICY IF EXISTS "Users can view their sessions" ON public.sessions;

CREATE POLICY "Psychologists and admins can view all sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (
    psychologist_id = (auth.uid())::text
    OR created_by = (auth.uid())::text
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'psychologist')
  );

-- Secure view for patients (excludes transcription, detailed_notes, clinical_observations, ai_insights)
CREATE OR REPLACE VIEW public.patient_sessions_safe AS
SELECT 
  id, patient_id, session_date, duration_minutes, status,
  patient_mood, summary, appointment_id, created_at, updated_at
FROM public.sessions
WHERE patient_id = (auth.uid())::text;

-- ============================================================
-- FIX 3: google_calendar_tokens - Remove all client-side RLS
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.google_calendar_tokens;

-- ============================================================
-- FIX 4: secure_messages - Enforce author_user_id on patient INSERT
-- ============================================================

DROP POLICY IF EXISTS "Patients can create messages for themselves" ON public.secure_messages;

CREATE POLICY "Patients can create messages for themselves"
  ON public.secure_messages FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = secure_messages.patient_id
      AND p.user_id = auth.uid()
    )
  );
