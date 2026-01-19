-- Add patient_mood field to sessions table for tracking patient's emotional state during session
ALTER TABLE public.sessions 
ADD COLUMN patient_mood TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.sessions.patient_mood IS 'Humor do paciente registrado pelo psicólogo durante a sessão: muito_bem, bem, neutro, desafiador, dificil';

-- Add is_favorite field to patients table for quick access
ALTER TABLE public.patients 
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Add index for faster favorite queries
CREATE INDEX idx_patients_is_favorite ON public.patients(is_favorite) WHERE is_favorite = true;