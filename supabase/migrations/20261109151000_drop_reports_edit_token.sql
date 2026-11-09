-- Optional Package C follow-up. Apply only after verify-captcha and
-- verify-captcha-v2 no longer send edit_token (the column already has
-- DEFAULT gen_random_uuid()). Editing uses owner_user_id, not this token.
--
-- Do not apply before those functions are deployed.

ALTER TABLE public.reports DROP COLUMN IF EXISTS edit_token;

CREATE OR REPLACE FUNCTION public.enforce_report_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', auth.role(), '') = 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'active';
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
$$;
