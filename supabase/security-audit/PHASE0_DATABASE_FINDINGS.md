# Lost Pets Map — live database findings for Phase 0

Upload this file to the external review. Do not upload `Supabase Snippet phase 6.csv`. That export contains the live `x-webhook-secret` value embedded in the `PUSH_WEBHOOK` trigger definition. Rotate that secret before sharing the CSV. The value is intentionally omitted here.

Evidence is the SQL Editor output saved in `supabase/security-audit/`, run as `postgres` on Postgres 17.6. `row_security` was on. `postgres` and `service_role` bypass RLS. `anon` and `authenticated` do not, and neither can log in directly. PostgREST schema settings were not stored in the database (`pgrst.db_schemas` and `pgrst.db_extra_search_path` were null), so API exposure below is inferred from grants plus Supabase's usual exposed schemas (`public`, `storage`, `graphql_public`).

Sections 3a and 3d stopped at the editor's 100-row cap. Section 9a (foreign keys, unique constraints, check constraints) was not included. There is no application view of `reports`, `sightings`, or `profiles`. There are no functions in the `public` schema. Edge Function source is outside this evidence.

## Confirmed

RLS is enabled and not forced on every application table: `reports`, `sightings`, `reports_flags`, `profiles`, `notification_events`, `push_subscriptions`, and `submission_logs`. Owner is `postgres`. `reports` and `notification_events` are in the `supabase_realtime` publication. No other application tables are.

Grants are broad. `anon`, `authenticated`, and `service_role` each have `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`, and `MAINTAIN` on the public application tables. `anon` and `authenticated` also have `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `storage.buckets` and `storage.objects`. Schema `CREATE` is not granted. `PUBLIC` has `USAGE` on `public`. These grants do not by themselves reveal rows: RLS still applies to `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. `TRUNCATE` is not governed by RLS, but `anon` and `authenticated` are not login roles and PostgREST does not expose `TRUNCATE`.

Effective policies on the Data API:

- `reports` `SELECT` for `public` (anon and authenticated): `status` is `active` or `resolved`. The policy does not hide columns. There is no admin policy, so an administrator using the user JWT cannot read `flagged`, `removed`, or `expired` rows.
- `reports` `INSERT` for `authenticated`: `owner_user_id` must equal `auth.uid()`. No check on status, coordinates, or other columns. No trigger corrects them. A signed-in user can insert a report directly and bypass the captcha Edge Function. `anon` has no passing insert policy.
- `reports` `UPDATE` and `DELETE` for `authenticated`: caller must already be `owner_user_id`, and an update must leave `owner_user_id` as `auth.uid()`. The owner can change every other column, including `status`. No admin write policy exists.
- `sightings` `SELECT` for `public`: `status = 'approved'`, twice, under two policy names. Pending rows are not visible to anon or authenticated. The policy returns the whole approved row, with no coordinate redaction.
- `sightings` `INSERT` for `anon` and `authenticated`: `WITH CHECK (true)`. There is no trigger on `sightings`. A caller can insert any column value the table accepts, including `status = 'approved'`.
- `sightings` `ALL` for `authenticated`: allowed when the caller's own `profiles` row has `is_admin = true`. This is the only admin policy in the database.
- `reports_flags` `INSERT` for `public`: `reason` is not null and longer than 3 characters. No authentication, report ownership, or rate check. There is no `SELECT`, `UPDATE`, or `DELETE` policy, so flags cannot be read or moderated through the user JWT, including by an administrator.
- `profiles`: one policy, `SELECT` for `authenticated` where `id = auth.uid()`. A user can read their own `is_admin` value. There is no insert, update, or delete policy, so a user cannot change `is_admin` through RLS.
- `notification_events`: `SELECT` and `UPDATE` only where `target_user_id = auth.uid()`. `INSERT` for `authenticated` is `WITH CHECK (true)`, so a signed-in user can create a row for any target. No delete policy.
- `push_subscriptions`: authenticated users can select, insert, update, and delete only their own `user_id`.
- `submission_logs`: `anon` may insert any row (`WITH CHECK (true)`) and is denied select (`USING (false)`). No authenticated policy, so signed-in users are denied. No trigger documents what this table is for.

`report-photos` is the only bucket. It is public, limited to 5,242,880 bytes, with allowed MIME types `["image/*"]`. Those limits are bucket settings. RLS is separate and permissive policies are OR-ed:

- Anon can insert into `storage.objects` when `bucket_id = 'report-photos'`, with no path, owner, or MIME check in that policy.
- A second insert policy also allows anon and authenticated when the bucket matches and `length(name) > 5`. It does not tighten the first policy.
- Anon, and anon plus authenticated, can select every object in that bucket.
- There is no update or delete policy. User deletes are denied by RLS. `service_role` bypasses RLS.

No trigger exists on `reports`, `sightings`, `reports_flags`, `profiles`, or `push_subscriptions`. Nothing in the database approves sightings, flags reports, expires reports, cleans storage, or writes moderation history. The only application trigger is `PUSH_WEBHOOK`, an enabled after-insert row trigger on `notification_events`. It calls `supabase_functions.http_request` to `send-push-on-notification` and sends `x-webhook-secret`.

`profiles.is_admin` is not writable by `anon` or `authenticated`. `pgcrypto` is installed in `extensions`. PostGIS is not installed. No `public` function is `SECURITY DEFINER`. The seven `SECURITY DEFINER` functions found are platform functions, and each has a fixed `search_path`. Views in `public`, `storage`, and `graphql_public` did not lack `security_invoker` (section 10f returned no rows). The only views returned were `extensions.pg_stat_statements`, `extensions.pg_stat_statements_info`, and `vault.decrypted_secrets`.

## Not confirmed by these files

- Whether `sightings.lost_report_id`, flag rows, or push subscriptions have foreign keys, and what `ON DELETE` does. Section 9a is missing. Section 9b only reports two columns with no foreign key: `reports.owner_user_id` and `notification_events.target_user_id`. That is a heuristic, not a full constraint list.
- Column names and types, other than those two. Row policies do not remove columns, but this export cannot prove which coordinate or contact columns exist.
- Whether the push function ignores unexpected notification types. The database will insert the row and fire the trigger either way.
- Whether `supabase_functions` is on the Data API allow-list. `supabase_functions.http_request` is `SECURITY DEFINER`, executable by `anon` and `authenticated`, with `search_path` fixed to `supabase_functions`. It is not in `public`.
- Storage object paths, file contents, and whether the Storage API enforces the bucket MIME and size limits on every upload path.
- Edge Function behavior: captcha, service-role writes, IP hashing, and photo checks.

## Review priorities

1. Stop anonymous and authenticated clients from inserting an already-approved sighting. The insert policy is `true`, and no trigger overrides `status`.
2. Decide whether direct report inserts should exist. Authenticated clients can insert `reports` with any status as long as `owner_user_id` is themselves.
3. Add administrator policies, or stop using the user JWT for moderation. Today an admin can manage `sightings` only. The admin cannot read non-public reports or any flag rows.
4. Replace `notification_events` insert-for-anyone. It lets any signed-in user create a row and invoke the push webhook.
5. Replace the `report-photos` policies. The public bucket plus the weaker anon insert policy allows an upload that RLS does not bind to a user, a report, or a MIME type. The 5 MB and `image/*` settings live only on the bucket.
6. Restrict `reports_flags` inserts. The current check is only that `reason` is longer than 3 characters.
7. Rotate the webhook secret that was exported in the phase 6 CSV, and keep later trigger definitions out of the review transcript.
