-- Create waitlist table for patients wanting occupied slots
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  desired_date DATE NOT NULL,
  desired_time TEXT,
  time_range_start TEXT,
  time_range_end TEXT,
  service TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_waitlist_patient ON waitlist(patient_id);
CREATE INDEX idx_waitlist_date ON waitlist(desired_date);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own waitlist entries"
  ON waitlist FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = waitlist.patient_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Patients can create waitlist entries"
  ON waitlist FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = waitlist.patient_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Patients can update their own waitlist entries"
  ON waitlist FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = waitlist.patient_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Psychologists and admins can view all waitlist"
  ON waitlist FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create waitlist entries"
  ON waitlist FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update waitlist"
  ON waitlist FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can delete waitlist"
  ON waitlist FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));