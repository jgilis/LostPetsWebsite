-- Sighting inserts, exact coordinates, and notification creation.
-- Does not change the push webhook or existing sighting and notification rows.
-- Apply after the frontend in this commit is live. That frontend still works
-- against the current database, then uses this function and trigger.

-- Clients can no longer insert sightings. The service-role submission function
-- bypasses RLS. A BEFORE trigger still forces status pending and checks the report.
DROP POLICY IF EXISTS "Anyone can insert sightings" ON public.sightings;

-- Ordinary signed-in users can no longer insert notification rows.
DROP POLICY IF EXISTS "allow inserts from authenticated users" ON public.notification_events;

REVOKE INSERT ON TABLE public.notification_events FROM anon, authenticated;

-- Production grants anon and authenticated SELECT on the whole table.
-- A column-level REVOKE does not remove that table-level privilege.
-- Replace table SELECT with grants for the columns the map and Activity use.
-- service_role keeps its existing table privileges, including coordinates.
REVOKE SELECT ON TABLE public.sightings FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  lost_report_id,
  created_at,
  description,
  photo_url,
  status,
  moderated_at,
  expires_at
) ON TABLE public.sightings TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin IS TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_sighting_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';

    IF NOT EXISTS (
      SELECT 1
      FROM public.reports AS report
      WHERE report.id = NEW.lost_report_id
        AND report.type = 'lost'
        AND report.status = 'active'
    ) THEN
      RAISE EXCEPTION 'sightings can only be added to an active lost report'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_current_user_admin() THEN
      RAISE EXCEPTION 'only an administrator can change sighting status'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status NOT IN ('pending', 'approved', 'rejected', 'expired', 'removed') THEN
      RAISE EXCEPTION 'invalid sighting status'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sightings_before_write ON public.sightings;

CREATE TRIGGER sightings_before_write
  BEFORE INSERT OR UPDATE ON public.sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sighting_write();

CREATE OR REPLACE FUNCTION public.notify_report_owner_on_sighting_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved' OR OLD.status IS NOT DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
      AND profile.is_admin IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  SELECT report.owner_user_id
  INTO owner_id
  FROM public.reports AS report
  WHERE report.id = NEW.lost_report_id
    AND report.type = 'lost';

  IF owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notification_events (type, target_user_id, payload)
  VALUES (
    'sighting_approved',
    owner_id,
    jsonb_build_object(
      'sighting_id', NEW.id,
      'lost_report_id', NEW.lost_report_id,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sightings_notify_owner_on_approval ON public.sightings;

CREATE TRIGGER sightings_notify_owner_on_approval
  AFTER UPDATE OF status ON public.sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_report_owner_on_sighting_approval();

-- Returns coordinates only for an administrator or the owner of the linked lost report.
-- plpgsql is used so the security-definer body cannot be inlined as the caller.
CREATE OR REPLACE FUNCTION public.sighting_exact_coordinates(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  latitude numeric,
  longitude numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) < 1 OR cardinality(p_ids) > 200 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT sighting.id, sighting.latitude, sighting.longitude
  FROM public.sightings AS sighting
  JOIN public.reports AS report ON report.id = sighting.lost_report_id
  WHERE sighting.id = ANY (p_ids)
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles AS profile
        WHERE profile.id = auth.uid()
          AND profile.is_admin IS TRUE
      )
      OR report.owner_user_id = auth.uid()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_sighting_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_report_owner_on_sighting_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sighting_exact_coordinates(uuid[]) FROM PUBLIC, anon;
-- The BEFORE trigger runs as the signed-in user and calls this helper.
-- EXECUTE does not bypass RLS: the function stays SECURITY INVOKER and
-- only reads profiles.id = auth.uid().
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sighting_exact_coordinates(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
