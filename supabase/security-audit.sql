-- Lost Pets Map — read-only security audit
-- Run in Supabase Dashboard → SQL Editor, one numbered section at a time.
--
-- SAFETY
--   Every statement is a SELECT. This file does not insert, update, delete,
--   truncate, create, alter, drop, grant, or change RLS.
--   It reads PostgreSQL catalogs and Supabase metadata only.
--   It does not read rows from reports, sightings, profiles, notifications,
--   auth.users, or storage.objects.
--
-- If a section errors because a catalog or column is not visible, stop that
-- section and keep the error message. Do not grant extra privileges to make
-- it succeed.
--
-- The SQL Editor role bypasses RLS. These results describe configuration.
-- They are not a test of what the anon key can read.

-- =============================================================================
-- 0. Session context
-- Who is running the script, which database, and which Postgres version.
-- Role name only. No connection strings.
-- =============================================================================

SELECT
  current_user AS executing_role,
  current_database() AS database_name,
  current_setting('server_version') AS postgres_version,
  current_setting('row_security') AS row_security_setting,
  current_setting('pgrst.db_schemas', true) AS pgrst_db_schemas_if_set,
  current_setting('pgrst.db_extra_search_path', true) AS pgrst_extra_search_path_if_set;

-- =============================================================================
-- 1. Relations and RLS
-- Ordinary tables, partitioned tables, views, materialized views, and
-- foreign tables outside PostgreSQL's own schemas.
-- api_exposure_hint is not proof of PostgREST exposure. Confirm the
-- Dashboard API schema list. Null pgrst settings in section 0 are normal
-- when that list lives only in the API service.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'f' THEN 'foreign table'
    ELSE c.relkind::text
  END AS relation_kind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  pg_get_userbyid(c.relowner) AS owner_role,
  EXISTS (
    SELECT 1
    FROM pg_publication_tables AS publication
    WHERE publication.pubname = 'supabase_realtime'
      AND publication.schemaname = n.nspname
      AND publication.tablename = c.relname
  ) AS in_supabase_realtime_publication,
  CASE
    WHEN c.relkind NOT IN ('r', 'p', 'v', 'm', 'f') THEN 'not applicable'
    WHEN n.nspname IN ('public', 'storage', 'graphql_public')
      AND (
        has_table_privilege('anon', c.oid, 'SELECT')
        OR has_table_privilege('anon', c.oid, 'INSERT')
        OR has_table_privilege('anon', c.oid, 'UPDATE')
        OR has_table_privilege('anon', c.oid, 'DELETE')
        OR has_table_privilege('authenticated', c.oid, 'SELECT')
        OR has_table_privilege('authenticated', c.oid, 'INSERT')
        OR has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE')
      )
      THEN 'privilege granted to anon or authenticated in a schema Supabase often exposes; confirm the API schema list'
    ELSE 'no anon/authenticated DML or select grant, or schema is not a default API schema'
  END AS api_exposure_hint
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
ORDER BY n.nspname, c.relname;

-- =============================================================================
-- 2. All RLS policies
-- Every policy the catalogs can see, in every non-system schema.
-- Expressions are redacted only for email-shaped and JWT-shaped text.
-- =============================================================================

SELECT
  policy.schemaname AS schema_name,
  policy.tablename AS table_name,
  policy.policyname AS policy_name,
  policy.permissive AS permissive_or_restrictive,
  policy.roles::text AS permitted_roles,
  policy.cmd AS command,
  regexp_replace(
    regexp_replace(
      COALESCE(policy.qual, ''),
      'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}',
      '[REDACTED_JWT]',
      'g'
    ),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS using_expression,
  regexp_replace(
    regexp_replace(
      COALESCE(policy.with_check, ''),
      'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}',
      '[REDACTED_JWT]',
      'g'
    ),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS with_check_expression
FROM pg_policies AS policy
WHERE policy.schemaname NOT IN ('pg_catalog', 'information_schema')
  AND policy.schemaname NOT LIKE 'pg\_temp%' ESCAPE '\'
ORDER BY policy.schemaname, policy.tablename, policy.policyname;

-- =============================================================================
-- 3a. Explicit table ACL entries
-- Grants recorded on the relation ACL for anon, authenticated, service_role,
-- and PUBLIC (grantee 0).
-- A null relation ACL means no explicit grant is stored. For tables, Postgres
-- then leaves DML with the owner. It does not by itself grant DML to PUBLIC.
-- This list is not effective row access. RLS can still deny every row.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'f' THEN 'foreign table'
    ELSE c.relkind::text
  END AS relation_kind,
  CASE
    WHEN c.relacl IS NULL THEN 'no explicit ACL stored'
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN LATERAL aclexplode(c.relacl) AS acl ON true
WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
  AND (
    c.relacl IS NULL
    OR acl.grantee = 0
    OR acl.grantee IN (
      SELECT role_row.oid
      FROM pg_roles AS role_row
      WHERE role_row.rolname IN ('anon', 'authenticated', 'service_role')
    )
  )
ORDER BY n.nspname, c.relname, grantee, acl.privilege_type;

-- =============================================================================
-- 3b. Effective table privileges
-- has_table_privilege includes grants inherited through PUBLIC and membership.
-- It still ignores RLS. can_select = true does not mean a row is visible.
-- Limited to public and storage so the result stays reviewable.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  role_row.rolname AS role_name,
  has_table_privilege(role_row.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(role_row.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(role_row.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(role_row.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(role_row.oid, c.oid, 'TRUNCATE') AS can_truncate,
  has_table_privilege(role_row.oid, c.oid, 'REFERENCES') AS can_references,
  has_table_privilege(role_row.oid, c.oid, 'TRIGGER') AS can_trigger,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
CROSS JOIN pg_roles AS role_row
WHERE c.relkind IN ('r', 'p', 'v', 'm')
  AND n.nspname IN ('public', 'storage')
  AND role_row.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY n.nspname, c.relname, role_row.rolname;

-- =============================================================================
-- 3c. Schema privileges
-- USAGE lets a role see objects it is also granted. CREATE lets it add objects.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  CASE
    WHEN n.nspacl IS NULL THEN 'no explicit schema ACL stored'
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  acl.privilege_type,
  acl.is_grantable,
  has_schema_privilege('anon', n.oid, 'USAGE') AS anon_can_use,
  has_schema_privilege('anon', n.oid, 'CREATE') AS anon_can_create,
  has_schema_privilege('authenticated', n.oid, 'USAGE') AS authenticated_can_use,
  has_schema_privilege('authenticated', n.oid, 'CREATE') AS authenticated_can_create,
  has_schema_privilege('service_role', n.oid, 'USAGE') AS service_role_can_use,
  has_schema_privilege('service_role', n.oid, 'CREATE') AS service_role_can_create
FROM pg_namespace AS n
LEFT JOIN LATERAL aclexplode(n.nspacl) AS acl ON true
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
  AND (
    n.nspacl IS NULL
    OR acl.grantee = 0
    OR acl.grantee IN (
      SELECT role_row.oid
      FROM pg_roles AS role_row
      WHERE role_row.rolname IN ('anon', 'authenticated', 'service_role')
    )
  )
ORDER BY n.nspname, grantee, acl.privilege_type;

-- =============================================================================
-- 3d. Default ACLs
-- Privileges that will be copied onto objects created later.
-- defaclrole is an owner role, not an end user.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  pg_get_userbyid(defacl.defaclrole) AS owner_role,
  defacl.defaclobjtype AS object_type_code,
  CASE
    WHEN acl.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_default_acl AS defacl
LEFT JOIN pg_namespace AS n ON n.oid = defacl.defaclnamespace
LEFT JOIN LATERAL aclexplode(defacl.defaclacl) AS acl ON true
WHERE acl.grantee = 0
  OR acl.grantee IN (
    SELECT role_row.oid
    FROM pg_roles AS role_row
    WHERE role_row.rolname IN ('anon', 'authenticated', 'service_role')
  )
  OR defacl.defaclacl IS NULL
ORDER BY n.nspname NULLS FIRST, owner_role, defacl.defaclobjtype, grantee;

-- =============================================================================
-- 4. Views and materialized views
-- Definitions can show which columns a view projects. They do not contain row
-- values. Email-shaped and JWT-shaped text is redacted.
-- security_invoker false means the view runs as its owner. A owner that
-- bypasses RLS can expose columns the caller could not read from the base table.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  CASE c.relkind
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    ELSE c.relkind::text
  END AS relation_kind,
  pg_get_userbyid(c.relowner) AS owner_role,
  EXISTS (
    SELECT 1
    FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) AS option_item
    WHERE option_item IN ('security_invoker=true', 'security_invoker=on')
  ) AS security_invoker,
  EXISTS (
    SELECT 1
    FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) AS option_item
    WHERE option_item IN ('security_barrier=true', 'security_barrier=on')
  ) AS security_barrier,
  COALESCE(c.reloptions, ARRAY[]::text[])::text AS relation_options,
  (
    position('report' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('sighting' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('profile' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('latitude' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('longitude' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('is_admin' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('contact_info' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('owner_user_id' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('edit_token' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('ip_hash' IN lower(pg_get_viewdef(c.oid, true))) > 0
    OR position('reporter_ip' IN lower(pg_get_viewdef(c.oid, true))) > 0
  ) AS definition_mentions_sensitive_column,
  regexp_replace(
    regexp_replace(
      pg_get_viewdef(c.oid, true),
      'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}',
      '[REDACTED_JWT]',
      'g'
    ),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS view_definition
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v', 'm')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
ORDER BY n.nspname, c.relname;

-- =============================================================================
-- 5. Functions and procedures
-- Full SQL text is included only for public, storage, and names that look
-- related to reports, sightings, flags, profiles, or notifications.
-- Other schemas are listed so unexpected helpers are visible, without dumping
-- extension or auth internals.
-- A null proacl means Postgres' default: EXECUTE is granted to PUBLIC.
-- search_path_config empty on a SECURITY DEFINER function is a review item
-- in section 10. It is not, by itself, proof of injection.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  CASE p.prokind
    WHEN 'f' THEN 'function'
    WHEN 'p' THEN 'procedure'
    WHEN 'a' THEN 'aggregate'
    WHEN 'w' THEN 'window'
    ELSE p.prokind::text
  END AS routine_kind,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
  pg_get_userbyid(p.proowner) AS owner_role,
  COALESCE(p.proconfig, ARRAY[]::text[])::text AS config_settings,
  EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config_item
    WHERE config_item LIKE 'search_path=%'
  ) AS search_path_is_set,
  p.proacl IS NULL AS uses_default_execute_acl,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute,
  (
    p.proacl IS NULL
    OR EXISTS (
      SELECT 1
      FROM aclexplode(p.proacl) AS function_acl
      WHERE function_acl.grantee = 0
        AND function_acl.privilege_type = 'EXECUTE'
    )
  ) AS public_execute_grant,
  CASE
    WHEN n.nspname IN ('public', 'storage')
      OR p.proname ~* '(report|sighting|flag|admin|profile|notification|push)'
      THEN regexp_replace(
        regexp_replace(
          regexp_replace(
            pg_get_functiondef(p.oid),
            'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}',
            '[REDACTED_JWT]',
            'g'
          ),
          '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
          '[REDACTED_EMAIL]',
          'g'
        ),
        '(secret|password|api[_-]?key|apikey|service[_-]?role|access[_-]?token|private[_-]?key)([^'']{0,40}'')[^'']*('')',
        '\1\2[REDACTED]\3',
        'gi'
      )
    ELSE NULL
  END AS function_definition,
  CASE
    WHEN n.nspname IN ('public', 'storage')
      OR p.proname ~* '(report|sighting|flag|admin|profile|notification|push)'
      THEN 'included, with email, JWT, and secret-assignment redaction'
    ELSE 'omitted because this is not an application schema; review the signature if the name is unexpected'
  END AS definition_visibility
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE p.prokind IN ('f', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
ORDER BY n.nspname, p.proname, identity_arguments;

-- =============================================================================
-- 6. Triggers
-- One statement. Copy from this SELECT through its semicolon only.
-- Do not include the SELECT that starts section 7a.
-- Non-internal triggers outside system schemas. trigger_definition is the
-- CREATE TRIGGER statement. Section 5 has the function body when that
-- function is in public or storage.
-- =============================================================================

SELECT
  trigger_row.schema_name,
  trigger_row.table_name,
  trigger_row.trigger_name,
  upper(
    substring(
      trigger_row.trigger_definition
      from 'CREATE (?:CONSTRAINT )?TRIGGER\s+\S+\s+(INSTEAD OF|BEFORE|AFTER)'
    )
  ) AS timing,
  CASE
    WHEN trigger_row.definition_prefix ~* 'FOR EACH ROW' THEN 'ROW'
    ELSE 'STATEMENT'
  END AS level,
  concat_ws(
    ', ',
    CASE WHEN trigger_row.definition_prefix ~* 'INSERT' THEN 'INSERT' END,
    CASE WHEN trigger_row.definition_prefix ~* 'DELETE' THEN 'DELETE' END,
    CASE WHEN trigger_row.definition_prefix ~* 'UPDATE' THEN 'UPDATE' END,
    CASE WHEN trigger_row.definition_prefix ~* 'TRUNCATE' THEN 'TRUNCATE' END
  ) AS events,
  trigger_row.trigger_definition,
  trigger_row.trigger_state,
  trigger_row.trigger_function_schema,
  trigger_row.trigger_function_name
FROM (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    pg_get_triggerdef(t.oid, true) AS trigger_definition,
    split_part(pg_get_triggerdef(t.oid, true), ' EXECUTE ', 1) AS definition_prefix,
    CASE t.tgenabled
      WHEN 'O' THEN 'enabled'
      WHEN 'D' THEN 'disabled'
      WHEN 'R' THEN 'replica only'
      WHEN 'A' THEN 'always'
      ELSE t.tgenabled::text
    END AS trigger_state,
    trigger_ns.nspname AS trigger_function_schema,
    trigger_fn.proname AS trigger_function_name
  FROM pg_trigger AS t
  JOIN pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  JOIN pg_proc AS trigger_fn ON trigger_fn.oid = t.tgfoid
  JOIN pg_namespace AS trigger_ns ON trigger_ns.oid = trigger_fn.pronamespace
  WHERE NOT t.tgisinternal
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND NOT starts_with(n.nspname, 'pg_temp')
    AND NOT starts_with(n.nspname, 'pg_toast')
) AS trigger_row
ORDER BY trigger_row.schema_name, trigger_row.table_name, trigger_row.trigger_name;

-- =============================================================================
-- 7a. Storage bucket columns
-- Column names only, so a later select can be checked if Storage's table
-- shape differs. No object rows.
-- =============================================================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage'
  AND table_name = 'buckets'
ORDER BY ordinal_position;

-- =============================================================================
-- 7b. Storage buckets
-- Configuration only. Owner identifiers are omitted. File names are not read.
-- If this select fails because a column is absent, keep the error and use 7a.
-- Do not change the table to match the query.
-- =============================================================================

SELECT
  bucket.id AS bucket_id,
  bucket.name AS bucket_name,
  bucket.public AS is_public,
  bucket.file_size_limit,
  bucket.allowed_mime_types,
  bucket.avif_autodetection
FROM storage.buckets AS bucket
ORDER BY bucket.name;

-- =============================================================================
-- 7c. Storage privileges
-- Same meaning as section 3b, restricted to storage.buckets and storage.objects.
-- Row contents of storage.objects are intentionally not selected.
-- =============================================================================

SELECT
  c.relname AS relation_name,
  role_row.rolname AS role_name,
  has_table_privilege(role_row.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(role_row.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(role_row.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(role_row.oid, c.oid, 'DELETE') AS can_delete,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
CROSS JOIN pg_roles AS role_row
WHERE n.nspname = 'storage'
  AND c.relname IN ('buckets', 'objects')
  AND c.relkind IN ('r', 'p', 'v', 'm')
  AND role_row.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY c.relname, role_row.rolname;

-- =============================================================================
-- 8a. Extensions
-- =============================================================================

SELECT
  ext.extname AS extension_name,
  n.nspname AS extension_schema,
  ext.extversion AS extension_version
FROM pg_extension AS ext
JOIN pg_namespace AS n ON n.oid = ext.extnamespace
ORDER BY ext.extname;

-- =============================================================================
-- 8b. Availability of specific extensions
-- =============================================================================

SELECT
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') AS pgcrypto_installed,
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS postgis_installed,
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgjwt') AS pgjwt_installed,
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault') AS supabase_vault_installed;

-- =============================================================================
-- 8c. Infrastructure roles
-- Fixed role list. Attributes only. Password hashes are not in pg_roles and
-- are not queried.
-- service_role with rolbypassrls is expected on Supabase. anon and
-- authenticated with rolbypassrls or rolsuper is not expected.
-- =============================================================================

SELECT
  role_row.rolname AS role_name,
  role_row.rolsuper AS is_superuser,
  role_row.rolbypassrls AS bypasses_rls,
  role_row.rolcreaterole AS can_create_roles,
  role_row.rolcreatedb AS can_create_databases,
  role_row.rolcanlogin AS can_login,
  role_row.rolreplication AS can_replicate
FROM pg_roles AS role_row
WHERE role_row.rolname IN (
  'anon',
  'authenticated',
  'authenticator',
  'service_role',
  'postgres',
  'supabase_admin',
  'dashboard_user',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_realtime_admin',
  'supabase_read_only_user',
  'pgbouncer'
)
ORDER BY role_row.rolname;

-- =============================================================================
-- 8d. Unexpected elevated roles
-- Any non-pg_ role with superuser, bypass RLS, or create-role, outside the
-- infrastructure list above. Role names here are cluster roles, not people.
-- =============================================================================

SELECT
  role_row.rolname AS role_name,
  role_row.rolsuper AS is_superuser,
  role_row.rolbypassrls AS bypasses_rls,
  role_row.rolcreaterole AS can_create_roles,
  role_row.rolcanlogin AS can_login
FROM pg_roles AS role_row
WHERE role_row.rolname NOT LIKE 'pg\_%' ESCAPE '\'
  AND role_row.rolname NOT IN (
    'anon',
    'authenticated',
    'authenticator',
    'service_role',
    'postgres',
    'supabase_admin',
    'dashboard_user',
    'supabase_auth_admin',
    'supabase_storage_admin',
    'supabase_realtime_admin',
    'supabase_read_only_user',
    'pgbouncer'
  )
  AND (
    role_row.rolsuper
    OR role_row.rolbypassrls
    OR role_row.rolcreaterole
  )
ORDER BY role_row.rolname;

-- =============================================================================
-- 9a. Constraints in public and storage
-- Definitions only. on_delete is null for constraints that are not foreign keys.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  rel.relname AS table_name,
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'f' THEN 'foreign key'
    WHEN 'p' THEN 'primary key'
    WHEN 'u' THEN 'unique'
    WHEN 'c' THEN 'check'
    WHEN 'x' THEN 'exclusion'
    ELSE con.contype::text
  END AS constraint_type,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE NULL
  END AS on_delete,
  CASE con.confupdtype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE NULL
  END AS on_update,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_constraint AS con
JOIN pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_namespace AS n ON n.oid = rel.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND con.contype IN ('f', 'p', 'u', 'c', 'x')
ORDER BY n.nspname, rel.relname, con.contype, con.conname;

-- =============================================================================
-- 9b. Heuristic: id-like columns with no foreign key
-- This is not proof that a key is missing. Columns such as client-generated
-- ids and denormalized copies are legitimate. Confirm against the application.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  att.attname AS column_name,
  format_type(att.atttypid, att.atttypmod) AS data_type,
  'no foreign key found on this column; manual review only' AS finding
FROM pg_attribute AS att
JOIN pg_class AS c ON c.oid = att.attrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND att.attnum > 0
  AND NOT att.attisdropped
  AND (
    att.attname LIKE '%\_id' ESCAPE '\'
    OR att.attname IN ('owner_user_id', 'target_user_id')
  )
  AND att.attname <> 'id'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS con
    WHERE con.conrelid = c.oid
      AND con.contype = 'f'
      AND att.attnum = ANY (con.conkey)
  )
ORDER BY c.relname, att.attname;

-- =============================================================================
-- 10a. Confirmed shape: tables with RLS disabled
-- Views are excluded. A disabled flag here is a property of the table.
-- Whether anon can use the table still depends on grants in section 3.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  pg_get_userbyid(c.relowner) AS owner_role,
  'RLS disabled' AS finding
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND NOT c.relrowsecurity
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
ORDER BY n.nspname, c.relname;

-- =============================================================================
-- 10b. RLS enabled and no policies
-- For anon and authenticated this is default deny, unless the role bypasses
-- RLS or owns the table. It is not an open policy. Confirm that deny is intended.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  pg_get_userbyid(c.relowner) AS owner_role,
  c.relforcerowsecurity AS rls_forced,
  'RLS enabled with zero policies' AS finding
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND c.relrowsecurity
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    WHERE policy.polrelid = c.oid
  )
ORDER BY n.nspname, c.relname;

-- =============================================================================
-- 10c. Policies that are likely unrestricted
-- Potential risk, not a verdict. Only an expression that is literally true is
-- flagged. A missing WITH CHECK is not flagged: Postgres copies USING into
-- WITH CHECK when WITH CHECK is omitted, and pg_policies often leaves that
-- column null. Read section 2 before treating a row as open access.
-- =============================================================================

SELECT
  policy.schemaname AS schema_name,
  policy.tablename AS table_name,
  policy.policyname AS policy_name,
  policy.roles::text AS permitted_roles,
  policy.cmd AS command,
  regexp_replace(
    COALESCE(policy.qual, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS using_expression,
  regexp_replace(
    COALESCE(policy.with_check, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS with_check_expression,
  'permissive policy expression is true for a public API role' AS finding
FROM pg_policies AS policy
WHERE policy.permissive = 'PERMISSIVE'
  AND policy.roles && ARRAY['anon', 'authenticated', 'public']::name[]
  AND (
    (
      policy.cmd IN ('SELECT', 'UPDATE', 'DELETE', 'ALL')
      AND policy.qual ~* '^[[:space:]]*\(?[[:space:]]*true[[:space:]]*\)?[[:space:]]*$'
    )
    OR (
      policy.cmd IN ('INSERT', 'UPDATE', 'ALL')
      AND policy.with_check ~* '^[[:space:]]*\(?[[:space:]]*true[[:space:]]*\)?[[:space:]]*$'
    )
  )
ORDER BY policy.schemaname, policy.tablename, policy.policyname;

-- =============================================================================
-- 10d. PUBLIC grants on relations
-- Confirmed ACL entries whose grantee is PUBLIC. Review together with RLS.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  acl.privilege_type,
  acl.is_grantable,
  'PUBLIC grant on relation' AS finding
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN LATERAL aclexplode(c.relacl) AS acl ON acl.grantee = 0
WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname NOT LIKE 'pg\_toast%' ESCAPE '\'
ORDER BY n.nspname, c.relname, acl.privilege_type;

-- =============================================================================
-- 10e. profiles.is_admin policies
-- Potential risk. A policy that does not mention is_admin can still be safe.
-- An UPDATE or INSERT policy that does not constrain is_admin needs a human
-- to decide whether a user can change their own flag.
-- =============================================================================

SELECT
  policy.policyname AS policy_name,
  policy.roles::text AS permitted_roles,
  policy.cmd AS command,
  regexp_replace(
    COALESCE(policy.qual, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS using_expression,
  regexp_replace(
    COALESCE(policy.with_check, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS with_check_expression,
  (
    COALESCE(policy.qual, '') || ' ' || COALESCE(policy.with_check, '')
  ) ~* 'is_admin' AS expression_mentions_is_admin,
  'review whether this policy lets a non-admin read or write profiles.is_admin' AS finding
FROM pg_policies AS policy
WHERE policy.schemaname = 'public'
  AND policy.tablename = 'profiles'
ORDER BY policy.policyname;

-- =============================================================================
-- 10f. Views that do not set security_invoker
-- Potential risk on PostgreSQL 15 and newer. Default view execution uses the
-- view owner. If that owner bypasses RLS, callers may see the view's columns
-- even when base-table policies would hide them. Read view_definition in
-- section 4 before treating this as a leak.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS view_name,
  pg_get_userbyid(c.relowner) AS owner_role,
  'security_invoker is not enabled' AS finding
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname IN ('public', 'storage', 'graphql_public')
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) AS option_item
    WHERE option_item IN ('security_invoker=true', 'security_invoker=on')
  )
ORDER BY n.nspname, c.relname;

-- =============================================================================
-- 10g. SECURITY DEFINER functions without a fixed search_path
-- Potential risk. Limited to public, storage, and graphql_public so extension
-- functions do not bury the application result. Section 5 lists every other
-- routine's signature, owner, and security mode.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_userbyid(p.proowner) AS owner_role,
  p.proacl IS NULL AS uses_default_execute_acl,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  'SECURITY DEFINER without search_path in proconfig' AS finding
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE p.prosecdef
  AND p.prokind IN ('f', 'p')
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config_item
    WHERE config_item LIKE 'search_path=%'
  )
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg\_temp%' ESCAPE '\'
  AND n.nspname IN ('public', 'storage', 'graphql_public')
ORDER BY n.nspname, p.proname;

-- =============================================================================
-- 10h. Public storage buckets
-- Confirmed from storage.buckets.public. This does not list files.
-- =============================================================================

SELECT
  bucket.id AS bucket_id,
  bucket.name AS bucket_name,
  bucket.file_size_limit,
  bucket.allowed_mime_types,
  'bucket is public' AS finding
FROM storage.buckets AS bucket
WHERE bucket.public
ORDER BY bucket.name;

-- =============================================================================
-- 10i. Storage policies that look unrestricted
-- Same literal-true rule as 10c, limited to the storage schema. Potential risk.
-- =============================================================================

SELECT
  policy.tablename AS table_name,
  policy.policyname AS policy_name,
  policy.roles::text AS permitted_roles,
  policy.cmd AS command,
  regexp_replace(
    COALESCE(policy.qual, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS using_expression,
  regexp_replace(
    COALESCE(policy.with_check, ''),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    '[REDACTED_EMAIL]',
    'g'
  ) AS with_check_expression,
  'storage policy expression is true for a public API role' AS finding
FROM pg_policies AS policy
WHERE policy.schemaname = 'storage'
  AND policy.permissive = 'PERMISSIVE'
  AND policy.roles && ARRAY['anon', 'authenticated', 'public']::name[]
  AND (
    (
      policy.cmd IN ('SELECT', 'UPDATE', 'DELETE', 'ALL')
      AND policy.qual ~* '^[[:space:]]*\(?[[:space:]]*true[[:space:]]*\)?[[:space:]]*$'
    )
    OR (
      policy.cmd IN ('INSERT', 'UPDATE', 'ALL')
      AND policy.with_check ~* '^[[:space:]]*\(?[[:space:]]*true[[:space:]]*\)?[[:space:]]*$'
    )
  )
ORDER BY policy.tablename, policy.policyname;

-- =============================================================================
-- 10j. PUBLIC or anon execute on public and storage routines
-- A null function ACL is reported as a PUBLIC execute grant because that is
-- Postgres' default. Extension schemas are omitted here; see section 5.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  p.proacl IS NULL AS default_public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
  'routine is executable by PUBLIC or anon' AS finding
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE p.prokind IN ('f', 'p')
  AND n.nspname IN ('public', 'storage')
  AND (
    p.proacl IS NULL
    OR has_function_privilege('anon', p.oid, 'EXECUTE')
    OR EXISTS (
      SELECT 1
      FROM aclexplode(p.proacl) AS function_acl
      WHERE function_acl.grantee = 0
        AND function_acl.privilege_type = 'EXECUTE'
    )
  )
ORDER BY n.nspname, p.proname;

-- =============================================================================
-- 10k. anon or authenticated DML besides SELECT
-- Confirmed privilege, still not a substitute for reading the policy.
-- Useful for reports, sightings, flags, profiles, notifications, and storage.
-- =============================================================================

SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  role_row.rolname AS role_name,
  has_table_privilege(role_row.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(role_row.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(role_row.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(role_row.oid, c.oid, 'TRUNCATE') AS can_truncate,
  c.relrowsecurity AS rls_enabled,
  'role has a write privilege; RLS may still deny the write' AS finding
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
CROSS JOIN pg_roles AS role_row
WHERE c.relkind IN ('r', 'p', 'v', 'm')
  AND n.nspname IN ('public', 'storage')
  AND role_row.rolname IN ('anon', 'authenticated')
  AND (
    has_table_privilege(role_row.oid, c.oid, 'INSERT')
    OR has_table_privilege(role_row.oid, c.oid, 'UPDATE')
    OR has_table_privilege(role_row.oid, c.oid, 'DELETE')
    OR has_table_privilege(role_row.oid, c.oid, 'TRUNCATE')
  )
ORDER BY n.nspname, c.relname, role_row.rolname;
