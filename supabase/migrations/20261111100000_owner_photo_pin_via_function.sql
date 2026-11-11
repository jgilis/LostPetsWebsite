-- Phase 3 slice 3: owners change photo and pin only through the
-- owner-update-report Edge Function (service role + location offset).
-- Do not apply until that function is deployed. Paste in the production
-- SQL Editor. Not applied by this change.
--
-- Preserves live enforce_report_write() behaviour: pending inserts blocked,
-- identity fields locked, admin status set, owners only active→resolved,
-- resolved_at stamped on reunion. Adds: owners cannot write latitude,
-- longitude, or photo_url themselves. Clears resolved_at on resolved→active
-- so admin reactivation and the planned 7-day reopen stay consistent.

CREATE OR REPLACE FUNCTION public.enforce_report_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $enforce_report_write$
BEGIN
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
  THEN
    RAISE EXCEPTION 'owners can only mark an active report as resolved'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$enforce_report_write$;

REVOKE ALL ON FUNCTION public.enforce_report_write() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
