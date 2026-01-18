-- Create clinics table
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists and admins can manage clinics"
  ON clinics FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

-- Create service_prices table
CREATE TABLE public.service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  insurance_id UUID REFERENCES insurances(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_social BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_service_prices_updated_at
  BEFORE UPDATE ON service_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for service_prices
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists and admins can manage service prices"
  ON service_prices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

-- Add clinic_id to appointments
ALTER TABLE appointments ADD COLUMN clinic_id UUID REFERENCES clinics(id);