# La De Noir — Setup

Full-stack menswear store: **Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui**, backed by **Supabase** (catalog, auth, orders) with **Cloudflare R2** for product images.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

`npm run build` for a production build.

## Environment (`.env.local`)

| Var | What |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3 API token |
| `R2_BUCKET` | R2 bucket name (e.g. `la-de-noir-media`) |
| `R2_PUBLIC_BASE` | Public base URL for objects (bucket `r2.dev` URL or custom domain) |

## Routes

- Storefront: `/` (home), `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/account`, `/search`, `/maison`, `/help`, `/contact`
- Admin console: `/admin` (Dashboard / Orders / Products / Customers), `/admin/products/new`

## Supabase

Schema + seed already applied via migrations (categories, products, profiles, orders, order_items, `place_order()` RPC, RLS). Catalog is public-read; orders are guest-or-user with an atomic `place_order` RPC; admin reads/writes require `profiles.is_admin = true`.

### Make an account an admin

Sign up through `/account` (email confirmation is on — confirm the email), then:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = '<your-email>');
```

`/admin` and `/admin/products/new` are gated to admins.

## Cloudflare R2 (product images)

R2 must be enabled once in the Cloudflare dashboard (Storage → R2 → enable), then:

1. Create a bucket (e.g. `la-de-noir-media`) and enable public access (r2.dev or a custom domain).
2. Create an **R2 API token** (S3-compatible) → fill the `R2_*` env vars.

Until R2 is configured, the **New product** form still works — paste an image URL instead of uploading a file. Once `R2_*` is set, the file upload path activates automatically (`lib/r2.ts`).
