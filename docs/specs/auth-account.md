# Spec: Account and auth on the web client

Status: agreed 2026-10-11 (grilling session). Branch: `feat/auth-account`.
Read first: [GLOSSARY.md](../../GLOSSARY.md) (**Account**),
[ADR 0004](../adr/0004-auth-lives-in-backend-behind-same-origin-proxy.md),
[backend-auth-handoff.md](../backend-auth-handoff.md) (the backend contract this spec builds
against — field names, error codes, endpoints, the `x-becan-locale` header).

The backend endpoints do not exist yet. The web is built against the handoff doc and verified with
lint, types, unit tests and build; end-to-end runs come when the backend lands.

## Decisions (do not relitigate)

- **Better Auth server lives only in the backend.** The web uses the Better Auth **client** only
  (`better-auth/react`). No DB, no `BETTER_AUTH_SECRET`, no `betterAuth()` in this repo.
- **Same-origin proxy:** `next.config.ts` rewrites `/api/auth/:path*` →
  `${BACKEND_URL}/api/auth/:path*`. Server code talks to `BACKEND_URL` directly.
- **Sign-in method:** email + password with required email verification. Google and phone
  sign-in are **commented out** in the UI (code kept in comments, not shown, no "coming soon").
- **Account fields at sign-up, all required:** name, email, password, phone, university, major.
  No level. No password confirmation field — a show/hide toggle instead.
- **Phone:** Saudi mobile only. The student types `05XXXXXXXX` (spaces/dashes allowed); it is
  sent and stored as E.164 `+9665XXXXXXXX`; shown back as `05XXXXXXXX`. Unique, unverified.
- **University / major** come from the backend catalog (`GET /api/v1/institutions`); a major
  belongs to one university, so the major select depends on the chosen university.
- **Gated routes:** `/session/*`, `/home`, `/settings/*`, `/checkout` (and their `/en/...`
  forms). A signed-out visit redirects to `/sign-in?next=<original path+query>`.
- **`becan:uid` is removed.** The LiveKit token route takes identity from the session only.
- **Verification:** sign-in is refused until the email is verified. The link signs the student in
  and returns them to `next`. Signing in unverified → the backend resends → show `/verify-email`.
- **Settings:** name, phone, university, major auto-save on blur/change (existing pattern).
  Email change and password change are explicit steps. Delete = typed phrase + current password,
  immediate.
- **Brief deviation (intentional):** the `/join` brief forbids name/university/major at sign-up.
  That rule is overridden by the product owner because Better Auth now holds the full Account.
- **Vocabulary:** say **Account** in code and copy-adjacent identifiers for the student's record
  (`useAccount`, `requireAccount`); never "profile". Better Auth's own `user` type/table name is
  fine where it is the library's API.

## House rules that matter here (from CLAUDE.md / AGENTS.md)

- Next.js 16: read `node_modules/next/dist/docs/` for `rewrites`, `proxy.ts`, `cookies()/headers()`
  before writing them. `proxy.ts` is the middleware file in this version.
- All student-visible text in `messages/ar.json` + `messages/en.json` (one key tree). No hard-coded
  strings in components.
- `Link` / `useRouter` / `redirect` from `@/i18n/navigation` — never `next/link`.
- Tokens only (no hex/rgb), logical properties only (`ms-`/`pe-`/`start-`, no `ml-`/`left-`),
  Latin runs in Arabic wrapped `dir="ltr"`, Western digits, touch targets ≥ 44px,
  `:focus-visible`, one amber primary button per screen, `<button>` not `<div onClick>`.
- Screens use the kit in `src/components/becan/kit.tsx` (`PrimaryButton`, `TextField`,
  `FieldLabel`, `ErrorText`, `SelectField`, `PageShell`, `SiteHeader` …) and follow the existing
  `/join` card layout. Use the `becan-screen` skill for screen work if available.
- Comments in the codebase are Arabic, sparse, and explain *why*. Match the surrounding density.
- No process language in code or comments ("MVP", "for now", "phase", ticket ids).
- Gates: `pnpm lint` · `pnpm type-check` · `pnpm test` · `pnpm build`.

---

## Ticket A — Foundation

**Goal:** everything the screens and settings depend on, plus gating and the token route.

1. **Env & proxy rewrite**
   - `.env.example`: add `BACKEND_URL="http://localhost:3000"` with a one-line comment.
   - `next.config.ts`: `async rewrites()` → `{ source: "/api/auth/:path*", destination: `${BACKEND_URL}/api/auth/:path*` }`.
     Fail the build loudly if `BACKEND_URL` is missing in production.
2. **`src/lib/auth/client.ts`** (client) — `authClient = createAuthClient({ plugins: [inferAdditionalFields<…>()] , fetchOptions: { onRequest } })`
   - No `baseURL` (same origin).
   - `inferAdditionalFields` declares exactly the backend's fields: `phoneNumber` (string, required),
     `phoneNumberVerified` (boolean, `input: false`), `institutionId` (string, required),
     `majorId` (string, required).
   - `onRequest` sets header `x-becan-locale` to `document.documentElement.lang` (`ar` | `en`).
   - Export `useAccount()` — thin wrapper over `authClient.useSession()` returning the typed Account
     (or `null`) and pending state.
3. **`src/lib/auth/session.ts`** (`server-only`)
   - `getAccount()`: `fetch(`${BACKEND_URL}/api/auth/get-session`, { headers: { cookie } , cache: "no-store" })`
     using `headers()` from `next/headers`; returns the typed `{ user, session }` or `null`
     (any non-200 or network error → `null`, logged).
   - `requireAccount(locale, path)`: `getAccount()`, or `redirect` to `/sign-in?next=<path>` via
     `@/i18n/navigation`.
   - Use `requireAccount` in the server entry of every gated route: `session/[courseSlug]/[chapterId]` page,
     `session/.../done` (a redirect), `home`, the settings shell/pages, `checkout` (+ `checkout/result`).
4. **`src/lib/auth/catalog.ts`** (`server-only`) — `getInstitutions(): Promise<Institution[]>` from
   `${BACKEND_URL}/api/v1/institutions` (`next: { revalidate: 300 }`). Types:
   `Institution = { id: string; name: Localized; majors: { id: string; name: Localized }[] }`
   reusing `Localized` from `@/i18n/localized`. Returns `[]` on failure (the form then shows a
   localized "couldn't load universities, try again" state — not demo data).
5. **`src/lib/auth/next-path.ts`** + test — `safeNext(raw: string | null | undefined, fallback = "/home")`:
   accept only same-origin relative paths (`/` followed by a non-`/`, non-`\` char); reject
   `//evil`, `/\evil`, `http:`, `javascript:`, encoded variants; strip a leading locale prefix is
   **not** its job (callers navigate with `@/i18n/navigation`). TDD.
6. **`src/lib/auth/phone.ts`** + test — `toE164Saudi(input)` → `+9665XXXXXXXX` or `null`
   (accepts `05XXXXXXXX`, `5XXXXXXXX`, `+9665…`, `009665…`, spaces/dashes);
   `toLocalSaudi(e164)` → `05XXXXXXXX`. TDD.
7. **`src/lib/auth/errors.ts`** — map Better Auth / backend error `code`s to message keys under
   `Auth.Errors` in both message files: `USER_ALREADY_EXISTS` (and its 1.7 variant
   `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`), `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED`,
   `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `INVALID_EMAIL`, `INVALID_PASSWORD`,
   `INVALID_TOKEN`, `TOO_MANY_REQUESTS` (status 429), `INVALID_PHONE_NUMBER`,
   `PHONE_NUMBER_TAKEN`, `INVALID_INSTITUTION`, `INVALID_MAJOR`, plus a generic fallback.
   Verify the exact code strings against `node_modules/better-auth` / `@better-auth/core`
   (`BASE_ERROR_CODES`) rather than trusting this list.
8. **Gating in `src/proxy.ts`** — before next-intl handling, for gated paths (with or without the
   `/en` prefix): if `getSessionCookie(request)` (from `better-auth/cookies`) is absent, redirect to
   the locale-correct `/sign-in?next=<path+search>`. This is the optimistic check; `requireAccount`
   is the authoritative one. Keep the existing `NEXT_LOCALE` behaviour and matcher. Extend
   `src/i18n/proxy.test.ts` (or a sibling test) for: gated AR path, gated EN path, public path
   untouched, cookie present passes through.
9. **LiveKit token from the session** — `src/app/api/get-lk-token/route.ts` forwards the request's
   `cookie` header to `get-session`; 401 JSON when no session. `user_id` = session user id,
   `user_name` = user name; the `user_id` / `user_name` query params are no longer read. Attribute
   names unchanged (agent contract). `session-view.tsx` stops sending them; delete
   `src/lib/session/anon-id.ts` and the hard-coded `USER_NAME`.

**Done when:** gates green; `safeNext`, phone, proxy tests pass; no `getAnonId` / `becan:uid` left.

---

## Ticket B — Auth screens

Depends on Ticket A (uses `authClient`, `safeNext`, `toE164Saudi`, `errors.ts`, `getInstitutions`).

Routes (all under `src/app/[locale]/`, each with `generateMetadata` + `setRequestLocale` like
`/join`), all in the existing `/join` card layout:

1. **`/join` — create an Account.** Two steps in one form, one submit:
   - Step 1: name, email, password (show/hide toggle, hint "at least 8 characters").
   - Step 2: phone (`dir="ltr"`, placeholder `05XXXXXXXX`), university select, major select
     (disabled until a university is chosen; resets when the university changes).
   - "Next" validates step 1 client-side; "Back" keeps values. The amber primary button is the
     step's action (only one amber per screen).
   - Submit: `authClient.signUp.email({ name, email, password, phoneNumber, institutionId, majorId, callbackURL })`
     where `callbackURL` = locale-prefixed `safeNext(next)`. On success → `/verify-email?email=…&next=…`.
     Errors via `errors.ts`, focused on the offending field (step switches back if needed).
   - Institutions come from `getInstitutions()` in the server page, passed as props.
   - **Comment out** the Google button and the "or" divider (keep the code in a comment block
     with a one-line Arabic reason). Keep the `next` + `sessionStorage` survival logic.
   - Footer link: "Already have an account? Sign in" → `/sign-in?next=…`.
2. **`/sign-in`** — email + password, "Forgot password?" link, "Create an account" link (both
   carry `next`). `authClient.signIn.email({ email, password, callbackURL })`. On
   `EMAIL_NOT_VERIFIED` (403) → `/verify-email?email=…&next=…` (backend has already resent). On
   success → `router.replace(safeNext(next))`.
3. **`/verify-email`** — "Check your inbox" with the email shown (`dir="ltr"`), a resend button
   (`authClient.sendVerificationEmail({ email, callbackURL })`) with a 60-second cooldown, and a
   link back to sign-in. Also handles `?error=` from an expired/invalid link (Better Auth appends
   `error=INVALID_TOKEN` / `TOKEN_EXPIRED` to the callback) with a localized message.
4. **`/forgot-password`** — email → `authClient.requestPasswordReset({ email, redirectTo: <locale>/reset-password })`.
   Always show the same "if an Account exists we sent a link" confirmation (no enumeration).
5. **`/reset-password`** — reads `token` (and `error`) from the query; new password with
   show/hide → `authClient.resetPassword({ newPassword, token })` → `/sign-in` with a success notice.
6. **Header** — `SiteHeader`'s login link (`kit.tsx`, currently `/join`) points to `/sign-in`.
   When `useAccount()` has an Account, it becomes a link to `/home` instead (existing label key if
   one fits, else a new key). Signed-in visitors opening `/join` or `/sign-in` are sent to
   `safeNext(next)`.
7. **Messages** — new keys under `Join`, `SignIn`, `VerifyEmail`, `ForgotPassword`,
   `ResetPassword` in both files; Arabic is the real copy, natural Saudi-friendly MSA, student as
   the subject of the sentence. Remove the now-unused `contactInvalid`/`contact` phone wording.

**Done when:** gates green; every screen renders at 390px and 1120px in AR and EN (checked with
`pnpm build` + a quick `pnpm dev` look if possible).

---

## Ticket C — Settings and signed-in surfaces

Depends on Ticket A. Independent of Ticket B (different files).

1. **`/settings/account`** — replace demo data with the Account:
   - Server page loads `requireAccount` + `getInstitutions()` and passes both to `AccountView`.
   - Name, phone, university, major: auto-save on blur/change with
     `authClient.updateUser({ … })` and the existing `SaveNotice`; on error show `ErrorText` under
     the field and restore the last saved value. Phone validated with `toE164Saudi` before saving.
     Changing university clears major and does not save until a major is picked.
   - **Email:** read-only display (`dir="ltr"`) + "Change email" explicit step:
     `authClient.changeEmail({ newEmail, callbackURL: <locale>/settings/account })` → notice
     "we sent a link to the new address".
   - **Password:** keep the existing explicit form; wire it to
     `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`.
2. **`/settings/delete`** — add a current-password field to the existing typed-phrase form;
   submit → `authClient.deleteUser({ password })`; on success show the existing "received" state
   and send the student to `/`. Errors via `errors.ts`. The button stays non-red.
3. **Sign out** — an outlined/link control in the settings shell nav (not amber):
   `authClient.signOut()` then `router.replace("/")`.
4. **`/home` greeting** uses the Account name from `requireAccount` instead of demo text.
5. **`/settings/data`** stays a mock (backend export endpoint is "later" in the handoff doc).

**Done when:** gates green; no demo name/contact left in account settings.
