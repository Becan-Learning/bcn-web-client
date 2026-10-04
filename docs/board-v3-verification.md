# Board v3 — verification checklist (contract §9)

Contract: [frontend-board-spec-v3.md](frontend-board-spec-v3.md). Fixtures: unedited copy of
`bcn-lk-agent-main@62d9b47` in `src/lib/session/board/__fixtures__/`.

**How to check visually:** `pnpm dev`, open `/en/dev/board` (English harness chrome). Pick a fixture,
then Step or Play all, and switch Arabic · RTL / English · LTR and Reduce motion. The board's `md`
breakpoint follows the **browser window**, not the harness 320/390 frame. To see phone layouts
(cards, stacking), narrow the window or use device emulation at 390px and 320px.

**Columns**
- *Automated*: Vitest. Seam A replays the packet stream through `parseAgentMessage` →
  `sessionReducer`. Seam B renders the real `Board` to static HTML.
- *Early visual*: a headless-Chromium sweep on 2026-10-04 of all 63 fixtures × {ar, en} × {1280, 390,
  320}. It found no console errors and no board-level horizontal scroll in any of the 378 shots. Notes
  below are from screenshots taken **before** the integration fixes in `062e7dc`. ✓ = looked right,
  ⚠ = issue found and fixed in `062e7dc` (re-check), — = not looked at.
- *Your check*: pending.

## 9.1 v2 — verify

| Fixture(s) | Automated | Early visual | Your check |
|---|---|---|---|
| `frame-lifecycle` | End state + per-step behaviour (clear keeps visibility, hide keeps state, regional clears keep pinned/title) | — | ☐ |
| `progress-events` | Lesson/total/topic index/checkpoint/ending; board rev untouched by rev-free packets | — (needs live PDF) | ☐ |
| `add-heading/text/bullet/step`, `legacy-update-text` | End states; per-region Western step numbers | ✓ | ☐ |
| `add-definition` | One chunk, then reveal; hidden chunks absent from HTML | — | ☐ |
| `add-term`, `add-equation`, `equation-fallback` | Isolated halves; KaTeX; malformed → raw `<code>` | ✓ math, fallback | ☐ |
| `add-compare`, `add-table` | Logical columns; journal numbers LTR/end-aligned; empty cells kept | ✓ desktop table, phone cards, journal | ☐ |
| `add-chain`, `chain-static-break`, `legacy-slot-states` | `break_at:1` breaks connector into link 1 (B1 fixed); all four slot states | ✓ vertical phone arrows | ☐ |
| `add-blanks`, `legacy-update-fill`, `add-options` | No fill/`correct` in HTML; fills only after slot; no click handlers | ✓ | ☐ |
| `add-callout`, `callout-mistake/mnemonic/definition/example/exam` | Labels per kind | ✓ six distinct; loses_marks strongest, not error | ☐ |
| `legacy-annotations` | All six + null; title annotation now drawn | — | ☐ |
| `groups-box-columns`, `pin-and-clear`, `remove-item` | Group projection per region; member keeps `groupId`; ungrouped fallback | ✓ | ☐ |
| `eviction-live-13` | Remove-before-add; 12 live max | — | ☐ |
| `snapshot-full` | Restores all 17 kinds, 6 groups, stages, pens, marks, counts, slots; equal-rev replay clears divergence; stale/duplicate/gap/unknown-id fault tests | ⚠ desktop pinned band starved the live column (now capped) | ☐ |
| `sequence-*` | End states; rev-free progress | ✓ worked conversion | ☐ |
| `progress-events` with live PDF | — | — | ☐ live session |

## 9.2 v3 — build

| Fixture(s) | Automated | Early visual | Your check |
|---|---|---|---|
| `pens-all-roles` | `data-pen` per item; one accent owner | ⚠ accent was drawn twice (fixed) | ☐ |
| `markup-showcase` | Every marker → element; no raw markers; five pens | ✓ markup ⚠ named pen inside a pen'd item (fixed) | ☐ |
| `bidi-numbers` | `<bdi dir="ltr">` runs exactly as the specimen | ✓ **measured** visual order: `1 cm² = 10⁻⁴ m²`, `− 2 ⇒ −4` read L→R, `⇒` not mirrored, numbers as authored | ☐ |
| `add-note`, `add-divider`, nested `add-bullet` | Three sizes; one child level | ✓ | ☐ |
| `callout-verbatim` | Label "بنص الكتاب" / "Textbook text" | ✓ distinct double frame, both languages | ☐ |
| `add-equation`, `equation-long-aligned`, `mark-equation-span` | 600-char aligned; `\htmlClass` wrapping; missing match = unchanged; only generated classes trusted | ✓ fits at 390; denominator boxed, result underlined | ☐ |
| `table-static-states`, `add-table-progressive` | Four static states incl. header/empty; hidden rows absent; numbers above headers and card labels | ✓ phone cards with numbers | ☐ |
| `add-timeline`, `add-timeline-progressive` | Only revealed divisions/markers in DOM; LTR axis; marker pen inheritance | ✓ ⚠ label-less marker looked broken (now a dot) | ☐ |
| `scenario-attached-icons`, `add-icon`, `icon-unknown-placeholder` | One unit per icon; attachment fallback; unknown → placeholder + label; every catalogue name resolves | ✓ units wrap at 390 ⚠ double accent on icons (fixed) | ☐ |
| `example-worked/faded/try` | Example badge, stage badge, solid/dashed/dotted frame | ✓ (see Q-INT-1: heading repeats stage label) | ☐ |
| `mark-item/row/cell/column/option/span/division-states` | All scope×state pairs; accumulate then clear; focus siblings | ✓ accumulation ⚠ dim was imperceptible (now opacity 0.7) ⚠ column ✓/✕ in every cell (now once in header) | ☐ |
| `mark-compare-addresses`, `mark-item-all-kinds`, `mark-span-text-kinds` | aspect/x/y in table and cards; every kind | ✓ cards keep coordinates | ☐ |
| `mark-accumulate-clear`, `snapshot-full` | Order kept; item clear removes all, keeps static/legacy; hidden marks wait; focus recomputes after pin/remove | — | ☐ |

## Also to check

- **Reduced motion:** no entry fade, exit fade or layout movement; same final state. Not checked
  visually.
- **Exit animation** (new in `062e7dc`): removed/moved items fade in about 150ms.
- **English (LTR) alignment** of Arabic strings in options/table/compare/chain/blanks/timeline/icon
  labels (fixed in `062e7dc`).
- **Live sessions:** one per language against backend `feat/board-v3`. Open the session with
  `?boardDebug=1` (outside production), click *Export JSON* at the end, then *Import recorded JSON* in
  the harness and replay it.
