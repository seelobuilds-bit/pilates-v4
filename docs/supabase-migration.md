# Supabase Migration Plan (Neon -> Supabase)

This project uses Prisma with PostgreSQL. Supabase is a PostgreSQL provider, so app code does not need a data-layer rewrite.

## 1) Required Connection Strings Per Supabase DB

For each database (`prod`, `staging`) keep two URLs:

- `DATABASE_URL`: Supabase pooler URL (port `6543`) with:
  - `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL`: Supabase direct/session URL (port `5432`)

`DATABASE_URL` is for runtime app traffic.  
`DIRECT_URL` is for migrations (`prisma migrate`).

## 2) Vercel Environment Mapping

Set these in Vercel project settings:

- Production environment:
  - `DATABASE_URL` -> Supabase **prod** pooler URL
  - `DIRECT_URL` -> Supabase **prod** direct URL
  - `SUPABASE_URL` -> Supabase **prod** project URL (`https://<ref>.supabase.co`)
  - `SUPABASE_SERVICE_ROLE_KEY` -> Supabase **prod** service role key
  - `SUPABASE_STORAGE_BUCKET` -> `uploads` (or your chosen bucket name)
- Preview environment:
  - `DATABASE_URL` -> Supabase **staging** pooler URL
  - `DIRECT_URL` -> Supabase **staging** direct URL
  - `SUPABASE_URL` -> Supabase **staging** project URL
  - `SUPABASE_SERVICE_ROLE_KEY` -> Supabase **staging** service role key
  - `SUPABASE_STORAGE_BUCKET` -> `uploads` (or your chosen bucket name)

This makes `main` deploys use prod DB and Preview deploys use staging DB.

## 3) GitHub Secrets Mapping (CI main vs other branches)

Set these repository secrets:

- `SUPABASE_PROD_DATABASE_URL`
- `SUPABASE_PROD_DIRECT_URL`
- `SUPABASE_STAGING_DATABASE_URL`
- `SUPABASE_STAGING_DIRECT_URL`
- `SUPABASE_PROD_URL`
- `SUPABASE_PROD_SERVICE_ROLE_KEY`
- `SUPABASE_STAGING_URL`
- `SUPABASE_STAGING_SERVICE_ROLE_KEY`

CI is configured so:

- `main`/`master` -> prod secrets
- all other branches/PR refs -> staging secrets

If CI does not run upload tests, the storage secrets are still required in Vercel runtime envs.

## 4) Data Migration (Neon -> Supabase Prod)

Recommended cutover flow:

1. Freeze writes briefly.
2. Dump Neon:
   - `pg_dump --format=custom --no-owner --no-privileges "$NEON_DATABASE_URL" > neon.dump`
3. Restore to Supabase prod:
   - `pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$SUPABASE_PROD_DIRECT_URL" neon.dump`
4. Validate row counts and critical flows (auth, bookings, payments, reports).
5. Swap Vercel Production env vars to Supabase prod and redeploy.
6. Keep Neon available read-only for rollback window.

## 5) Staging Workflow

For non-main branches and Vercel Preview:

- Use Supabase staging DB.
- Run migrations against staging before validating preview behavior.

If multiple branches share one staging DB, schema migrations can clash.  
If that becomes noisy, move to one DB per preview/branch.

## 6) Supabase Storage Setup

Uploads are handled by `/api/upload` and stored in Supabase Storage (not Vercel Blob).

Create a bucket in each Supabase project:

- Bucket name: `uploads` (or match your `SUPABASE_STORAGE_BUCKET`)
- Public bucket: `true` (current app stores public file URLs)

Suggested folder structure used by the app:

- `training/videos`
- `training/thumbnails`
- `training/resources`
- `videos`
- `pdfs`
- `thumbnails`

## 7) One-Time Media Migration (Vercel Blob -> Supabase Storage)

A migration script is included at:

- `scripts/migrate-blob-to-supabase.mjs`

It does two things:

1. Finds old Blob URLs in DB string/array/json fields.
2. Downloads each file, uploads to Supabase Storage, and rewrites DB URLs.

Commands:

- Dry run (no writes): `pnpm media:migrate:dry`
- Apply migration: `pnpm media:migrate:apply`

Optional env:

- `MIGRATION_SOURCE_HOSTS` (default: `blob.vercel-storage.com`)

Recommended flow:

1. Ensure your `uploads` bucket exists and is public.
2. Run dry run and review counts.
3. Run apply once.
4. Spot-check key pages (training/class flows/vault/store images/resources).
5. Keep old Blob storage for a short rollback window.
