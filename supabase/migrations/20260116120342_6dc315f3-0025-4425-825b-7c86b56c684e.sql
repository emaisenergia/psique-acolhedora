-- Add column to control if treatment plan is shared with patient
ALTER TABLE public.treatment_plans 
ADD COLUMN is_shared_with_patient boolean NOT NULL DEFAULT false;

-- Update RLS policy for patients to only see shared plans
DROP POLICY IF EXISTS "Patients can view their own treatment plans" ON public.treatment_plans;

CREATE POLICY "Patients can view their own shared treatment plans" 
ON public.treatment_plans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = treatment_plans.patient_id 
    AND p.user_id = auth.uid()
  ) AND is_shared_with_patient = true
);