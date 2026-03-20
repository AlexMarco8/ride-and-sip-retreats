
-- Add route_points JSONB column to events table
ALTER TABLE public.events ADD COLUMN route_points JSONB DEFAULT '[]'::jsonb;
