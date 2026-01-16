-- =============================================
-- 1. Blog Posts Table
-- =============================================
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  icon TEXT DEFAULT 'BookOpen',
  category TEXT DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies for blog_posts
CREATE POLICY "Anyone can view published posts"
ON public.blog_posts FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins and psychologists can view all posts"
ON public.blog_posts FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Admins and psychologists can create posts"
ON public.blog_posts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Admins and psychologists can update posts"
ON public.blog_posts FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Admins can delete posts"
ON public.blog_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Admin Preferences Table
-- =============================================
CREATE TABLE public.admin_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  session_reminders BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  
  -- Scheduling
  default_session_duration INTEGER DEFAULT 50,
  session_interval INTEGER DEFAULT 10,
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  work_start_time TEXT DEFAULT '08:00',
  work_end_time TEXT DEFAULT '18:00',
  
  -- Display
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'pt-BR',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
ON public.admin_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
ON public.admin_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON public.admin_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_admin_preferences_updated_at
  BEFORE UPDATE ON public.admin_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. AI Favorite Prompts Table
-- =============================================
CREATE TABLE public.ai_favorite_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_favorite_prompts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own prompts"
ON public.ai_favorite_prompts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own prompts"
ON public.ai_favorite_prompts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prompts"
ON public.ai_favorite_prompts FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own prompts"
ON public.ai_favorite_prompts FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_ai_favorite_prompts_updated_at
  BEFORE UPDATE ON public.ai_favorite_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();