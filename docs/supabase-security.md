# Supabase Security Baseline

## What this covers

- Enables Row Level Security (RLS) on all tables in the `public` schema.
- Applies to both staging and production Supabase databases.

This is required to prevent Supabase linter findings such as:
- `rls_disabled_in_public`
- `sensitive_columns_exposed` (when tables contain fields like `password`)

## Files

- SQL baseline: `scripts/sql/2026-02-18-enable-rls-public.sql`
- Runner script: `scripts/security/apply-rls-public-all.sh`

## How to run

1. Ensure `.env.local` contains:
   - `DATABASE_URL` (staging pooler URL)
   - `SUPABASE_PROD_DATABASE_URL` (production pooler URL)
2. Run:

```bash
pnpm db:security:rls:all
```

You can also pass a custom env file path:

```bash
bash scripts/security/apply-rls-public-all.sh /path/to/envfile
```

## Important note

This project currently uses server-side Prisma access for database reads/writes.  
If you later introduce browser-side Supabase DB queries (anon/authenticated keys), add explicit RLS policies per table before enabling those paths.

