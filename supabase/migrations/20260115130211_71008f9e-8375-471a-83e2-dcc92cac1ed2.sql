-- Create treatment_plans table
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  start_date DATE,
  estimated_sessions INTEGER DEFAULT 12,
  current_progress INTEGER DEFAULT 0,
  objectives JSONB DEFAULT '[]'::jsonb,
  discharge_objectives JSONB DEFAULT '[]'::jsonb,
  approaches TEXT[] DEFAULT '{}',
  short_term_goals JSONB DEFAULT '[]'::jsonb,
  long_term_goals JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Psychologists and admins can view treatment plans"
ON public.treatment_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create treatment plans"
ON public.treatment_plans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update treatment plans"
ON public.treatment_plans FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete treatment plans"
ON public.treatment_plans FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_treatment_plans_updated_at
BEFORE UPDATE ON public.treatment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint per patient (one active plan at a time)
CREATE UNIQUE INDEX idx_treatment_plans_patient_active 
ON public.treatment_plans(patient_id) 
WHERE status = 'active';