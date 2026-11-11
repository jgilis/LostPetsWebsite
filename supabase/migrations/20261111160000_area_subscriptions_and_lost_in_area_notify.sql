-- Phase 4: named alert zones and one in-app notice per person per new lost report.
-- Paste in the production SQL Editor. Not applied by this change.
-- Do not run supabase db push.
--
-- Matching is a reports AFTER INSERT trigger so verify-captcha-v2 and the
-- retained verify-captcha path cannot skip it. Edits, reopen, flag, resolve,
-- found reports, and sightings do not insert here.
-- Dedup is a unique index on (subscriber, report id) for type
-- lost_report_in_area — not the zone id. No extra table. No spatial extension.

CREATE TABLE public.area_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_m integer NOT NULL,
  animal_type text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT area_subscriptions_label_len
    CHECK (char_length(btrim(label)) BETWEEN 1 AND 40),
  CONSTRAINT area_subscriptions_radius_allowed
    CHECK (radius_m IN (500, 1000, 2000)),
  CONSTRAINT area_subscriptions_animal_allowed
    CHECK (
      animal_type IS NULL
      OR animal_type IN ('dog', 'cat', 'bird', 'rodent', 'other')
    ),
  CONSTRAINT area_subscriptions_latitude_range
    CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT area_subscriptions_longitude_range
    CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX area_subscriptions_user_id_idx
  ON public.area_subscriptions (user_id);

CREATE INDEX area_subscriptions_enabled_idx
  ON public.area_subscriptions (enabled)
  WHERE enabled IS TRUE;

ALTER TABLE public.area_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY area_subscriptions_select_own
  ON public.area_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY area_subscriptions_insert_own
  ON public.area_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY area_subscriptions_update_own
  ON public.area_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY area_subscriptions_delete_own
  ON public.area_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.area_subscriptions FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.area_subscriptions TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_area_subscription_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $enforce_area_subscription_write$
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', auth.role(), '') IS DISTINCT FROM 'service_role' THEN
    NEW.user_id := auth.uid();
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'area subscriptions require a signed-in user'
      USING ERRCODE = '42501';
  END IF;

  NEW.label := btrim(NEW.label);

  IF TG_OP = 'INSERT' THEN
    PERFORM pg_advisory_xact_lock(87, hashtext(NEW.user_id::text));
    IF (
      SELECT count(*)
      FROM public.area_subscriptions AS existing
      WHERE existing.user_id = NEW.user_id
    ) >= 5 THEN
      RAISE EXCEPTION 'at most five area subscriptions'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$enforce_area_subscription_write$;

DROP TRIGGER IF EXISTS area_subscriptions_before_write ON public.area_subscriptions;

CREATE TRIGGER area_subscriptions_before_write
  BEFORE INSERT OR UPDATE ON public.area_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_area_subscription_write();

-- Same haversine as src/lib/geo/haversine.ts. Inclusive radius uses <= in the matcher.
CREATE OR REPLACE FUNCTION public.area_subscription_distance_meters(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $area_subscription_distance_meters$
  SELECT 6371000 * 2 * asin(
    least(
      1.0,
      sqrt(
        sin(radians(lat2 - lat1) / 2) ^ 2
        + cos(radians(lat1))
          * cos(radians(lat2))
          * sin(radians(lng2 - lng1) / 2) ^ 2
      )
    )
  );
$area_subscription_distance_meters$;

CREATE UNIQUE INDEX notification_events_one_lost_in_area_per_report
  ON public.notification_events (
    target_user_id,
    ((payload ->> 'lost_report_id'))
  )
  WHERE type = 'lost_report_in_area';

CREATE OR REPLACE FUNCTION public.notify_area_subscribers_on_lost_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $notify_area_subscribers_on_lost_report$
BEGIN
  IF TG_OP IS DISTINCT FROM 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'lost' OR NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF NEW.latitude IS NULL OR NEW.longitude IS NULL OR NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notification_events (type, target_user_id, payload)
  SELECT DISTINCT ON (sub.user_id)
    'lost_report_in_area',
    sub.user_id,
    jsonb_build_object(
      'lost_report_id', NEW.id,
      'animal_type', NEW.animal_type,
      -- ~1.1 km grid so LocationDisplay can reverse-geocode a neighbourhood
      -- without storing the report pin or any zone field.
      'latitude', round(NEW.latitude::numeric, 2),
      'longitude', round(NEW.longitude::numeric, 2)
    )
  FROM public.area_subscriptions AS sub
  WHERE sub.enabled IS TRUE
    AND sub.user_id IS DISTINCT FROM NEW.owner_user_id
    AND (sub.animal_type IS NULL OR sub.animal_type = NEW.animal_type)
    AND public.area_subscription_distance_meters(
      sub.latitude,
      sub.longitude,
      NEW.latitude,
      NEW.longitude
    ) <= sub.radius_m
  ORDER BY sub.user_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$notify_area_subscribers_on_lost_report$;

DROP TRIGGER IF EXISTS reports_after_insert_notify_area ON public.reports;

CREATE TRIGGER reports_after_insert_notify_area
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_area_subscribers_on_lost_report();

REVOKE ALL ON FUNCTION public.enforce_area_subscription_write() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.area_subscription_distance_meters(double precision, double precision, double precision, double precision) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_area_subscribers_on_lost_report() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_area_subscription_write() TO authenticated;

NOTIFY pgrst, 'reload schema';
