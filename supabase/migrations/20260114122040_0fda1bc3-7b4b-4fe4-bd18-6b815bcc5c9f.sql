-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID REFERENCES auth.users(id),
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  service TEXT,
  mode TEXT NOT NULL DEFAULT 'presencial', -- 'online' or 'presencial'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'done', 'cancelled'
  notes TEXT,
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table (exercises assigned to patients)
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create secure_messages table
CREATE TABLE public.secure_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author TEXT NOT NULL, -- 'patient' or 'psychologist'
  author_user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  urgent BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal_entries table (patient mood/notes)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  mood TEXT NOT NULL, -- 'muito_bem', 'bem', 'neutro', 'desafiador', 'dificil'
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Psychologists and admins can view all patients"
ON public.patients FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can view their own profile"
ON public.patients FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Psychologists and admins can create patients"
ON public.patients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Psychologists and admins can update patients"
ON public.patients FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can update their own profile"
ON public.patients FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete patients"
ON public.patients FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Appointments policies
CREATE POLICY "Psychologists and admins can view all appointments"
ON public.appointments FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can view their own appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can create appointments for themselves"
ON public.appointments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can update appointments"
ON public.appointments FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can update their own appointments"
ON public.appointments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Activities policies
CREATE POLICY "Psychologists and admins can view all activities"
ON public.activities FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can view their own activities"
ON public.activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = activities.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can create activities"
ON public.activities FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Psychologists and admins can update activities"
ON public.activities FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can update their own activities"
ON public.activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = activities.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can delete activities"
ON public.activities FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

-- Secure messages policies
CREATE POLICY "Psychologists and admins can view all messages"
ON public.secure_messages FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can view their own messages"
ON public.secure_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = secure_messages.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can create messages"
ON public.secure_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can create messages for themselves"
ON public.secure_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Psychologists and admins can update messages"
ON public.secure_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

-- Journal entries policies
CREATE POLICY "Psychologists and admins can view journal entries"
ON public.journal_entries FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Patients can view their own journal entries"
ON public.journal_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = journal_entries.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can create journal entries"
ON public.journal_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can update their own journal entries"
ON public.journal_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = journal_entries.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can delete their own journal entries"
ON public.journal_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = journal_entries.patient_id AND p.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.secure_messages;