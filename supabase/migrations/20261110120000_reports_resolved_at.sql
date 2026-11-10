-- Slice 3 follow-up: stamp when a report was reunited.
-- Do not apply until the matching frontend SELECT of resolved_at is ready
-- to deploy with it. Not applied by this change.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

GRANT SELECT (resolved_at) ON TABLE public.reports TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_report_write()
RETURNS trigger
SECURITY INVOKER
SET search_path = public
AS $enforce_report_write$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status = 'resolved' THEN
      NEW.resolved_at := now();
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

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'active' AND NEW.status = 'resolved')
  THEN
    RAISE EXCEPTION 'owners can only mark an active report as resolved'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$enforce_report_write$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
