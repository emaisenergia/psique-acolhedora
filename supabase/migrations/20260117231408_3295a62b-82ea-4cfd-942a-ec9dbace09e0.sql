-- Create reminder_logs table to track sent reminders
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'email', 'whatsapp_pending', 'whatsapp_sent'
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'pending', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all reminder logs"
ON public.reminder_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'psychologist')
  )
);

CREATE POLICY "Service role can insert reminder logs"
ON public.reminder_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_reminder_logs_appointment_id ON public.reminder_logs(appointment_id);
CREATE INDEX idx_reminder_logs_sent_at ON public.reminder_logs(sent_at DESC);

-- Add rescheduled_from column to appointments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'rescheduled_from'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN rescheduled_from UUID REFERENCES public.appointments(id);
  END IF;
END $$;