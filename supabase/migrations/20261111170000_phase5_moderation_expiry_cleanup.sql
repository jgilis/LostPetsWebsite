-- Phase 5: moderation audit, reviewed_by on sighting decide, expiry job,
-- and sighting-photo cleanup on cascade delete.
-- Paste in the production SQL Editor. Not applied by this change.
-- Do not run supabase db push.
-- Do not enable PostGIS. Optional hourly run:
--   SELECT cron.schedule('expire-due-listings', '20 * * * *',
--     $$SELECT public.expire_due_listings()$$);
-- after pg_cron is enabled in Database → Extensions.

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users (id),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_actions_target_type_allowed
    CHECK (target_type IN ('report', 'sighting')),
  CONSTRAINT moderation_actions_action_allowed
    CHECK (action IN ('approve', 'reject', 'hide', 'restore', 'resolve'))
);

CREATE INDEX moderation_actions_created_at_idx
  ON public.moderation_actions (created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_actions_select_admin
  ON public.moderation_actions
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

REVOKE ALL ON TABLE public.moderation_actions FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.moderation_actions TO authenticated;

CREATE OR REPLACE FUNCTION public.log_moderation_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $log_moderation_action$
DECLARE
  actor uuid;
  recorded_action text;
  recorded_type text;
BEGIN
  IF TG_OP IS DISTINCT FROM 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  actor := auth.uid();
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = actor
      AND profile.is_admin IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'sightings' THEN
    recorded_type := 'sighting';
    recorded_action := CASE NEW.status
      WHEN 'approved' THEN 'approve'
      WHEN 'rejected' THEN 'reject'
      ELSE NULL
    END;
  ELSIF TG_TABLE_NAME = 'reports' THEN
    recorded_type := 'report';
    recorded_action := CASE
      WHEN NEW.status = 'removed' THEN 'hide'
      WHEN NEW.status = 'resolved' THEN 'resolve'
      WHEN NEW.status = 'active'
        AND OLD.status IN ('removed', 'flagged') THEN 'restore'
      ELSE NULL
    END;
  ELSE
    RETURN NEW;
  END IF;

  IF recorded_action IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.moderation_actions (
    actor_id,
    target_type,
    target_id,
    action
  )
  VALUES (
    actor,
    recorded_type,
    NEW.id,
    recorded_action
  );

  RETURN NEW;
END;
$log_moderation_action$;

DROP TRIGGER IF EXISTS sightings_after_status_log_moderation ON public.sightings;
CREATE TRIGGER sightings_after_status_log_moderation
  AFTER UPDATE OF status ON public.sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS reports_after_status_log_moderation ON public.reports;
CREATE TRIGGER reports_after_status_log_moderation
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_action();

CREATE OR REPLACE FUNCTION public.enforce_sighting_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $enforce_sighting_write$
BEGIN
  IF current_setting('lostpets.expire_listings', true) = 'true'
     AND TG_OP = 'UPDATE'
     AND NEW.status = 'expired'
     AND OLD.status IS DISTINCT FROM 'expired'
  THEN
    RETURN NEW;
  END IF;

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

    IF NEW.status IN ('approved', 'rejected') THEN
      NEW.reviewed_by := auth.uid();
      NEW.moderated_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$enforce_sighting_write$;

CREATE OR REPLACE FUNCTION public.enforce_report_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $enforce_report_write$
BEGIN
  IF current_setting('lostpets.expire_listings', true) = 'true'
     AND TG_OP = 'UPDATE'
     AND NEW.status = 'expired'
     AND OLD.status IS DISTINCT FROM 'expired'
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status = 'resolved' THEN
      NEW.resolved_at := now();
    ELSIF OLD.status = 'resolved' AND NEW.status = 'active' THEN
      NEW.resolved_at := NULL;
    ELSIF NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
      AND COALESCE(auth.jwt() ->> 'role', auth.role(), '') IS DISTINCT FROM 'service_role'
    THEN
      RAISE EXCEPTION 'resolved_at cannot be changed'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF COALESCE(auth.jwt() ->> 'role', auth.role(), '') = 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'active';
      NEW.resolved_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'reports can only be created through the captcha function'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.date_reported IS DISTINCT FROM OLD.date_reported
     OR NEW.type IS DISTINCT FROM OLD.type
  THEN
    RAISE EXCEPTION 'report identity fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF public.is_current_user_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('active', 'flagged', 'removed', 'resolved', 'expired')
    THEN
      RAISE EXCEPTION 'invalid report status'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.animal_type IS DISTINCT FROM OLD.animal_type
     OR NEW.contact_info IS DISTINCT FROM OLD.contact_info
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
  THEN
    RAISE EXCEPTION 'owners cannot change that report field'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.latitude IS DISTINCT FROM OLD.latitude
     OR NEW.longitude IS DISTINCT FROM OLD.longitude
     OR NEW.photo_url IS DISTINCT FROM OLD.photo_url
  THEN
    RAISE EXCEPTION 'owners cannot change photo or location directly'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'active' AND NEW.status = 'resolved')
     AND NOT (
       OLD.status = 'resolved'
       AND NEW.status = 'active'
       AND OLD.resolved_at IS NOT NULL
       AND OLD.resolved_at >= (now() - interval '7 days')
       AND OLD.resolved_at <= now()
     )
  THEN
    RAISE EXCEPTION 'owners can only mark an active report as resolved or reopen within 7 days'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$enforce_report_write$;

CREATE OR REPLACE FUNCTION public.expire_due_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $expire_due_listings$
DECLARE
  report_count integer := 0;
  sighting_count integer := 0;
BEGIN
  PERFORM set_config('lostpets.expire_listings', 'true', true);

  UPDATE public.reports
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS report_count = ROW_COUNT;

  UPDATE public.sightings
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS sighting_count = ROW_COUNT;

  RETURN report_count + sighting_count;
END;
$expire_due_listings$;

CREATE OR REPLACE FUNCTION public.delete_sighting_photo_objects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage, public
AS $delete_sighting_photo_objects$
DECLARE
  photo_ref text;
  object_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    photo_ref := OLD.photo_url;
  ELSIF TG_OP = 'UPDATE' AND OLD.photo_url IS DISTINCT FROM NEW.photo_url THEN
    photo_ref := OLD.photo_url;
  ELSE
    RETURN NEW;
  END IF;

  IF photo_ref IS NULL OR photo_ref = '' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  object_name := substring(photo_ref FROM 'sighting-photos/([^?#]+)');
  IF object_name IS NULL OR object_name = '' THEN
    object_name := photo_ref;
  END IF;

  IF object_name ~ '^https?://' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'sighting-photos'
      AND name = object_name;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$delete_sighting_photo_objects$;

DROP TRIGGER IF EXISTS trg_delete_sighting_photo_objects ON public.sightings;
CREATE TRIGGER trg_delete_sighting_photo_objects
  AFTER DELETE OR UPDATE OF photo_url ON public.sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_sighting_photo_objects();

REVOKE ALL ON FUNCTION public.log_moderation_action() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_due_listings() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_sighting_photo_objects() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_sighting_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_report_write() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
