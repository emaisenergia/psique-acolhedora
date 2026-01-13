-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  appointment_id TEXT,
  psychologist_id TEXT,
  
  -- Session timing
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  cancellation_reason TEXT,
  
  -- Session content
  detailed_notes TEXT,
  summary TEXT,
  ai_generated_summary TEXT,
  clinical_observations TEXT,
  
  -- AI insights
  transcription TEXT,
  ai_insights JSONB,
  recurring_themes JSONB,
  
  -- Treatment integration
  treatment_goals JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

-- Create session files table for uploads
CREATE TABLE public.session_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  is_recording BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session audit log for tracking changes
CREATE TABLE public.session_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_fields JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions (admin/psychologist access)
CREATE POLICY "Sessions are viewable by authenticated users" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Sessions can be created by authenticated users" 
ON public.sessions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Sessions can be updated by authenticated users" 
ON public.sessions 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Sessions can be deleted by authenticated users" 
ON public.sessions 
FOR DELETE 
TO authenticated
USING (true);

-- RLS Policies for session_files
CREATE POLICY "Session files are viewable by authenticated users" 
ON public.session_files 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Session files can be created by authenticated users" 
ON public.session_files 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Session files can be deleted by authenticated users" 
ON public.session_files 
FOR DELETE 
TO authenticated
USING (true);

-- RLS Policies for audit log
CREATE POLICY "Audit logs are viewable by authenticated users" 
ON public.session_audit_log 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Audit logs can be created by authenticated users" 
ON public.session_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create storage bucket for session files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-files', 'session-files', false);

-- Storage policies
CREATE POLICY "Session files are accessible by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'session-files');

CREATE POLICY "Session files can be uploaded by authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-files');

CREATE POLICY "Session files can be deleted by authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'session-files');

-- Create updated_at trigger
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_session_date ON public.sessions(session_date);
CREATE INDEX idx_session_files_session_id ON public.session_files(session_id);