-- Create documents bucket for general files (public for easy access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for session-files bucket (private files per user)
CREATE POLICY "Users can upload session files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'session-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view session files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'session-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete session files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'session-files' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for documents bucket
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);