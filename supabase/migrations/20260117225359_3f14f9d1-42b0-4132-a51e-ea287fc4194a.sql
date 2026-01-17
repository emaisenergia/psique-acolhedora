-- Create table for Google Calendar OAuth tokens
CREATE TABLE public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_calendar_tokens
CREATE POLICY "Users can view their own tokens" 
ON public.google_calendar_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.google_calendar_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for appointment action tokens
CREATE TABLE public.appointment_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('cancel', 'reschedule', 'confirm')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for token lookups
CREATE INDEX idx_action_tokens_token ON public.appointment_action_tokens(token);
CREATE INDEX idx_action_tokens_appointment ON public.appointment_action_tokens(appointment_id);

-- Enable RLS
ALTER TABLE public.appointment_action_tokens ENABLE ROW LEVEL SECURITY;

-- Public access for token validation (but only valid, unused tokens)
CREATE POLICY "Public can read valid tokens" 
ON public.appointment_action_tokens 
FOR SELECT 
USING (expires_at > now() AND used_at IS NULL);

-- Admins and psychologists can create tokens
CREATE POLICY "Admins and psychologists can create tokens" 
ON public.appointment_action_tokens 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

-- Allow token updates for marking as used (public needs this for the action)
CREATE POLICY "Anyone can mark tokens as used" 
ON public.appointment_action_tokens 
FOR UPDATE 
USING (expires_at > now() AND used_at IS NULL);

-- Add google_event_id column to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;