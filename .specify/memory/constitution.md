<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Modified principles: I (Arabic-First RTL) — identity moved from Sanad (Cairo, dark
default) to Becan (IBM Plex Sans Arabic / El Messiri, light site + dark session);
Platform Constraints — shadcn/ui styling replaced by Becan tokens + hand-built kit,
Radix UI kept for interaction mechanics only.
Added sections: None
Removed sections: None
Templates requiring updates:
- ⚠ pending review .specify/templates/*.md (may still mention shadcn/Cairo)
Follow-up TODOs: Clerk (`src/proxy.ts`) and Supabase data are not wired yet after
the becan-design + old-sanad merge (2026-09-14); see docs/STATE.md.
-->

# Becan / بيكان Constitution (formerly Sanad / سند)

## Core Principles

### I. Arabic-First RTL Experience
All user-facing text MUST be Arabic for the `ar_SA` locale. User interfaces MUST
preserve `dir="rtl"`, `lang="ar"`, the Becan identity defined in `CLAUDE.md` and
`src/styles/tokens.css` (IBM Plex Sans Arabic body, El Messiri headings outside the
session, light marketing/app surfaces with a dark study session), and
Saudi student expectations for terminology, ordering, dates, and error wording.
Every user-facing feature MUST include accessible labels, keyboard-reachable
interactions, responsive behavior across mobile and desktop, and clear Arabic
empty, loading, and error states. Child layouts and feature components MUST NOT
duplicate root providers already defined in `src/app/layout.tsx`, including Clerk
localization and RTL direction providers.

Rationale: Sanad is an Arabic-first education product; losing RTL, localization,
or accessibility directly breaks the primary user experience.

### II. Next.js and React Architecture
Implementation MUST follow Next.js 16 App Router conventions in `src/app` and
preserve the existing route-group architecture. Components MUST be Server
Components by default; `"use client"` is permitted only when client interactivity,
browser APIs, Clerk session hooks, LiveKit, or local state require it. Features
MUST follow Vercel React and Next.js performance best practices, avoid duplicate
providers, avoid unnecessary client bundles, and prevent over-fetching. Heavy
browser-only features, including LiveKit voice sessions and PDF rendering, MUST
remain isolated to focused client components.

Rationale: Server-first architecture keeps Sanad fast, maintainable, and aligned
with App Router behavior while protecting complex browser-only integrations from
leaking into the whole app.

### III. Type Safety, Data Integrity, and Security
TypeScript strict mode MUST remain enabled. Supabase data access MUST use the
generated types in `src/types/database.types.ts`, and that file MUST NOT be
edited manually. Server-only secrets, including `SUPABASE_SERVICE_ROLE_KEY`,
`LIVEKIT_API_SECRET`, `LANGFUSE_SECRET_KEY`, and Bunny.net API keys, MUST never
be referenced from client components or browser-exposed environment variables.
Clerk is the source of authentication, and protected route behavior MUST live in
`src/proxy.ts`, not `middleware.ts`. API routes MUST validate inputs, preserve
data integrity, and return Arabic user-facing messages where applicable.

Rationale: The platform handles student data, enrollment state, course content,
voice sessions, and observability data; unsafe typing or secret exposure creates
product and security failures.

### IV. External Service Contracts
Clerk handles authentication and Arabic localization. Supabase handles app data
and storage. LiveKit handles real-time voice sessions. Bunny.net serves or
proxies course assets. Langfuse captures feedback and observability. Vercel
Analytics and Speed Insights capture product and performance signals. Any feature
touching these services MUST document required environment variables, expected
failure modes, and local validation steps in the feature plan, quickstart, or
task notes before implementation is considered complete.

Rationale: Sanad depends on managed services whose configuration and failure
states are part of the product contract, not incidental implementation detail.

### V. Quality Gates and Developer Workflow
Development MUST use Node v24.12.0 via `nvm use` and MUST use `pnpm` for package
operations. Required validation before completing implementation is `pnpm lint`
then `pnpm type-check`; `pnpm build` MUST also run when practical or when the
change affects routing, rendering, bundling, environment configuration, or
deployment behavior. There is currently no testing workflow or framework
configured, so plans and tasks for all future features MUST skip testing
workflows, test framework setup, test directories, and test commands unless a
separate approved feature explicitly adds testing infrastructure. If Supabase
schema or generated database types change, run `pnpm update-db-types`. Every task
MUST include exact file paths and preserve independently deliverable user stories.

Agents MUST NOT manage Git state. Git usage is read-only and limited to seeing
latest changes or differences, such as `git status`, `git diff`, and `git log`.
Branch creation, branch switching, staging, committing, amending, rebasing,
merging, resetting, restoring, stashing, tagging, pulling, and pushing are the
user's responsibility and MUST NOT be performed by agents.

Rationale: Consistent validation and precise task boundaries keep a brownfield
Next.js application safe to change without assuming infrastructure that does not
exist.

## Becan Platform Constraints

The fixed stack is Next.js 16 App Router, React 19, TypeScript 5 strict mode,
Tailwind CSS 4, Motion (`motion/react`), Radix UI (`radix-ui`) for interaction
mechanics, react-pdf, Clerk, Supabase, LiveKit, Bunny.net CDN, Langfuse, Vercel
Analytics, and Vercel Speed Insights. The source layout MUST remain rooted in
`src/app`, `src/components`, `src/lib`, `src/types`, and `src/styles`, with `@/*`
mapped to `./src/*`. Visual styling MUST come only from the Becan tokens in
`src/styles/tokens.css` and the kit in `src/components/becan`; Radix primitives
MUST be restyled with those tokens and MUST NOT introduce stock shadcn styling.
The LiveKit agent contract (`ui-control` / `lk.chat` topics, participant
attributes) in `src/lib/session` MUST NOT be changed without the agent side.

This is a brownfield project. New work MUST preserve existing architecture and
avoid large rewrites unless the feature cannot be delivered safely without them.
If `README.md` conflicts with `AGENTS.md` or this constitution, `AGENTS.md` and
this constitution are authoritative.

## Development Workflow

Feature specs MUST define independently deliverable user stories with exact file
paths during planning and Arabic/RTL acceptance criteria for user-facing
behavior. Plans MUST document the concrete Sanad technical context, expected
service integrations, environment variables, and validation commands. Tasks MUST
be grouped by user story, skip testing workflow assumptions, avoid assuming a
`tests/` directory, and include cross-cutting work for accessibility, responsive
behavior, Arabic error states, security, observability, and service failure
handling when relevant.

Implementation review MUST verify constitution compliance before work starts,
after design, and before completion. Deviations MUST be documented with the
reason, the simpler alternative rejected, and the mitigation plan.

## Governance

This constitution supersedes stale README guidance, generated template examples,
and informal practices when they conflict with Sanad's architecture or workflow.
Amendments require updating `.specify/memory/constitution.md`, adding or updating
the Sync Impact Report, synchronizing affected templates under `.specify/templates`,
and documenting any deferred uncertainty as TODOs in the report.

Versioning follows semantic versioning. MAJOR increments apply to incompatible
governance changes or principle removals/redefinitions. MINOR increments apply
to new principles, new sections, or materially expanded guidance. PATCH
increments apply to clarifications, wording fixes, and non-semantic refinements.

Every implementation plan MUST pass the Constitution Check before Phase 0
research and again after Phase 1 design. Before completion, contributors MUST
run the required validation commands, record skipped practical validations with a
reason, and confirm no client code exposes server-only secrets.

**Version**: 1.2.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-09-14
