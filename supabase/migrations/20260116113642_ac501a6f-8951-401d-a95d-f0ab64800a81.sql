-- Add RLS policy for patients to view their own treatment plans
CREATE POLICY "Patients can view their own treatment plans"
ON public.treatment_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = treatment_plans.patient_id
    AND p.user_id = auth.uid()
  )
);