-- Drop listable SELECT policies on the public report-photos bucket.
-- Production already has the Package B INSERT policy drops, cleanup
-- function, and trg_delete_report_photo_objects. Do not recreate those.
--
-- Public object URLs keep working because storage.buckets.public stays true.
-- Soft-delete (status = 'removed') is unchanged: the cleanup trigger fires
-- only on row DELETE or photo_url change, not on status updates.

DROP POLICY IF EXISTS "Allow public image read xo88xm_0" ON storage.objects;
DROP POLICY IF EXISTS "View report photos" ON storage.objects;
