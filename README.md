This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Environments

Supabase rollout notes, including:

- Neon to Supabase migration flow
- Production vs Preview DB mapping in Vercel
- GitHub secrets for `main` vs other branches

See `/Users/charlie/Development/pilates-v4/docs/supabase-migration.md`.

## Owner flow smoke test

Run a lightweight owner-route smoke check against a running app (defaults to `http://localhost:3000`):

```bash
TEST_OWNER_COOKIE='next-auth.session-token=...' pnpm test:smoke:owner
```

Optional base URL override:

```bash
TEST_BASE_URL='https://staging.example.com' TEST_OWNER_COOKIE='next-auth.session-token=...' pnpm test:smoke:owner
```

Notes:
- Includes an anonymous access check (expects redirect/unauthorized on `/studio`)
- Includes authenticated checks for `/studio`, `/studio/schedule`, `/studio/inbox`, `/studio/marketing`, and `/studio/settings`

## Reporting regression smoke test

Run reporting consistency checks against a running app (defaults to `http://localhost:3000`):

```bash
TEST_OWNER_COOKIE='next-auth.session-token=...'
TEST_TEACHER_COOKIE='next-auth.session-token=...'
TEST_BASE_URL='https://staging.example.com'
TEST_REQUIRE_REPORT_DATA='1'
pnpm test:smoke:reporting
```

Optional entity IDs (if omitted, script auto-resolves from studio list endpoints where possible):

```bash
TEST_STUDIO_CLIENT_ID='...'
TEST_STUDIO_TEACHER_ID='...'
TEST_STUDIO_CLASS_ID='...'
TEST_STUDIO_LOCATION_ID='...'
```

Strict-mode flags:

- `TEST_REQUIRE_REPORT_INTEGRITY=1`: fail if `/api/studio/reports/integrity` cannot be executed.
- `TEST_FAIL_ON_SKIP=1`: fail if any checks are skipped.

GitHub Actions secrets used by `.github/workflows/reporting-smoke.yml`:

- `TEST_OWNER_COOKIE`
- `TEST_TEACHER_COOKIE`
- `TEST_STUDIO_CLIENT_ID`
- `TEST_STUDIO_TEACHER_ID`
- `TEST_STUDIO_CLASS_ID`
- `TEST_STUDIO_LOCATION_ID`
- `TEST_REQUIRE_REPORT_DATA`
- `TEST_REQUIRE_REPORT_INTEGRITY`
- `TEST_FAIL_ON_SKIP`
- `TEST_BASE_URL`
