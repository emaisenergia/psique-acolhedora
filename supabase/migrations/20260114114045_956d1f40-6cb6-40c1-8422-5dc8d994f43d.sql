-- 1. Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'psychologist', 'patient');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Only admins can manage roles (using service role for admin operations)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- 4. Drop existing overly permissive policies on sessions
DROP POLICY IF EXISTS "Sessions are viewable by authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be created by authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be updated by authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be deleted by authenticated users" ON public.sessions;

-- 5. Create role-based RLS policies for sessions
-- Psychologists can see sessions they created or are assigned to
-- Patients can see their own sessions
-- Admins can see all sessions
CREATE POLICY "Users can view their sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid()::text
  OR psychologist_id = auth.uid()::text
  OR created_by = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

CREATE POLICY "Psychologists and admins can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

CREATE POLICY "Psychologists and admins can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
  psychologist_id = auth.uid()::text
  OR created_by = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Psychologists and admins can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (
  psychologist_id = auth.uid()::text
  OR created_by = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);

-- 6. Drop existing overly permissive policies on session_files
DROP POLICY IF EXISTS "Session files are viewable by authenticated users" ON public.session_files;
DROP POLICY IF EXISTS "Session files can be created by authenticated users" ON public.session_files;
DROP POLICY IF EXISTS "Session files can be deleted by authenticated users" ON public.session_files;

-- 7. Create role-based RLS policies for session_files
CREATE POLICY "Users can view session files for their sessions"
ON public.session_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (
      s.patient_id = auth.uid()::text
      OR s.psychologist_id = auth.uid()::text
      OR s.created_by = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'psychologist')
    )
  )
);

CREATE POLICY "Psychologists and admins can create session files"
ON public.session_files FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

CREATE POLICY "Psychologists and admins can delete session files"
ON public.session_files FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

-- 8. Drop existing overly permissive policies on session_audit_log
DROP POLICY IF EXISTS "Audit logs are viewable by authenticated users" ON public.session_audit_log;
DROP POLICY IF EXISTS "Audit logs can be created by authenticated users" ON public.session_audit_log;

-- 9. Create role-based RLS policies for session_audit_log
CREATE POLICY "Admins and psychologists can view audit logs"
ON public.session_audit_log FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

CREATE POLICY "Admins and psychologists can create audit logs"
ON public.session_audit_log FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychologist')
);

-- 10. Create admin profiles table for additional user info
CREATE TABLE public.admin_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name text NOT NULL,
    phone text,
    credential text,
    bio text,
    timezone text DEFAULT 'America/Sao_Paulo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for display purposes)
CREATE POLICY "Authenticated users can view profiles"
ON public.admin_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.admin_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.admin_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();