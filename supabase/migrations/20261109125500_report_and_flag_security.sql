-- Package A: report and flag RLS.
-- Does not change sighting policies, coordinate grants, or the approval
-- notification trigger. Apply after the matching frontend is live: that
-- frontend stops selecting reports.* and reports_flags.*, which would
-- fail once edit_token and ip_hash are no longer readable.
--
-- verify-captcha and flag-report use the service role and still write.

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
DROP POLICY IF EXISTS "allow insert flags" ON public.reports_flags;

REVOKE INSERT, TRUNCATE ON TABLE public.reports FROM PUBLIC, anon, authenticated;
REVOKE INSERT, TRUNCATE ON TABLE public.reports_flags FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON TABLE public.reports FROM anon;
REVOKE DELETE ON TABLE public.reports_flags FROM PUBLIC, anon, authenticated;

-- Table-level SELECT includes every column, including edit_token and ip_hash.
-- Replace it with grants for the columns the app actually reads.
REVOKE SELECT ON TABLE public.reports FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  type,
  animal_type,
  description,
  photo_url,
  latitude,
  longitude,
  date_reported,
  contact_info,
  status,
  animal_name,
  expires_at,
  owner_user_id,
  created_at
) ON TABLE public.reports TO anon, authenticated;

REVOKE UPDATE ON TABLE public.reports FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
  description,
  photo_url,
  animal_name,
  latitude,
  longitude,
  status
) ON TABLE public.reports TO authenticated;

REVOKE SELECT ON TABLE public.reports_flags FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  report_id,
  reason,
  created_at
) ON TABLE public.reports_flags TO authenticated;

REVOKE UPDATE ON TABLE public.reports_flags FROM PUBLIC, anon, authenticated;

CREATE POLICY "Admins can read all reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can read report flags"
  ON public.reports_flags
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

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
     OR NEW.edit_token IS DISTINCT FROM OLD.edit_token
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

DROP TRIGGER IF EXISTS reports_before_write ON public.reports;

CREATE TRIGGER reports_before_write
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_report_write();

REVOKE ALL ON FUNCTION public.enforce_report_write() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
