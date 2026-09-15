-- Run this in your Supabase SQL editor to support assigning specific topics to participants
ALTER TABLE registrations ADD COLUMN assigned_topic TEXT;
