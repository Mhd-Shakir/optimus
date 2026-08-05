-- Please run this SQL script in your Supabase SQL Editor to support assigning events to judges.
ALTER TABLE events ADD COLUMN judge_id UUID REFERENCES users(id) ON DELETE SET NULL;
