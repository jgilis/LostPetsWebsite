-- Phase 3 slice 4: owners may set resolved → active within 7 days of
-- resolved_at. The trigger still clears resolved_at on that transition.
-- Legacy resolved rows with NULL resolved_at cannot reopen this way.
-- Do not apply until pasted in the production SQL Editor. Not applied
-- by this change.
--
-- Preserves live enforce_report_write() behaviour from slice 3: pending
-- inserts blocked, identity fields locked, admin status set, owners
-- cannot write latitude/longitude/photo_url, resolved_at stamped on
-- reunion and cleared on resolved→active.

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

REVOKE ALL ON FUNCTION public.enforce_report_write() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
