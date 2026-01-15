-- Create table for AI knowledge documents
CREATE TABLE public.ai_knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own knowledge documents"
ON public.ai_knowledge_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create knowledge documents"
ON public.ai_knowledge_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge documents"
ON public.ai_knowledge_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge documents"
ON public.ai_knowledge_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_knowledge_documents_updated_at
BEFORE UPDATE ON public.ai_knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();