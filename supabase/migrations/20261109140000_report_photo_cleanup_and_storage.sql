-- Package B: report photo cleanup and storage policy tightening.
-- Does not change reports/flags RLS from Package A, sighting security,
-- or the public flag on the report-photos bucket.
-- Apply after the matching frontend and verify-captcha are deployed:
-- the new function uploads with the service role, and the form no longer
-- uploads before CAPTCHA.

-- Remove client insert paths. Public read stays so existing photo URLs work.
DROP POLICY IF EXISTS "Allow image uploads xo88xm_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to report-photos" ON storage.objects;

CREATE OR REPLACE FUNCTION public.delete_report_photo_objects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage, public
AS $$
DECLARE
  photo_url text;
  object_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    photo_url := OLD.photo_url;
  ELSIF TG_OP = 'UPDATE' AND OLD.photo_url IS DISTINCT FROM NEW.photo_url THEN
    photo_url := OLD.photo_url;
  ELSE
    RETURN NEW;
  END IF;

  IF photo_url IS NULL OR photo_url = '' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  object_name := substring(photo_url FROM 'report-photos/([^?#]+)');
  IF object_name IS NULL OR object_name = '' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'report-photos'
    AND name = object_name;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_report_photo_objects() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_delete_report_photo_objects ON public.reports;
CREATE TRIGGER trg_delete_report_photo_objects
  AFTER DELETE OR UPDATE OF photo_url ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_report_photo_objects();

NOTIFY pgrst, 'reload schema';
