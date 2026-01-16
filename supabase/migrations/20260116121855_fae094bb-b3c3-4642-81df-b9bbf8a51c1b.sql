-- Create table for treatment plan versions/history
CREATE TABLE public.treatment_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.treatment_plan_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for treatment plan versions
CREATE POLICY "Psychologists and admins can view plan versions"
ON public.treatment_plan_versions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create plan versions"
ON public.treatment_plan_versions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete plan versions"
ON public.treatment_plan_versions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_treatment_plan_versions_plan_id ON public.treatment_plan_versions(treatment_plan_id);
CREATE INDEX idx_treatment_plan_versions_created_at ON public.treatment_plan_versions(created_at DESC);