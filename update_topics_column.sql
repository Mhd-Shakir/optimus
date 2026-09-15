-- Please run this SQL script in your Supabase SQL Editor to support multiple topics per event.
-- We are keeping the old 'topic' column just in case, but adding 'topics' as a JSONB array.
ALTER TABLE events ADD COLUMN topics JSONB DEFAULT '[]'::jsonb;
