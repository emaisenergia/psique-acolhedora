-- Tabela para templates de tarefas de casa pré-definidas
CREATE TABLE public.homework_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'geral',
  fields JSONB DEFAULT '[]'::jsonb,
  attachment_url TEXT,
  attachment_name TEXT,
  is_ai_enriched BOOLEAN DEFAULT false,
  ai_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para recursos terapêuticos
CREATE TABLE public.therapeutic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'link',
  resource_url TEXT,
  resource_file_name TEXT,
  category TEXT DEFAULT 'geral',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_homework_templates_user ON public.homework_templates(user_id);
CREATE INDEX idx_homework_templates_category ON public.homework_templates(category);
CREATE INDEX idx_therapeutic_resources_user ON public.therapeutic_resources(user_id);
CREATE INDEX idx_therapeutic_resources_patient ON public.therapeutic_resources(patient_id);

-- Enable RLS
ALTER TABLE public.homework_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework_templates
CREATE POLICY "Psychologists and admins can view templates"
ON public.homework_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create templates"
ON public.homework_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update templates"
ON public.homework_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can delete templates"
ON public.homework_templates FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

-- RLS Policies for therapeutic_resources
CREATE POLICY "Psychologists and admins can view all resources"
ON public.therapeutic_resources FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Patients can view their own resources"
ON public.therapeutic_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = therapeutic_resources.patient_id
    AND p.user_id = auth.uid()
  )
  AND is_visible = true
);

CREATE POLICY "Psychologists and admins can create resources"
ON public.therapeutic_resources FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update resources"
ON public.therapeutic_resources FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can delete resources"
ON public.therapeutic_resources FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_homework_templates_updated_at
BEFORE UPDATE ON public.homework_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_therapeutic_resources_updated_at
BEFORE UPDATE ON public.therapeutic_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();