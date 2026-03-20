
-- Add pricing and internal planning fields to events
ALTER TABLE public.events
ADD COLUMN public_price numeric NULL,
ADD COLUMN internal_price_estimate numeric NULL,
ADD COLUMN internal_notes text NULL,
ADD COLUMN currency text NOT NULL DEFAULT 'SEK';

-- Create journey stops table
CREATE TABLE public.journey_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'stop', -- hotel, restaurant, brewery, fuel, scenic, stop
  description text NULL,
  lat double precision NULL,
  lng double precision NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  -- Internal planning fields
  price_per_person numeric NULL,
  booking_reference text NULL,
  contact_info text NULL,
  internal_notes text NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_stops ENABLE ROW LEVEL SECURITY;

-- Public: anyone can see public stops of published events
CREATE POLICY "Anyone can view public stops of published events"
ON public.journey_stops FOR SELECT
TO public
USING (
  is_public = true AND EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND is_published = true
  )
);

-- Admins: full access
CREATE POLICY "Admins can view all stops"
ON public.journey_stops FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert stops"
ON public.journey_stops FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stops"
ON public.journey_stops FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stops"
ON public.journey_stops FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
