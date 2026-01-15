-- Create table for file tags
CREATE TABLE public.file_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  tag TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(bucket_id, file_path, tag)
);

-- Enable RLS
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all file tags" 
ON public.file_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'psychologist')
  )
);

CREATE POLICY "Admins can create file tags" 
ON public.file_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'psychologist')
  )
);

CREATE POLICY "Admins can delete file tags" 
ON public.file_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'psychologist')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_file_tags_bucket_path ON public.file_tags(bucket_id, file_path);
CREATE INDEX idx_file_tags_tag ON public.file_tags(tag);