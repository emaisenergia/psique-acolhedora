
-- Allow psychologists and admins to delete journal entries
CREATE POLICY "Psychologists and admins can delete journal entries"
ON public.journal_entries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));
