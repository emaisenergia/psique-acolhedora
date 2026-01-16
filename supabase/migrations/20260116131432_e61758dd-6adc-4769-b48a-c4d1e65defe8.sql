-- Add missing schedule configuration columns to admin_preferences
ALTER TABLE admin_preferences 
ADD COLUMN IF NOT EXISTS break_start_time TEXT DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS break_end_time TEXT DEFAULT '13:00',
ADD COLUMN IF NOT EXISTS allow_online_booking BOOLEAN DEFAULT true;