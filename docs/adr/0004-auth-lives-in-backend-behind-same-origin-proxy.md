# Auth lives in the backend, and the web origin proxies it

The Better Auth server runs only in `bcn-backend-main`, which owns the database. The web client
holds no database connection and no auth secret; it uses the Better Auth client alone. The browser
never calls the backend's auth routes directly: Next.js rewrites `/api/auth/*` on the web origin to
the backend, so the session cookie is first-party on the site the student actually visits. Next.js
server code (pages, `proxy.ts`, the LiveKit token route) learns who the student is by forwarding
that cookie to the backend's `get-session`.

## Considered Options

- **Run Better Auth inside Next.js too** — rejected: two servers writing one auth database means two
  configs to keep in step, and the backend already owns the schema and migrations.
- **Browser calls `api.<domain>` directly with a cross-subdomain cookie** — rejected: needs CORS,
  `trustedOrigins` and a shared parent domain everywhere, and breaks on preview deploys whose
  domain differs.
- **Separate domains with `SameSite=None` cookies** — rejected: Safari's tracking prevention drops
  them.

## Consequences

- The backend sees requests arriving from the web host, so it must read the real client IP from
  forwarded headers for rate limiting and session records.
- Email links (verification, password reset) and the Google redirect URI point at the web origin,
  not the backend.
