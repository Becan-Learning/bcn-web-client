# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node v24.12.0 via `nvm use`; TypeScript 5 strict mode

**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4,
shadcn/ui new-york with RTL enabled, Radix UI, Clerk, Supabase, LiveKit,
Bunny.net, Langfuse, Vercel Analytics, Vercel Speed Insights

**Storage**: Supabase app data and storage; Bunny.net CDN for course assets

**Testing Workflow/Framework**: None. Future features MUST skip testing
workflow, test framework setup, test directories, and test commands unless a
separate approved feature explicitly adds testing infrastructure. Required
validation is `pnpm lint`, `pnpm type-check`, and `pnpm build` when practical.

**Target Platform**: Vercel-hosted Next.js web application for Arabic-first RTL users

**Project Type**: Brownfield Next.js web application using `src/app` route groups

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Arabic-first RTL: user-facing behavior uses Arabic text, preserves `dir="rtl"`,
  `lang="ar"`, Cairo font, dark default theme, accessibility, responsive behavior,
  and Arabic empty/loading/error states.
- App Router performance: Server Components are the default; `"use client"` is
  limited to required interactivity, browser APIs, Clerk hooks, LiveKit, or local
  state. Heavy browser-only features stay isolated.
- Type safety and security: TypeScript strict mode remains enabled, Supabase
  generated types are used, `src/types/database.types.ts` is not edited manually,
  and server-only secrets are not exposed to client code.
- Auth and routing: Clerk remains the auth source, and protected route behavior
  belongs in `src/proxy.ts`, not `middleware.ts`.
- Service contracts: features touching Clerk, Supabase, LiveKit, Bunny.net,
  Langfuse, Vercel Analytics, or Speed Insights document required env vars,
  failure modes, and local validation steps.
- Workflow: package operations use `pnpm`; validation includes `pnpm lint`,
  `pnpm type-check`, and `pnpm build` when practical; testing workflow and test
  commands are skipped unless test infrastructure is explicitly added.
- Git ownership: agents use Git only read-only to see latest changes or
  differences. Branching, staging, committing, rebasing, merging, resetting,
  restoring, stashing, pulling, and pushing remain the user's responsibility.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/                 # Next.js App Router route groups and API routes
├── components/          # Shared React components
│   ├── ui/              # shadcn/ui new-york components (RTL enabled)
│   └── study/           # LiveKit voice and AI chat study experience
├── lib/                 # Supabase, service clients, utilities
├── context/             # Shared React context providers/state
├── types/               # TypeScript types, including generated Supabase types
└── styles/              # Tailwind/CSS variables and global styles
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above. Include exact file paths for this feature and do not
introduce generic backend/frontend/test directories unless the plan explicitly
adds them.]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
