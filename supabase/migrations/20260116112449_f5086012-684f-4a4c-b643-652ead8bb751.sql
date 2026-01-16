-- Enable realtime for activities table only (secure_messages already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;