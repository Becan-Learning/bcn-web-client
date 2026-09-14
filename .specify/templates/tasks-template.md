---

description: "Task list template for Sanad feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Validation**: Generated tasks MUST use `pnpm lint`, `pnpm type-check`, and `pnpm build` when practical. Run `nvm use` before commands.

**Tests**: No testing workflow or framework is currently configured. Future features MUST skip testing workflow, test framework setup, test directories, and test commands unless a separate approved feature explicitly adds testing infrastructure.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on another task
- **[Story]**: Which user story this task belongs to, such as US1, US2, or US3
- Include exact file paths in every task description
- Include Arabic/RTL, accessibility, responsive, security, observability, and service failure tasks when relevant
- Do not include Git tasks. Agents may inspect Git read-only for latest changes or differences, but branch management, staging, commits, rebases, merges, resets, restores, stashes, pulls, and pushes are the user's responsibility.

## Path Conventions

- App routes and route handlers: `src/app/`
- Shared components: `src/components/`
- shadcn/ui components: `src/components/ui/`
- Study, LiveKit voice, and AI chat components: `src/components/study/`
- Service clients and utilities: `src/lib/`
- Shared context: `src/context/`
- Types and generated Supabase types: `src/types/`
- Global styles and CSS variables: `src/styles/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md with priorities P1, P2, P3...
  - Feature requirements from plan.md
  - Entities from data-model.md
  - API route contracts from contracts/
  - Sanad constitution requirements for Arabic/RTL, App Router, security,
    service contracts, and validation gates

  Tasks MUST be organized by user story so each story can be implemented,
  validated, and delivered independently. DO NOT keep these sample tasks in the
  generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare existing Sanad paths and dependencies without changing unrelated architecture

- [ ] T001 Confirm feature file paths in `src/app`, `src/components`, `src/lib`, `src/context`, `src/types`, or `src/styles`
- [ ] T002 Document required environment variables and local validation steps in `specs/[###-feature-name]/quickstart.md`
- [ ] T003 [P] Verify affected service contracts in `specs/[###-feature-name]/contracts/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core work that MUST be complete before any user story implementation begins

**CRITICAL**: No user story work can begin until this phase is complete.

Examples of foundational tasks, adjusted per feature:

- [ ] T004 Define shared TypeScript types in `src/types/[feature].ts`
- [ ] T005 [P] Add or update Supabase access utilities in `src/lib/[feature].ts` using generated database types
- [ ] T006 [P] Add route-handler input validation in `src/app/api/[route]/route.ts`
- [ ] T007 Document Clerk, Supabase, LiveKit, Bunny.net, Langfuse, or Vercel failure modes in `specs/[###-feature-name]/quickstart.md`
- [ ] T008 Confirm no server-only secrets are referenced from client components

**Checkpoint**: Foundation ready; user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own without assuming a test runner]

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement Server Component UI in `src/app/[route]/page.tsx`
- [ ] T010 [P] [US1] Implement focused client interaction in `src/components/[feature]/[component].tsx` only if required
- [ ] T011 [US1] Add data access or service call in `src/lib/[feature].ts`
- [ ] T012 [US1] Add Arabic loading, empty, and error states in `src/app/[route]/page.tsx`
- [ ] T013 [US1] Validate RTL, keyboard accessibility, and responsive behavior for affected UI files

**Checkpoint**: User Story 1 is fully functional and independently validated.

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own]

### Implementation for User Story 2

- [ ] T014 [P] [US2] Implement route or component change in `src/app/[route]/[file].tsx`
- [ ] T015 [US2] Integrate with existing components in `src/components/[feature]/[component].tsx`
- [ ] T016 [US2] Handle service failure mode with Arabic user-facing messaging
- [ ] T017 [US2] Confirm User Story 1 remains independently usable

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own]

### Implementation for User Story 3

- [ ] T018 [P] [US3] Implement route or component change in `src/app/[route]/[file].tsx`
- [ ] T019 [US3] Add or update supporting utility in `src/lib/[feature].ts`
- [ ] T020 [US3] Validate Arabic/RTL behavior and service error handling

**Checkpoint**: All requested user stories are independently functional.

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation that affect multiple user stories

- [ ] TXXX [P] Update documentation in `specs/[###-feature-name]/quickstart.md`
- [ ] TXXX Confirm no duplicate root providers were added under `src/app/`
- [ ] TXXX Confirm heavy browser-only features remain isolated in focused client components
- [ ] TXXX Confirm `src/types/database.types.ts` was regenerated with `pnpm update-db-types` if Supabase schema/types changed
- [ ] TXXX Run `nvm use`
- [ ] TXXX Run `pnpm lint`
- [ ] TXXX Run `pnpm type-check`
- [ ] TXXX Run `pnpm build` when practical
- [ ] TXXX Confirm no testing workflow, test framework setup, test directory, or test command was added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational; may integrate with US1 but remains independently validatable
- **User Story 3 (P3)**: Can start after Foundational; may integrate with US1/US2 but remains independently validatable

### Within Each User Story

- Data contracts and validation before dependent UI
- Server Components before client components unless interactivity requires otherwise
- Core implementation before service failure handling polish
- Arabic/RTL, accessibility, and responsive validation before checkpoint completion
- Story complete before moving to the next priority unless parallel ownership is explicit

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel within Phase 2
- After Foundational completion, independent user stories can proceed in parallel
- Components in different files can be implemented in parallel when they do not share state or dependencies

---

## Parallel Example: User Story 1

```bash
# Launch independent implementation tasks together when files do not conflict:
Task: "Implement Server Component UI in src/app/[route]/page.tsx"
Task: "Implement focused client interaction in src/components/[feature]/[component].tsx"
Task: "Add data access or service call in src/lib/[feature].ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate User Story 1 independently
5. Run required validation commands before completion

### Incremental Delivery

1. Complete Setup and Foundational work
2. Add User Story 1, validate independently, and demo if ready
3. Add User Story 2, validate independently, and demo if ready
4. Add User Story 3, validate independently, and demo if ready
5. Preserve previous story behavior with each increment

### Parallel Team Strategy

1. Team completes Setup and Foundational work together
2. Developers implement independent user stories in separate files where possible
3. Stories integrate only after independent validation passes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a specific user story for traceability
- Every task description includes exact file paths
- Each user story remains independently completable and validatable without assuming tests
- Avoid vague tasks, same-file conflicts, duplicate providers, unnecessary client components, Git management, and test commands that do not exist
