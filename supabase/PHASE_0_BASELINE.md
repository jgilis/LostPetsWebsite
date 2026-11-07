# Phase 0 migration baseline

Inspection only. The live database was not queried, linked, or changed for this note. Policy facts come from the SQL Editor export in `supabase/security-audit/`. Repository facts come from the files on `main`.

## Verdict

The repository does not have a reliable migration history for production. It has two incremental SQL files. They do not create or describe most of the live schema. They must not be replayed with `supabase db push` until `supabase_migrations.schema_migrations` is read and those versions are marked applied if the objects already exist.

Phase 0 SQL should be new forward migrations, written against a reviewed schema dump, not against these two files as if they were the database.

## What the repository actually tracks

Committed under `supabase/`:

| Path | What it is |
| --- | --- |
| `migrations/20260515120000_notification_events_auth_uid_read.sql` | Drops every existing `SELECT` and `UPDATE` policy on `notification_events`, enables RLS, then creates `notification_events_select_own_uid` and `notification_events_update_own_uid`. It does not create the table and does not touch the insert policy. |
| `migrations/20260515140000_push_subscriptions.sql` | Creates `push_subscriptions` if missing, enables RLS, and creates four owner policies. `CREATE POLICY` has no `IF NOT EXISTS`. |
| `config.toml` | Registers only `verify-captcha` (`verify_jwt = true`) and `send-push-on-notification` (`verify_jwt = false`). |
| `functions/verify-captcha/` | Service-role insert into `reports`. |
| `functions/send-push-on-notification/` | Service-role read and delete on `push_subscriptions`. |

Present locally, not in `config.toml`, and not a migration:

- `functions/flag-report/` writes `reports_flags` and `reports` with the service role.
- `functions/submit-sighting/submit-sighting.ts` writes `sightings` with the service role. The deployed name used by the app is still `smooth-processor`. This file is not an `index.ts` entrypoint.

Git history for `supabase/` starts at the initial MVP with `verify-captcha` only. The notification migration arrived in `85a7273`. The push-subscription migration arrived in `90481d2`. No commit has ever contained `CREATE TABLE` for `reports`, `sightings`, `reports_flags`, `profiles`, `notification_events`, or `submission_logs`. There is no seed file and no schema dump.

`supabase/.temp/linked-project.json` records a previous link to project `lost-pets-map` (`dmubikdkyusadzqngapy`). That file is CLI metadata, not a schema version. `.temp/cli-latest` contains `v2.98.2`, which is a version stamp, not an installed binary.

The `supabase` CLI is not on `PATH`. Nothing was installed, logged in, or linked for this inspection.

## What matches production

These live policies have the same names and expressions as the two migration files:

- `notification_events_select_own_uid`
- `notification_events_update_own_uid`
- `push_subscriptions_select_own`
- `push_subscriptions_insert_own`
- `push_subscriptions_update_own`
- `push_subscriptions_delete_own`

`push_subscriptions.user_id` was not in the “column has no foreign key” result, which is consistent with the migration’s reference to `auth.users`, but the foreign-key definitions themselves were not exported (section 9a is missing).

## What production has that no migration represents

Tables with RLS enabled, not forced, owned by `postgres`:

- `reports`
- `sightings`
- `reports_flags`
- `profiles`
- `notification_events` (the table itself)
- `push_subscriptions` (policies only are in git; column list was not re-exported)
- `submission_logs` (no reference in application code)

Policies that must keep working until a named migration replaces them:

| Table | Policy | Live rule |
| --- | --- | --- |
| `reports` | `Public can view active and resolved reports` | `public` `SELECT` where status is `active` or `resolved` |
| `reports` | `Authenticated users can create reports` | `authenticated` `INSERT` when `owner_user_id = auth.uid()` |
| `reports` | `Owners can update their reports` | `authenticated` `UPDATE` when `owner_user_id = auth.uid()` |
| `reports` | `Owners can delete their reports` | `authenticated` `DELETE` when `owner_user_id = auth.uid()` |
| `sightings` | `Public can view approved sightings` and `public can view approved sightings` | Two identical `public` `SELECT` policies, `status = 'approved'` |
| `sightings` | `Anyone can insert sightings` | `anon`, `authenticated` `INSERT` with `WITH CHECK (true)` |
| `sightings` | `Admins can manage sightings (new)` | `authenticated` `ALL` when the caller’s own `profiles.is_admin` is true |
| `reports_flags` | `allow insert flags` | `public` `INSERT` when `reason` is longer than 3 characters |
| `profiles` | `Users can read own profile` | `authenticated` `SELECT` where `id = auth.uid()` |
| `notification_events` | `allow inserts from authenticated users` | `authenticated` `INSERT` with `WITH CHECK (true)` |
| `submission_logs` | `Allow insert for all` | `anon` `INSERT` with `WITH CHECK (true)` |
| `submission_logs` | `Block select for anon` | `anon` `SELECT` with `USING (false)` |
| `storage.objects` | `Allow image uploads xo88xm_0` | `anon` `INSERT` when `bucket_id = 'report-photos'` |
| `storage.objects` | `Allow uploads to report-photos` | `anon`, `authenticated` `INSERT` when the bucket matches and `length(name) > 5` |
| `storage.objects` | `Allow public image read xo88xm_0` | `anon` `SELECT` for that bucket |
| `storage.objects` | `View report photos` | `anon`, `authenticated` `SELECT` for that bucket |

Also absent from git, and not safe to drop or recreate from memory:

- Bucket `report-photos`: public, 5,242,880 bytes, allowed MIME types `["image/*"]`.
- Publication membership: `reports` and `notification_events` are in `supabase_realtime`.
- Trigger `PUSH_WEBHOOK` on `notification_events` (after insert, enabled). Its definition contains the live webhook secret. Do not copy that statement into git. Do not upload `Supabase Snippet phase 6.csv`.
- Broad table grants for `anon`, `authenticated`, and `service_role`, including `TRUNCATE`. RLS, not those grants, is what limits the Data API today.
- Default privileges in `public` that grant the same rights to future tables. Section 3d was truncated at 100 rows, so this list is incomplete.
- No `public` functions, no triggers on `reports`, `sightings`, `reports_flags`, `profiles`, or `push_subscriptions`, and no PostGIS. A later migration must not assume those objects exist.

There is no administrator policy on `reports`, `reports_flags`, or `profiles`. The admin screens use the user JWT. That is current behavior. A baseline dump should record it, not invent an admin policy.

## Application paths the current policies support

Service-role Edge Functions bypass RLS. Changing policies does not change those writes. Changing grants for `service_role` would.

User and anon calls that depend on the policies above:

- Public report reads: `src/lib/reports.ts`, `src/components/report/useReports.ts`.
- Owner report delete: `app/edit/EditContent.tsx`, `app/report/[id]/ReportDetailClient.tsx`.
- Admin report status updates and flag reads: `src/lib/reports.ts`. These use the user client. Live RLS does not grant an admin an extra read or write on `reports` or `reports_flags`.
- Sighting reads and admin status updates: `src/lib/sightings.ts`. Public reads succeed only for `approved` because of RLS, not because the query filters `status`. Admin updates succeed only through `Admins can manage sightings (new)`.
- Notification reads, mark-read, and the insert from `src/lib/sightings.ts` into `notification_events`.
- Push subscription read, upsert, and delete: `src/lib/pushNotifications.ts`.
- Profile admin check: `src/lib/profileAdminCache.ts` selects `is_admin` on the caller’s own row.
- Photo upload and public display: `src/components/report/ReportForm.tsx` uploads to bucket `report-photos` before captcha verification.

`submission_logs` has no application caller. Keep the table and both policies until someone confirms it is unused in the dashboard as well.

## Why the existing files are not a baseline

`supabase db push` applies files that are missing from `supabase_migrations.schema_migrations`. That table was not part of the audit, so it is unknown whether production has `20260515120000` and `20260515140000` recorded.

If they are not recorded and the objects already exist:

- The notification file drops and recreates the select and update policies. The open insert policy survives only because the script ignores `INSERT`.
- The push-subscription file creates policies without `IF NOT EXISTS`. A second run fails. Supabase wraps a migration in a transaction, so the failure should roll back, but it is still the wrong tool.

`supabase db pull` or `db diff` against this history will treat almost the entire production schema as new. A generated migration can emit drops for objects the local files do not know about. Do not apply a generated diff to production without reading every statement.

`supabase db reset` would destroy the project. Do not run it against the linked remote.

## Recommended sequence

Do these in order. Stop after step 2 until the dump has been read.

1. Install the Supabase CLI locally when you want to. Do not log in or link until you explicitly ask for that. The project ref is already recorded in `supabase/.temp/linked-project.json`.
2. In the SQL Editor, read only:
   ```sql
   SELECT version, name, inserted_at
   FROM supabase_migrations.schema_migrations
   ORDER BY version;
   ```
   Compare that list with the two filenames. Do not repair or push from the result until it has been reviewed.
3. Produce a schema-only dump of `public` and of the `storage.objects` policies and `report-photos` bucket definition. Review it in git before it is called a migration. Redact the `PUSH_WEBHOOK` secret. Prefer `pg_get_triggerdef` omitted, or replace the secret with a placeholder, so the secret is not committed.
4. If the two existing versions are absent from `schema_migrations`, mark them applied with `supabase migration repair --status applied` for those versions. Do not execute them. If they are already listed, leave them.
5. Add one baseline migration whose timestamp is after `20260515140000`, containing the reviewed dump, and mark that version applied on production without running it there. Running it on production would try to create tables and policies that already exist.
6. Use that committed baseline as the schema new environments are built from. Use a separate empty Supabase project for the first apply. This production project is the only database described in the repo.
7. Implement Phase 0 as further migrations after the baseline. Each one should name the policy it replaces, use `DROP POLICY IF EXISTS` only for that name, and create the replacement in the same transaction. Do not combine that with `DROP TABLE`, a grant rewrite, a bucket visibility change, or a trigger recreate.
8. Coordinate each behavior change with the caller that depends on it. In particular, making `report-photos` private breaks current image URLs until the app stops using the public object URL. Tightening sighting inserts does not affect `submit-sighting` while it uses the service role. Removing `Anyone can insert sightings` without a replacement is what stops a client from inserting `status = 'approved'`.

## Still unknown before the first Phase 0 migration

- Rows in `supabase_migrations.schema_migrations`.
- Full column lists, check constraints, and foreign keys (section 9a was not saved). `reports.owner_user_id` and `notification_events.target_user_id` have no foreign key. Other `*_id` columns were not flagged.
- Whether `lost_report_id` is the real sighting column name. It did not appear as a keyless `*_id` column.
- The Data API schema allow-list. `pgrst.db_schemas` was null in the database.
- Deployed Edge Function source versus the files now in the repo, including the live name `smooth-processor`.
