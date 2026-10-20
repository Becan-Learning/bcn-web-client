# Backend handoff: Account and auth

Status: agreed 2026-10-11. Target repo: `Becan-Learning/bcn-backend-main@dev`.
The web client (`feat/auth-account`) is built against this document; nothing here exists in the
backend yet beyond the Better Auth mount and its four core tables (migration
`20261008133112_fixed_banshee`). Why auth lives in the backend:
[ADR 0004](adr/0004-auth-lives-in-backend-behind-same-origin-proxy.md). Term:
**Account** in [GLOSSARY.md](../GLOSSARY.md).

## Naming: our Account vs Better Auth's tables

| Domain | Better Auth table | Note |
|---|---|---|
| **Account** (the student's one record) | `user` | Everything below adds columns here. |
| a sign-in method (password, Google) | `account` | Better Auth's name; *not* our Account. |
| a signed-in device | `session` | |
| a pending email link | `verification` | |

The table names stay as Better Auth ships them. Code and docs in the backend should say "user row"
for the table and "Account" for the domain concept, never "account" for the user row.

## 1. Topology (what the web expects)

- The browser only talks to the **web origin**. The web rewrites `/api/auth/*` to
  `${BACKEND_URL}/api/auth/*`, so the session cookie is first-party on the web origin.
- The web's server code calls the backend directly (server-to-server) for
  `GET /api/auth/get-session` (forwarding the student's `cookie` header) and for the catalog.
- Therefore:
  - `BETTER_AUTH_URL` = the **web origin** (`http://localhost:3001` in dev,
    `https://<domain>` in prod). Better Auth builds email links from it, and those links must open
    on the web origin.
  - `trustedOrigins: [env.CORS_ORIGIN]` (the web origin). Without it Better Auth rejects the
    proxied POSTs on its origin check.
  - No `crossSubDomainCookies`, no `SameSite=None`. Defaults are correct for this topology.

## 2. Schema changes

### 2.1 Catalog tables (new)

```ts
// src/db/schema/catalog-schema.ts
export const institution = pgTable("institution", {
  id: text("id").primaryKey(),              // stable slug, e.g. "ksu"
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const major = pgTable("major", {
  id: text("id").primaryKey(),              // stable slug, unique across institutions, e.g. "ksu-cs"
  institutionId: text("institution_id").notNull()
    .references(() => institution.id, { onDelete: "restrict" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("major_institution_id_idx").on(t.institutionId)]);
```

A major belongs to exactly one institution (the same major name at two universities is two rows).
Seed at least the three universities the web shows today: King Saud University, King Abdulaziz
University, Imam Mohammad Ibn Saud Islamic University, each with a few majors.

### 2.2 Columns on `user` (via Better Auth `additionalFields`)

| Field (TS) | Column | Type | Required | `input` | Notes |
|---|---|---|---|---|---|
| `phoneNumber` | `phone_number` | text, **unique** | yes | yes | E.164, Saudi mobile only: `^\+9665\d{8}$`. |
| `phoneNumberVerified` | `phone_number_verified` | boolean, default `false` | — | **no** | Always `false` until phone sign-in exists. |
| `institutionId` | `institution_id` | text, FK → `institution.id` (`restrict`) | yes | yes | |
| `majorId` | `major_id` | text, FK → `major.id` (`restrict`) | yes | yes | Must belong to `institutionId`. |

`name` (already `NOT NULL`) is the student's display name; the web requires it at sign-up.

`phoneNumber` / `phoneNumberVerified` deliberately use the exact field names of Better Auth's
`phoneNumber` plugin. When phone sign-in is added, remove these two from `additionalFields`, enable
the plugin, and the existing column and data carry over with no migration.

```ts
user: {
  additionalFields: {
    phoneNumber:         { type: "string",  required: true,  input: true,  unique: true },
    phoneNumberVerified: { type: "boolean", required: false, input: false, defaultValue: false },
    institutionId:       { type: "string",  required: true,  input: true,
                           references: { model: "institution", field: "id", onDelete: "restrict" } },
    majorId:             { type: "string",  required: true,  input: true,
                           references: { model: "major", field: "id", onDelete: "restrict" } },
  },
  // ...see §3
}
```

Then regenerate the auth schema (the Better Auth CLI `generate` command, or hand-edit
`src/db/schema/auth-schema.ts`) and `pnpm db:generate` → one migration for catalog + user columns.

### 2.3 Server-side validation (do not trust the client)

`databaseHooks.user.create.before` and `databaseHooks.user.update.before`:
- `phoneNumber` matches `^\+9665\d{8}$` → else `APIError("BAD_REQUEST", { code: "INVALID_PHONE_NUMBER" })`.
- `majorId` exists and `major.institutionId === institutionId` (on update, compare against the
  incoming or current `institutionId`) → else `code: "INVALID_MAJOR"`.
- `institutionId` exists → else `code: "INVALID_INSTITUTION"`.
- A duplicate phone (unique violation) → `code: "PHONE_NUMBER_TAKEN"`.

The web maps these `code`s to localized messages; keep the codes stable.

## 3. Better Auth config (`src/utils/auth.ts`)

```ts
betterAuth({
  baseURL: env.BETTER_AUTH_URL,            // the web origin
  trustedOrigins: [env.CORS_ORIGIN],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => { /* Resend, locale from request */ },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,                     // unverified sign-in resends the link
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,                     // 1 hour
    sendVerificationEmail: async ({ user, url }, request) => { /* Resend */ },
  },
  user: {
    additionalFields: { /* §2.2 */ },
    changeEmail: { enabled: true },         // verification goes to the NEW address
    deleteUser: { enabled: true },          // web sends the password, or none for a Google-only Account (fresh session); no email step
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,           // 30 days
    updateAge: 60 * 60 * 24,                // refreshed on any day of use
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    database: { joins: true },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
});
```

Phone sign-in is **not** enabled; the web has it commented out. Google sign-in is enabled (§3.2).

### 3.1 Email (Resend)

- New env: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Becan <no-reply@<domain>>`).
- Three emails: verify email, reset password, verify new email (change email reuses
  `sendVerificationEmail`).
- **Language:** the web sends the header `x-becan-locale: ar | en` on every auth request. Read it
  from `request?.headers.get("x-becan-locale")`; anything else → `ar`. Arabic emails are
  `dir="rtl" lang="ar"`; English `dir="ltr" lang="en"`. Western digits (0–9) in both.
- Do not `await` the send inside the handler (timing attack on sign-up / reset); fire it with
  `void` and log failures with the Pino logger.
- The `url` Better Auth passes already contains the web's `callbackURL` / `redirectTo`. Send it as is.

### 3.2 Google sign-in

Google is a Better Auth social provider with **implicit sign-up disabled**
(`socialProviders.google.disableImplicitSignUp: true`, with `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`). The OAuth redirect URI is `<web origin>/api/auth/callback/google`, which
reaches the backend through the same `/api/auth/*` proxy (`BETTER_AUTH_URL` is the web origin).
If the Google email already has an Account, Better Auth links Google to it and signs the student in.

Calls (the web uses `authClient.signIn.social`, verified in better-auth 1.7.7: `requestSignUp`,
`additionalData`, `newUserCallbackURL`, `errorCallbackURL` exist on `POST /sign-in/social`):

```ts
// Sign-up (join page only)
signIn.social({
  provider: "google",
  requestSignUp: true,
  additionalData: { phoneNumber /* E.164 */, institutionId, majorId },
  callbackURL, newUserCallbackURL, errorCallbackURL,   // errorCallbackURL = /join?method=google&next=…
});
// Sign-in (sign-in page)
signIn.social({ provider: "google", callbackURL, errorCallbackURL });  // errorCallbackURL = /sign-in?next=…
```

The backend validates `additionalData` with the same rules and codes as email sign-up (§2.3).
Failures redirect the browser to `errorCallbackURL` with `?error=<code>`; the web maps these:

| `?error=` | Meaning | Web behaviour |
|---|---|---|
| `signup_disabled` | Google email has no Account and `requestSignUp` was not set (Better Auth, from the message "signup disabled") | Sign-in redirects to `/join` in Google mode with the notice «ما عندك حساب بعد» |
| `INVALID_PHONE_NUMBER`, `PHONE_NUMBER_TAKEN`, `INVALID_INSTITUTION`, `INVALID_MAJOR` | §2.3 codes | Join page, step 2, next to the field |
| `BANNED_USER` | Banned Account | The existing banned message and support link |
| `ADMIN_GOOGLE_FORBIDDEN` | The email belongs to an Admin | "Use email and password" (Admins sign in with password and two-factor) |
| `access_denied` | The student cancelled on Google | Gentle retry message |
| other lowercase codes (`account_not_linked`, `state_mismatch`, `unable_to_link_account`, `email_not_verified`, …) | OAuth failure | One generic "couldn't continue with Google" message |

Custom codes must reach the redirect as `?error=<CODE>` (Better Auth does this for an `APIError`
with `body.code` thrown from a user hook during the callback). Account deletion for a password-less
Account calls `deleteUser()` with no password: Better Auth requires a fresh session
(`SESSION_EXPIRED`), and the web sends the student through Google again.

## 4. Express wiring

- `app.set("trust proxy", 1)` (or the exact hop count of the host) so `express-rate-limit` and
  Better Auth see the student's IP from `x-forwarded-for`, not the web host's.
- Keep `toNodeHandler(auth)` before `express.json()` (already correct).
- The global limiter (100 / 15 min) counts every auth call. Give `/api/auth` its own looser limiter or
  rely on Better Auth's built-in `rateLimit` (enable `rateLimit: { enabled: true, storage: "database" }`
  in production) and exclude `/api/auth` from the global one.
- CORS stays single-origin; add `PATCH` to `methods` for future app routes.
- A `requireSession` middleware for app routes:
  `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` → 401 when null, else
  `res.locals.session`.

## 5. Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `ALL` | `/api/auth/*` | — | Better Auth (exists). The web uses: `sign-up/email`, `sign-in/email`, `sign-out`, `get-session`, `send-verification-email`, `verify-email`, `request-password-reset`, `reset-password`, `update-user`, `change-email`, `change-password`, `delete-user`. |
| `GET` | `/api/v1/institutions` | public | Catalog for sign-up and settings. Cache: `public, max-age=300`. |
| `GET` | `/api/v1/me/export` | session | **Later.** The student's data as JSON (Account fields, sessions list). The web's `/settings/data` stays a mock until this exists. |

`GET /api/v1/institutions` response (sorted by `sortOrder`, then `nameAr`):

```json
[
  {
    "id": "ksu",
    "name": { "ar": "جامعة الملك سعود", "en": "King Saud University" },
    "majors": [
      { "id": "ksu-cs", "name": { "ar": "علوم الحاسب", "en": "Computer Science" } }
    ]
  }
]
```

The `{ ar, en }` shape matches the web's `Localized` type, so it renders without mapping.

## 6. Env (`src/config/env.ts` + `.env.example`)

`.env.example` today lists only `NODE_ENV` and `PORT`. It should list everything the Zod schema
validates plus the new keys:

```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=            # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3001   # the WEB origin (see §1)
RESEND_API_KEY=
EMAIL_FROM=
```

Also refresh the backend `AGENTS.md`: it still says there is no database and mentions a users stub
that is not mounted.

## 7. Deletion

`deleteUser` cascades `session` and `account` (already `ON DELETE CASCADE`). Any future table that
references `user.id` (enrollments, session history, subscriptions) must declare its delete
behaviour explicitly when it is added — cascade for personal data, and a deliberate decision for
billing records.

## 8. The LiveKit agent

Unchanged contract. The web's `/api/get-lk-token` now fills the participant attributes `user_id`
(the Better Auth user id) and `user_name` (`user.name`) from the verified session instead of the
anonymous browser id. Same attribute names; only the values change.

## Checklist

- [ ] `institution` + `major` tables, seed, migration
- [ ] `user` additional fields + migration
- [ ] create/update hooks with the four error codes
- [ ] Better Auth config per §3 (baseURL = web origin, trustedOrigins, verification, reset, change email, delete, session)
- [ ] Resend sender with `x-becan-locale`
- [ ] Google provider (§3.2): `disableImplicitSignUp`, `additionalData` validation, `ADMIN_GOOGLE_FORBIDDEN`, `BANNED_USER` on the callback
- [ ] `trust proxy`, auth rate limiting, `requireSession` middleware
- [ ] `GET /api/v1/institutions`
- [ ] `.env.example` + `AGENTS.md` refreshed
- [ ] later: `GET /api/v1/me/export`
