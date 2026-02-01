# Supabase Setup (Client + Admin)

This project uses Supabase for Auth and database access.

## Required environment variables

Create a `.env` file in the project root with:

```
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<ANON_PUBLIC_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"
```

Notes:
- Use the **Session Pooler** connection string for `DATABASE_URL` (IPv4).
- Never commit `.env` to Git.

## Client connection (browser)

Uses `lib/supabaseClient.ts` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Client API calls should use `lib/supabaseFetch.ts` so the `Authorization: Bearer <access_token>` header is included.

## Admin connection (server only)

Uses `lib/supabaseAdmin.ts` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The admin client must only be used in server code.

## Reset + sync database

```
npx prisma db push --force-reset --skip-generate
npx prisma generate
```

## User sync (Supabase → Prisma)

The app maps Supabase users to Prisma users using `User.supabaseId`.
After signup or login, call:

```
POST /api/auth/sync
```

This creates the Prisma user if missing.

## RLS (Row Level Security)

Apply RLS to all app tables in Supabase SQL Editor:

```
scripts/supabase-rls.sql
```

Note: no policies are defined on purpose. This blocks all direct access from
`anon`/`authenticated` keys so data is only available through the server API.

If you want to allow direct client access later, add policies that map
`auth.uid()` to your data model.

## Production checklist

- Re-enable email confirmations in Supabase Auth (recommended for production).
- Set `NEXT_PUBLIC_SITE_URL` to your production domain.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server (never in client).

## Common issues

- **`/api/auth/signin` 404**: NextAuth middleware must be removed (this project uses Supabase Auth).
- **Direct DB connection fails**: Use **Session Pooler** (IPv4) from Supabase Database → Connection String → Pooler settings.
