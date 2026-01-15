-- Create insurance/convênio table
CREATE TABLE public.insurances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coverage_percentage NUMERIC(5,2) DEFAULT 0,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on insurances
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;

-- Only psychologists and admins can manage insurances
CREATE POLICY "Psychologists and admins can view insurances"
ON public.insurances FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create insurances"
ON public.insurances FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update insurances"
ON public.insurances FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete insurances"
ON public.insurances FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_insurances_updated_at
BEFORE UPDATE ON public.insurances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create session packages table
CREATE TABLE public.session_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 1,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_session NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN total_sessions > 0 THEN price / total_sessions ELSE 0 END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  start_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_packages
ALTER TABLE public.session_packages ENABLE ROW LEVEL SECURITY;

-- Psychologists and admins can manage packages
CREATE POLICY "Psychologists and admins can view packages"
ON public.session_packages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Patients can view their own packages"
ON public.session_packages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM patients p
  WHERE p.id = session_packages.patient_id AND p.user_id = auth.uid()
));

CREATE POLICY "Psychologists and admins can create packages"
ON public.session_packages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update packages"
ON public.session_packages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete packages"
ON public.session_packages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_session_packages_updated_at
BEFORE UPDATE ON public.session_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add insurance_id to patients table
ALTER TABLE public.patients ADD COLUMN insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL;

-- Add package_id to appointments table to link appointments to packages
ALTER TABLE public.appointments ADD COLUMN package_id UUID REFERENCES public.session_packages(id) ON DELETE SET NULL;

-- Add payment related columns to appointments
ALTER TABLE public.appointments ADD COLUMN payment_type TEXT DEFAULT 'single';
ALTER TABLE public.appointments ADD COLUMN payment_value NUMERIC(10,2);

-- Create index for better query performance
CREATE INDEX idx_session_packages_patient_id ON public.session_packages(patient_id);
CREATE INDEX idx_session_packages_status ON public.session_packages(status);
CREATE INDEX idx_appointments_package_id ON public.appointments(package_id);
CREATE INDEX idx_patients_insurance_id ON public.patients(insurance_id);