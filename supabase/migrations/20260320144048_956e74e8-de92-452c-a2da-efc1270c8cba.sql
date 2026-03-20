
-- Add quantity and unit_cost columns to journey_stops for advanced cost planning
ALTER TABLE public.journey_stops
  ADD COLUMN quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN unit_cost numeric DEFAULT NULL;
