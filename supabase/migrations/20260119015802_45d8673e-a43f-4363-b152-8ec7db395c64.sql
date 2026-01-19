-- Add color column to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Create clinic_schedule_config table
CREATE TABLE public.clinic_schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (
    day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')
  ),
  work_start_time TEXT NOT NULL DEFAULT '08:00',
  work_end_time TEXT NOT NULL DEFAULT '18:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, day_of_week)
);

-- Create schedule_breaks table
CREATE TABLE public.schedule_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_config_id UUID NOT NULL REFERENCES public.clinic_schedule_config(id) ON DELETE CASCADE,
  break_start_time TEXT NOT NULL,
  break_end_time TEXT NOT NULL,
  label TEXT DEFAULT 'Intervalo',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create triggers for updated_at
CREATE TRIGGER update_clinic_schedule_config_updated_at
  BEFORE UPDATE ON public.clinic_schedule_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.clinic_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_breaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clinic_schedule_config
CREATE POLICY "Authenticated users can view schedule configs"
  ON public.clinic_schedule_config FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert schedule configs"
  ON public.clinic_schedule_config FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedule configs"
  ON public.clinic_schedule_config FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedule configs"
  ON public.clinic_schedule_config FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for schedule_breaks
CREATE POLICY "Authenticated users can view schedule breaks"
  ON public.schedule_breaks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert schedule breaks"
  ON public.schedule_breaks FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedule breaks"
  ON public.schedule_breaks FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedule breaks"
  ON public.schedule_breaks FOR DELETE TO authenticated
  USING (true);