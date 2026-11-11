-- Owner delete (and photo replace) failed because trg_delete_report_photo_objects
-- does DELETE FROM storage.objects, and live storage.protect_delete() blocks
-- that unless storage.allow_delete_query is true. Set it for this transaction
-- so the listing can be removed and the file cleaned up. Paste in the
-- production SQL Editor. Not applied by this change.

CREATE OR REPLACE FUNCTION public.delete_report_photo_objects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage, public
AS $delete_report_photo_objects$
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

  BEGIN
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects
    WHERE bucket_id = 'report-photos'
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
$delete_report_photo_objects$;

REVOKE ALL ON FUNCTION public.delete_report_photo_objects() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
