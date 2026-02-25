
-- Make buckets private to prevent direct public URL access
UPDATE storage.buckets SET public = false WHERE id IN ('documents', 'therapeutic-resources');

-- Drop existing overly permissive policies on therapeutic-resources
DROP POLICY IF EXISTS "Anyone can view therapeutic resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload therapeutic resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update therapeutic resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete therapeutic resources" ON storage.objects;

-- Drop existing overly permissive policies on documents
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Therapeutic resources: only admins/psychologists can manage, patients access via signed URLs
CREATE POLICY "Staff can view therapeutic resources"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'therapeutic-resources' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can upload therapeutic resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'therapeutic-resources' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can update therapeutic resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'therapeutic-resources' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can delete therapeutic resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'therapeutic-resources' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

-- Documents: only admins/psychologists can manage
CREATE POLICY "Staff can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);

CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'psychologist'))
);
