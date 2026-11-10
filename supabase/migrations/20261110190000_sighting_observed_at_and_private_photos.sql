-- Phase 3 slice 2: observation time + private sighting photos.
-- Do not apply until the matching frontend and smooth-processor deploy
-- are ready. Paste in the production SQL Editor. Not applied by this change.
--
-- Does not change sighting RLS, coordinate grants, or notification triggers.
-- Does not make sighting photos public. Admins can read objects so they can
-- create a signed URL for review.
--
-- CREATE OR REPLACE keeps the existing function OID and EXECUTE grants
-- (anon/authenticated remain revoked). The trigger is reattached explicitly
-- so it cannot silently detach. Bucket upsert forces public = false even if
-- sighting-photos already exists with unexpected settings.

ALTER TABLE public.sightings
  ADD COLUMN IF NOT EXISTS observed_at timestamptz;

GRANT SELECT (observed_at) ON TABLE public.sightings TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_sighting_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $enforce_sighting_write$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';

    IF NEW.observed_at IS NULL THEN
      NEW.observed_at := now();
    END IF;

    IF NEW.observed_at > now() THEN
      RAISE EXCEPTION 'observed_at cannot be in the future'
        USING ERRCODE = '23514';
    END IF;

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

  IF NEW.observed_at IS DISTINCT FROM OLD.observed_at
     AND COALESCE(auth.jwt() ->> 'role', auth.role(), '') IS DISTINCT FROM 'service_role'
  THEN
    RAISE EXCEPTION 'observed_at cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.observed_at IS NOT NULL AND NEW.observed_at > now() THEN
    RAISE EXCEPTION 'observed_at cannot be in the future'
      USING ERRCODE = '23514';
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
$enforce_sighting_write$;

REVOKE ALL ON FUNCTION public.enforce_sighting_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sightings_before_write ON public.sightings;

CREATE TRIGGER sightings_before_write
  BEFORE INSERT OR UPDATE ON public.sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sighting_write();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sighting-photos',
  'sighting-photos',
  false,
  5242880,
  ARRAY['image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can read sighting photos" ON storage.objects;

CREATE POLICY "Admins can read sighting photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sighting-photos'
  AND public.is_current_user_admin()
);

NOTIFY pgrst, 'reload schema';
