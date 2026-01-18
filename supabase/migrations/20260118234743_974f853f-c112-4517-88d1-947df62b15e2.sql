-- Criar tabela para armazenar consentimentos dos pacientes
CREATE TABLE public.patient_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  consent_type VARCHAR(50) NOT NULL DEFAULT 'terms_and_privacy',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, consent_version, consent_type)
);

-- Habilitar RLS
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

-- Política: Pacientes podem ver seus próprios consentimentos
CREATE POLICY "Patients can view their own consents"
ON public.patient_consents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_consents.patient_id 
    AND patients.user_id = auth.uid()
  )
);

-- Política: Pacientes podem inserir seus próprios consentimentos
CREATE POLICY "Patients can insert their own consents"
ON public.patient_consents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_consents.patient_id 
    AND patients.user_id = auth.uid()
  )
);

-- Política: Admins e psicólogos podem ver todos os consentimentos
CREATE POLICY "Staff can view all consents"
ON public.patient_consents
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'psychologist')
);

-- Índice para performance
CREATE INDEX idx_patient_consents_patient_id ON public.patient_consents(patient_id);
CREATE INDEX idx_patient_consents_version ON public.patient_consents(consent_version);