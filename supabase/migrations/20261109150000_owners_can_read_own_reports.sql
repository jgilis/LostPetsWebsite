-- Optional Package C follow-up.
-- Public SELECT still covers active and resolved reports. This adds an
-- authenticated owner SELECT so a signed-in owner can load their own
-- flagged, hidden, or expired row on /edit. It does not let owners read
-- another user's reports.
--
-- Apply in the SQL Editor after the matching frontend. Do not use db push.

DROP POLICY IF EXISTS "Owners can read their reports" ON public.reports;

CREATE POLICY "Owners can read their reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());
