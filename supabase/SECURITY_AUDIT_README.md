# Read-only security audit

`security-audit.sql` inspects the live database configuration. It does not change data, policies, functions, or RLS. Run it yourself in the Supabase SQL Editor and share the result grids. Do not paste service-role keys, user rows, or storage object paths into the review.

## Who should run it

Run it as a project owner in **Supabase Dashboard → SQL Editor**.

The editor connects as a database role that can read system catalogs. That role bypasses row-level security, so the results describe configuration. They are not a test of what the `anon` key can read.

Do not run the script from the application, from `psql` with the service-role connection string, or after granting yourself extra privileges. If a section fails because a catalog is not visible, copy the error and leave that section incomplete.

## How to run it

The SQL Editor often shows only one result grid. Run **one numbered section at a time**:

1. Open `supabase/security-audit.sql`.
2. Copy a single section, from its `-- N.` comment through the semicolon that ends that `SELECT`.
3. Paste it into the SQL Editor and run it.
4. Label the result with the section number before you copy it out.

There are 30 independent `SELECT` statements: `0`, `1`, `2`, `3a`–`3d`, `4`, `5`, `6`, `7a`–`7c`, `8a`–`8d`, `9a`–`9b`, and `10a`–`10k`.

Do not wrap the script in `BEGIN` or `COMMIT` inside the editor unless you are only adding `BEGIN READ ONLY;` yourself and you still run one section. The file does not open a transaction.

## How to export the results

Use the result panel's copy or download control. If the grid is wide, download CSV rather than copying a truncated preview.

Before sharing:

- Check that no email address, JWT, access token, or file path appears. Sections 2, 4, 5, 10c, 10e, and 10i redact email-shaped and JWT-shaped text in SQL definitions. Redaction is pattern-based. Read function and view text once before sending it.
- Do not add screenshots of the Storage file browser or the Authentication user list.
- If section 7b errors, send section 7a and the error text. Do not alter `storage.buckets` to match the query.

## What to send for review

Send every section that returns rows, plus any section that returns an error. Empty result grids matter too: say which section returned zero rows.

Most useful for a Phase 0 review:

| Section | Why it matters |
| --- | --- |
| 0 | Confirms which role executed the script |
| 1 | RLS on `reports`, `sightings`, `reports_flags`, `profiles`, `notification_events`, `push_subscriptions`, and any other application table |
| 2 | Every policy, including `storage` |
| 3a, 3b, 3c | Grants versus privileges for `anon`, `authenticated`, `service_role`, and `PUBLIC` |
| 4 | Views that might project coordinates or private report columns |
| 5 | `SECURITY DEFINER` functions and who can execute them |
| 6 | Triggers that change status, send notifications, or clean up rows |
| 7a–7c, 10h, 10i | `report-photos` and other buckets, and storage policies |
| 9a, 9b | Foreign keys, delete behavior, and columns that look like unenforced references |
| 10a–10k | Short findings list; read the `finding` column with the matching earlier section |

Sections 8a–8d are supporting context: extensions, `pgcrypto`, PostGIS, and elevated roles.

## What the script cannot see

- **API exposure is a hint.** Section 0 reads `pgrst.db_schemas` only if that setting exists in the database. Supabase often keeps the exposed-schema list in the API service. Section 1's `api_exposure_hint` means a privilege exists in a schema that is commonly exposed. Confirm the Dashboard API settings separately.
- **Grants are not row access.** `has_table_privilege` and `has_function_privilege` ignore RLS. A `can_select` value of true means the role has the privilege. A policy can still return zero rows. `service_role` is expected to bypass RLS.
- **`PUBLIC` is not a role.** Sections 3a, 3c, 3d, and 10d list ACL entries whose grantee is `PUBLIC` (grantee 0). Section 3b cannot call `has_table_privilege` on `PUBLIC`. Privileges granted to `PUBLIC` already show up as true for `anon` and `authenticated` in 3b and 3c.
- **Column-level grants are not listed separately.** Table privilege checks can be true because of a column grant.
- **No application rows.** The script never selects from `reports`, `sightings`, `profiles`, `notification_events`, `push_subscriptions`, `auth.users`, or `storage.objects`. It cannot show orphaned rows, only missing foreign-key definitions (section 9b, which is a heuristic).
- **No uploaded files.** Bucket configuration and `storage.objects` policies are included. Object names and paths are not.
- **Edge Functions are outside Postgres.** `verify-captcha`, `smooth-processor` / `submit-sighting`, `flag-report`, and `send-push-on-notification` do not appear here. Webhook attachments and function secrets are not in these catalogs.
- **Auth settings are outside this script.** Providers, email templates, and leaked-password protection are Dashboard settings, not rows this file reads.
- **Function bodies are partial.** Section 5 prints definitions for `public`, `storage`, and functions whose names match report, sighting, flag, admin, profile, notification, or push. Other schemas are signatures only. Secret redaction looks for JWT-shaped strings, email-shaped strings, and a quoted assignment after words such as `secret` or `api_key`. It can miss a secret that does not match those shapes, and it can redact a harmless string that does.
- **Section 10 is a filter, not a verdict.** `10b` (RLS on, zero policies) is default deny, not open access. `10c` and `10i` flag only a permissive expression that is literally `true`. A missing `WITH CHECK` is not flagged, because Postgres copies `USING` when `WITH CHECK` is omitted. `10f` and `10g` are review items. `10g` is limited to `public`, `storage`, and `graphql_public`.
- **Storage column names can differ.** Section 7b expects `id`, `name`, `public`, `file_size_limit`, `allowed_mime_types`, and `avif_autodetection`. If a column is absent, keep the error.
- **Catalog errors stop that section only.** Do not grant privileges, disable RLS, or create a helper function to get past an error.

## Check performed before sharing this file

The file was parsed as 30 `SELECT` statements. It contains no `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `GRANT`, or `TRUNCATE` statement. It was not executed against the live project.
