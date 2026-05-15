-- Phase 3.1E-B: Align notification_events READ access to auth.uid()
-- INSERT policies are intentionally unchanged.

-- Remove existing SELECT/UPDATE policies on notification_events (names vary by environment).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_events'
      AND cmd IN ('SELECT', 'UPDATE')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.notification_events',
      pol.policyname
    );
  END LOOP;
END $$;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read only their own notification rows.
CREATE POLICY notification_events_select_own_uid
ON public.notification_events
FOR SELECT
TO authenticated
USING (auth.uid() = target_user_id);

-- Authenticated users may update (e.g. mark read) only their own rows.
CREATE POLICY notification_events_update_own_uid
ON public.notification_events
FOR UPDATE
TO authenticated
USING (auth.uid() = target_user_id)
WITH CHECK (auth.uid() = target_user_id);
