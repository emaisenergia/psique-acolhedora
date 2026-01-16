-- Criar bucket para recursos terapêuticos
INSERT INTO storage.buckets (id, name, public)
VALUES ('therapeutic-resources', 'therapeutic-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Política para usuários autenticados fazerem upload
CREATE POLICY "Authenticated users can upload therapeutic resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'therapeutic-resources' 
  AND auth.role() = 'authenticated'
);

-- Política para qualquer pessoa visualizar recursos
CREATE POLICY "Anyone can view therapeutic resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'therapeutic-resources');

-- Política para usuários autenticados deletarem recursos
CREATE POLICY "Authenticated users can delete therapeutic resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'therapeutic-resources' 
  AND auth.role() = 'authenticated'
);