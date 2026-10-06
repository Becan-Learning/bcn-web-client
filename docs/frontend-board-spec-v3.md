# Teaching board — frontend contract v3

## 0. How to read this contract

This file replaces the v2 contract and is sufficient to implement the complete teaching board.
The backend owns content, identity, order, regions, visibility and mutations. The frontend renders
structured items beside the voice session and PDF; it does not infer teaching events from speech.
The companion `board-fixtures.json` is the executable input catalogue. Each named fixture starts
with an empty board, `board_clear` with `scope: "all"`, then `board_show`.

**v2 — verify** means existing contract/agent behavior whose frontend implementation is unknown.
**v3 — build** means new behavior in this contract; it does not claim that the current backend
already publishes it. An existing kind retains the v2 label while its new features have v3 labels.
All v3 fields below are the target wire contract for the ordered T1–T5 backend work.

Reliable LiveKit data packets on topic `ui-control` contain UTF-8 JSON, one `action` per packet.
Guard JSON parsing and dispatch board events before the existing progression-event handler. No
acknowledgement is expected. Ids are opaque strings; never parse their prefixes or use array positions
as identity. There are no coordinates or generation ids. Render strings as text plus the grammar
in §4, never as arbitrary HTML.

The frontend never receives anchors, beat/segment source ids, `cast_id`, `relabel`, bilingual choice
objects, segment roles, matcher probabilities or colour values. ADR-0004 resolves session language
once when loading the plan (English fallback backend-side). Every student-facing wire field is a
plain string. The existing `term` payload deliberately has two plain string fields, `en` and `ar`;
it is a bilingual token, not a language-choice object. No client language resolver is needed.

Examples use the real Arabic and English `units_prefixes_and_conversion` plans. Newly authored
shapes reuse their units/conversion material; specimen-specific bidi/scenario examples are identified.
The appendix maps every ADR-0005 in-scope BRD id. Existing supporting requirements have extra rows.

### Changes from v2

- v2's “every message has rev” applies to board messages only. Code sends `set_lesson`, `set_topic`,
  `topic_done`, `scroll` and session events without `rev`. `set_topic.current_topic_index` is one-based;
  total topics come from `set_lesson.number_of_topics`, not `set_topic` (also correcting ADR-0005's
  context table). `session_ending` also carries `message`, as serialized in `main.py`. Snapshots report
  the current revision and do not increment it.
- Topic start clears all and sets a title. `board_show` is emitted only if previously hidden; a
  visible board does not receive a redundant show. `board_hide` has no production runtime caller.
- Eviction is implemented now for live/temporary. A full pinned region rejects adds; pin/unpin into
  a full destination also rejects the operation. There is no client eviction.
- Code marks the selected checkpoint option only. v2's checklist promising both wrong and correct
  options after a wrong answer was too strong; render additional marks only when sent.
- Removing a member does not remove its group. Pinning changes only the member's region, preserving
  `group_id`; it does not move the container. §2 covers that layout case.
- v3 adds pens, marks, markup, note/divider/timeline/icon, nested bullets, table cell states/numbering/
  progressive reveal, verbatim callouts, example/scenario groups and stage. Equations grow to 600
  characters. The old code's 180-character LaTeX cap is superseded for v3.
- The v2 ban on horizontal scrolling remains for tables/comparisons. A timeline uses its own
  horizontally scrollable axis on a portrait phone (§5.16). Generated step numbers use Western
  digits (§4.3); the old locale-numbering workaround is superseded by the authored-number rule.

## 1. Frame and lifecycle

**v2 — verify**, except the progress presentation, **v3 — build** (BRD-804).
The frame has a topic title, pinned reference band, live column and temporary detour tray. Use
`min-w-0`/`min-h-0` on flex/grid parents, bounded vertical scrolling and a stable PDF/voice layout.
Keep the pinned band accessible while live content scrolls. Empty regions need not display a label.

Initialize a new session hidden, empty, with no revision baseline or progression metadata. The
local `board_reset` event on session start, disconnect and teardown is client cleanup, **not a wire
packet**: clear items/title/groups, hide, reset revision and resync flags, and clear lesson progress.
Never carry a board into another session. Hide preserves stored state; show exposes it again.
Clear preserves visibility. `all` clears title, all items and all groups; `live`/`temporary` clear
only items and groups in that region and preserve title and other regions. There is no `pinned`
clear scope; pinned items go away on `all` or individual remove.

The topic boundary is deterministic and immediate: clear all → show if needed → set title. Pinned
reference material survives a live turnover, not a topic boundary. `set_topic`/`topic_done`/`set_checkpoint` update
progress/checkpoints and must not themselves guess a board clear; consume the separate board events.

### 1.1 Frame messages

```json
{"action":"board_clear","scope":"all","rev":1}
{"action":"board_show","rev":2}
{"action":"board_set_title","id":"board-title-units","text":"4 · تحويل الوحدات","rev":3}
{"action":"board_hide","rev":4}
```

| Action | Fields in addition to `action` | Effect |
| --- | --- | --- |
| `board_show` | `rev: integer` | Show the stored board. |
| `board_hide` | `rev: integer` | Hide the board without clearing it. Retain this supported branch. |
| `board_clear` | `scope: all \| live \| temporary`, `rev` | Clear the addressed state; absent scope defensively means all. |
| `board_set_title` | `id: string`, `text: string ≤80`, `rev` | Replace the separate title; it consumes no item capacity. |

Title has `dir="auto"`, wraps, and has larger type than an item heading. No frontend recasing,
trimming, truncating or automatic title derived from a group is allowed.

### 1.2 Progression and adjacent session messages

These existing packets have **no `rev`** and do not enter the board revision stream.

```json
{"action":"set_lesson","lesson":"units_prefixes_and_conversion_ar","number_of_topics":6}
{"action":"set_topic","topic":"2 · الوحدات الأساسية السبع","current_topic_index":3}
{"action":"set_checkpoint","checkpoint":{"id":"t3-q:1","text":"وحدة الكتلة في النظام الدولي؟","choices":["باوند (Pound)","جرام (Gram)","كيلوجرام (Kilogram)","أونصة (Ounce)"]}}
{"action":"topic_done","topic":"2 · الوحدات الأساسية السبع"}
{"action":"scroll","page":4}
{"action":"session_ending","message":"Session ending due to time limit."}
```

| Action | Fields | Frontend responsibility |
| --- | --- | --- |
| `set_lesson` | `lesson: string` (slug), `number_of_topics: positive integer` | Store lesson and total; replace progress metadata for a new lesson. |
| `set_topic` | `topic: string`, `current_topic_index: positive integer` (one-based) | Set the current topic. It no longer carries the checkpoint. |
| `set_checkpoint` | `checkpoint: {id, text, choices} \| null` | Open or close the checkpoint. See [agent-contract-checkpoint.md](agent-contract-checkpoint.md). |
| `topic_done` | `topic: string` | Mark completion in existing progression UI; do not invent another board mutation. |
| `scroll` | `page: integer` | Existing PDF navigation; no board effect. |
| `session_ending` | `message: string` | Existing session-ending UI/lifecycle and reason; not a board hide command. |

Display “3 of 6” / “3 من 6” from current index and total, optionally a bar with `index / total`.
Do not add one to the index; the plan's heading “2” can be topic index 3 because it includes an
orientation topic. Until both fields arrive, hide the fraction/bar rather than dividing by zero.
The label may use the session UI locale; wire content needs no language selection.

## 2. Regions, capacity, groups and phone frame

| Region | Capacity | Meaning and lifecycle | Status |
| --- | --- | --- | --- |
| `pinned` | 6 items | Quiet reference band; persists through live clears. | **v2 — verify** |
| `live` | 12 items | Current explanation; scroll vertically when needed. | **v2 — verify** |
| `temporary` | 4 items | Distinct provisional remediation tray; clears when detour ends. | **v2 — verify** |

Title and group containers do not consume capacity; every item, including divider/icon, consumes
one slot. In a full live/temporary region, the backend evicts its oldest unpinned item: a
`board_remove` arrives **before** the new `board_add` (BRD-405). Never independently prune items,
reject a thirteenth message, or guess which item to keep. A full pinned region rejects an add without
publishing it. Failed pin/unpin into a full destination likewise produces no packet.

Maintain each region's order as the global insertion order filtered by region. A pin moves the
existing item to its destination without recreating its id/state or reordering unrelated items.
Animate removal and movement briefly, respecting reduced motion. On portrait, retain one vertically
flowing board, wrapping strings instead of clipping; cards and bounded local math/timeline overflow
must not cause horizontal scrolling of the whole page. Test at 390px and a narrower 320px viewport.

### 2.1 Groups

| `kind` | Rendering | Status |
| --- | --- | --- |
| `box` | One bordered container with its heading and ordered members. | **v2 — verify** |
| `columns` | Members side by side on wide screens, vertically stacked under heading on phone. | **v2 — verify** |
| `example` | Unmistakable example container: labelled example badge, strong frame and contained working. Must differ from a single `callout.kind: example`. | **v3 — build**, BRD-621 |
| `scenario` | Named scene assembled one icon item at a time. Attached icons sit beside their targets; wrap complete icon/label units on phones. | **v3 — build**, BRD-601 |

A group arrives before its first member, usually in the same burst. `heading` is required, nonempty,
≤80 characters. Do not treat it as an item or number it as a step. An empty group is valid; hide
its empty shell, or show heading alone. Removing the last member does not implicitly delete stored
group metadata. Region clear removes groups whose `region` matches the scope; all clear removes all.

`stage` is independent of group kind and is null or `worked | faded | try`. Backend maps
`worked_example → worked`, `faded_example → faded`, `now_you_try → try`; roles never reach the client.
All group kinds honor stage. Give these three glanceable treatments (**v3 — build**, BRD-622):

| Stage | Meaning | Required distinction; suggested treatment |
| --- | --- | --- |
| `null` | No example-role signal | Ordinary group treatment. |
| `worked` | “I'm watching” / “أنا أشاهد” | Tutor-led badge + solid frame/background. |
| `faded` | “I'm filling in” / “أنا أملأ” | Shared-work badge + dashed frame. |
| `try` | “This one is mine” / “هذا لي” | Your-turn badge + dotted frame. |

Do not fabricate blanks from stage; only the item's blanks payload makes blanks. Stage labels use
UI locale. Frame pattern/label must distinguish stages without colour. Keep headings/stage badges
visible with members on phone; stack columns and wrap scenario rows.

Pinning can leave members in different regions from their group metadata. Project that container's
heading/style separately around its members in each occupied region, with `group_id` retained. If a
clear removed the referenced group, render remaining members as ungrouped items, never lose them.
An icon attachment across regions or to a removed icon falls back to an ordinary icon/label unit.

## 3. Wire protocol and reducer state

Every `board_*` packet below has `action: string` and `rev: nonnegative integer`. Board mutations
increase rev by one per emitted packet, including prep packets and eviction. Snapshot reports the
current rev without increasing it. All fields shown are required unless explicitly optional.
Legacy v2 packets omit new `pen`/`stage`/`marks`; accept them as null/null/[] during rollout. New v3
serializers must emit them. Missing `group_id` may defensively be treated as null. Each message
example here is one packet; repeated examples illustrate successive packets, not JSON arrays.

### 3.1 `board_add`

```json
{"action":"board_add","id":"board-step-given","region":"live","kind":"step","payload":{"text":"المعطى: 300 cm"},"group_id":null,"pen":"construct","rev":4}
```

| Field | Type / constraint | Meaning |
| --- | --- | --- |
| `id` | opaque string | Item identity for all later operations. |
| `region` | live \| pinned \| temporary | Owning region. |
| `kind` | one of the 17 kinds in §5 | Selects payload/rendering. |
| `payload` | kind-specific object | Fixed schema in §5. Empty object allowed for divider. |
| `group_id` | string or null | Earlier group id, or ungrouped. |
| `pen` | null \| mark \| construct \| flow \| trap \| alt | Semantic accent; **v3 — build**. |
| `rev` | integer | Board revision. |

Initialize annotation null, slots {}, marks [], and revealed as in §3.9. Add appends in global item
order. Groups retain members' order. The client must not display private correct/fill answers.

### 3.2 `board_update` — backward-compatible mutations

```json
{"action":"board_update","id":"board-text-rule","text":"الأساسية تُقاس مباشرة بلا معادلة","rev":7}
{"action":"board_update","id":"board-blanks-mass","slot":"u","text":"كيلوجرام (kg)","rev":8}
{"action":"board_update","id":"board-options-mass","slot":"opt-gram","state":"wrong","rev":9}
{"action":"board_update","id":"board-chain-convert","slot":"1","state":"broken","rev":10}
```

| Form | Required fields besides action/rev | Effect |
| --- | --- | --- |
| Whole text | `id: string`, `text: string ≤180` (no slot) | Replace only `payload.text`; applicable to heading/text/bullet/step/note/callout. Preserve children, callout kind and other state. |
| Blank fill | `id: string`, `slot: blank id`, `text: string ≤180` | Set `slots[slot]` to displayed fill; do not reveal other fills. |
| Option/link state | `id: string`, `slot: option id or stringified 0-based chain index`, `state: correct \| wrong \| broken \| key` | Set `slots[slot]` to state. |

Slots do not modify authored payload answers. Whole-text updates never replace table rows or LaTeX.
Marks remain stored; rerender span matches against current text and ignore missing matches. Old slot
states stay supported; new marking behavior uses `board_mark`.

### 3.3 `board_annotate` — backward-compatible whole-item annotation

```json
{"action":"board_annotate","id":"board-text-rule","kind":"key","rev":11}
{"action":"board_annotate","id":"board-text-rule","kind":null,"rev":12}
```

| Field | Type | Effect |
| --- | --- | --- |
| `id` | item or title id | Target. |
| `kind` | null \| key \| warning \| correct \| wrong \| broken \| dim | Replace the single annotation; null clears only annotation. |
| `rev` | integer | Revision. |

`key` is the current-point strong emphasis; normal item use is exclusive. Moving it emits clear old
then set new. The serializer's title annotation branch does not clear an old title key when a normal
item becomes key; render explicit packets without inventing exclusivity cleanup. `warning` is exam
weight, not an error; correct/wrong have success/error icons and labels; broken strikes the item or
marks its chain connector; dim reduces emphasis but stays legible. New marks and legacy annotation
are independent; clearing one never erases the other. See §6.3 for visual composition.

### 3.4 `board_mark` — accumulated addressed marks

**v3 — build.**

```json
{"action":"board_mark","id":"board-table-si","scope":"row","index":1,"cell":null,"option":null,"match":null,"state":"correct","rev":13}
```

| Field | Type / constraint | Meaning |
| --- | --- | --- |
| `id` | item id | Target already on the board. |
| `scope` | item \| row \| cell \| column \| option \| span \| division | Address type; see §6. |
| `index` | integer or null | Required nonnegative 0-based index for row/column/division; null otherwise. |
| `cell` | [row, col] or null | Nonnegative 0-based data-row/column pair for cell; null otherwise. |
| `option` | string or null | Exact option id for option; null otherwise. |
| `match` | string or null | Nonempty exact substring for span; null otherwise. |
| `state` | highlight \| correct \| wrong \| dim \| strike \| focus \| clear | Mark semantics in §6. |
| `rev` | integer | Revision. |

Every address field is present; unused fields are null. Item uses no address fields. Rows never count
the header. Clear removes stored entries rather than appending a clear entry to snapshot marks.

### 3.5 `board_remove`

```json
{"action":"board_remove","id":"board-text-detour","rev":14}
```

| Field | Type | Effect |
| --- | --- | --- |
| `id` | item id | Remove item and all its per-item state; retain other members and group metadata. |
| `rev` | integer | Revision. |

Archive/recall is backend-only. A recall reaches the frontend as a normal add with a new opaque id;
there is no recall wire action. A removed focus mark stops dimming siblings immediately.

### 3.6 `board_reveal`

```json
{"action":"board_reveal","id":"board-definition-base","index":1,"rev":15}
```

| Field | Type | Effect |
| --- | --- | --- |
| `id` | definition, progressive table or progressive timeline id | Target. |
| `index` | nonnegative integer | Index of newly visible chunk/data row/division. Set visible count to at least index+1, bounded by length. |
| `rev` | integer | Revision. |

Definitions are **v2 — verify**; table/timeline reveals are **v3 — build**. No payload append is sent:
the full authored content is already in the add payload. Hide unrevealed content from sight and the
accessibility tree; do not put it in a tooltip. Out-of-range indices or reveal on another kind are
ignored defensively. Reveals never reduce visible count.

### 3.7 `board_pin`

```json
{"action":"board_pin","id":"board-step-given","pinned":true,"region":"pinned","rev":16}
{"action":"board_pin","id":"board-step-given","pinned":false,"region":"live","rev":17}
```

| Field | Type | Effect |
| --- | --- | --- |
| `id` | item id | Move existing item. |
| `pinned` | boolean | true pins; false unpins. |
| `region` | pinned \| live | Authoritative destination. |
| `rev` | integer | Revision. |

Preserve identity, payload, revealed count, slots, annotation, pen, marks and group id. There is no
pin boolean in snapshots: pinned state is derived from region. Recompute item-focus siblings after
movement. A group member does not move its entire group (§2.1).

### 3.8 `board_group`

```json
{"action":"board_group","id":"board-group-worked","region":"live","kind":"example","heading":"حوّل 300 cm إلى m","stage":"worked","rev":18}
```

| Field | Type / constraint | Meaning |
| --- | --- | --- |
| `id` | opaque group id | Container identity. |
| `region` | live \| pinned \| temporary | Container metadata and clear ownership. |
| `kind` | box \| columns \| example \| scenario | Layout/treatment (§2.1). |
| `heading` | nonempty string ≤80 | Required visible container heading. |
| `stage` | null \| worked \| faded \| try | Independent stage treatment; **v3 — build**. |
| `rev` | integer | Revision. |

Box/columns are **v2 — verify**; example/scenario are **v3 — build**. No group-remove action exists.

### 3.9 `board_snapshot`

```json
{
  "action":"board_snapshot",
  "rev":22,
  "visible":true,
  "title":{"id":"board-title-units","kind":"title","region":"live","payload":{"text":"4 · تحويل الوحدات"},"group_id":null,"annotation":null,"revealed":1,"slots":{},"pen":null,"marks":[]},
  "groups":[{"id":"board-group-worked","kind":"example","region":"live","heading":"حوّل 300 cm إلى m","stage":"worked"}],
  "items":[{"id":"board-table-si","kind":"table","region":"live","payload":{"variant":"plain","header":["الكمية","الوحدة","الرمز"],"rows":[["الطول","metre","m"],["الكتلة","kilogram","kg"]],"reveal":"progressive"},"group_id":"board-group-worked","annotation":null,"revealed":2,"slots":{},"pen":"construct","marks":[{"scope":"row","index":1,"cell":null,"option":null,"match":null,"state":"correct"}]}]
}
```

| Top-level field | Type | Meaning |
| --- | --- | --- |
| `rev` | integer | Current authoritative revision; not a fresh mutation. |
| `visible` | boolean | Restored frame visibility. |
| `title` | null or item-shaped title record | Separate title, not in items and not a 18th add kind. |
| `groups` | group record array | `{id,kind,region,heading,stage}`; no action or individual rev. |
| `items` | item record array | Global render order; restore every field below. |

| Item/title field | Type | Meaning |
| --- | --- | --- |
| `id`, `kind`, `region`, `payload`, `group_id` | same meanings as add; title kind is title | Identity/content/grouping. |
| `annotation` | null or annotation kind | Legacy whole-item annotation. |
| `revealed` | integer | Definition visible chunks; table visible data rows; timeline visible divisions. |
| `slots` | object mapping string → string | Blank visible fills or option/chain states, not authored correct/fill values. |
| `pen` | null or one of five pens | Semantic accent on every record, including title (normally null). |
| `marks` | array of `{scope,index,cell,option,match,state}` | Surviving marks in application order; no id, action or rev in entries. |

For definitions, initialize count 1. For progressive table/timeline initialize 1; without reveal
initialize to all rows/divisions. Other kinds and title use revealed 1 (not meaningful). Table and
timeline records from v3 must carry actual visible counts; old v2 nonprogressive tables used 1,
which must still display the full table. Snapshot marks never contain clear. Restore annotation,
slots, static cell states and marks without re-running reveal animations or exposing hidden answers.
Replace all stored state atomically; do not merge missing items or groups with stale local ones.
The fixture `snapshot-full` contains all 17 kinds within capacities and all group styles/stages.

## 4. Text rendering, pens, bidi and numbers

### 4.1 Inline markup — v3 — build

Parse only these non-nesting markers inside the permitted payload strings:

| Authored string | Render |
| --- | --- |
| `**bold**` | Strong emphasis. |
| `__underline__` | Underline. |
| `==highlight==` | Highlight background using item pen, or default mark pen when null. |
| `=={construct}highlight==` | Highlight with explicit named pen (any of the five). |
| `~~strike~~` | Strikethrough. |
| `^{superscript}` | Superscript of braced content. |
| `_{subscript}` | Subscript of braced content. |

The backend guarantees balanced markers, no nesting and valid pen names. The frontend may render
unmatched markers literally. Tokenize `___` placeholders for blanks before treating `__` as an
underline marker. No Markdown links, headings, lists, backtick code, HTML, escaping language or
nested expressions are added to this grammar. Render ordinary punctuation and whitespace as authored.
The 180-character limit counts text after removing markup delimiters and pen-name syntax, retaining
visible content. Every string other than LaTeX is ≤180; title/group heading additionally ≤80.

Allowed fields: heading/text/note/step text; bullet text and children; callout text; compare
aspect_label/columns/rows aspect,x,y; table header/cell text; options stem/option text; blanks
template; timeline axis_label/division labels/marker labels; icon label.
Never parse markup in equation latex, term en/ar, definition chunks or key_words, blanks fill,
ids, icon names, chain links, title or group heading. The chain/title/group restriction follows the
brief's exhaustive allowed-field list. Definitions retain `key_words` emphasis.

### 4.2 Pens — v3 — build (BRD-701, BRD-108)

`pen: null | mark | construct | flow | trap | alt` is an item-level role, not a success/error state.
Use it consistently on accents, icons and unqualified highlights; do not recolour all body text
so heavily that reading becomes difficult. Marker-level timeline pen overrides item pen; null
inherits item pen, then ordinary neutral accent. Explicit inline pen overrides inherited highlight.

The frontend must define all five colour tokens for both themes. This contract's reference palette
is below; implementations may tune values while retaining role distinctions and accessible contrast.
Use accent colours on borders/glyphs and light tinted backgrounds, with readable theme body text.

| Pen | Role | Light accent | Dark accent |
| --- | --- | --- | --- |
| `mark` | Point out / emphasize | `#9A6700` | `#FFD166` |
| `construct` | Build the explanation | `#175CD3` | `#84ADFF` |
| `flow` | Movement / progression | `#067647` | `#75E0A7` |
| `trap` | Exam trap / caution | `#B54708` | `#FEB273` |
| `alt` | Alternate case / contrast | `#6938EF` | `#BDB4FE` |

Null uses normal theme styles. Trap is caution (e.g. amber), distinct from wrong-answer red and its
✕. A mark has no pen field: highlight uses target's pen/default mark; correct/wrong use independent
success/error symbols, labels and state styling. Verify normal text contrast of at least 4.5:1,
large text 3:1 and meaningful nontext cues 3:1. Dimmed text must remain readable in both themes.

### 4.3 Bidi and numbers

Per item, title, group heading and text-bearing cell use `dir="auto"`. Isolate bilingual term halves
independently. Equations and journal numeric cells are always LTR, even in an Arabic board.

**v3 — build**, BRD-110: every run starting with a Latin letter, Western digit or signed number
is an LTR isolate: `<bdi dir="ltr">…</bdi>`. Continue through Latin words, Western numbers, unit
symbols, superscript/subscript characters, whitespace connecting them and math punctuation such as
`= + − - × ÷ / . , ( ) % ± ≤ ≥ ≠ → ← ⇒`. Stop before Arabic prose. Include a sign separated
from its digit by spaces (e.g. `− 2`). Keep the unit and its exponent in the same run; don't isolate
only each digit. Parsing markup first must not split an isolate at a styled token: wrap the entire
logical run, with styled children inside it. Arrows keep their authored glyph/direction; no RTL
transform or replacement mirrors `→`, `←` or `⇒`. This rule also applies to labels and filled blanks.

Specimen test line, exactly:

```text
نحوّل الـ conversion factor فنحصل على 1 cm² = 10⁻⁴ m²
```

Expected visual reading: Arabic prose follows RTL flow; `conversion factor` reads left-to-right
between “نحوّل الـ” and “فنحصل على”; the final isolate reads left-to-right in this order:
`1` → `cm²` → `=` → `10⁻⁴` → `m²`. The exponent −4 stays attached to 10, and each ² stays with
its unit. Also test `الأس تضاعف: − 2 ⇒ −4`: its numeric isolate reads `− 2 ⇒ −4` left-to-right,
with the authored ⇒ pointing right. Use element positions/screenshots to verify, not just DOM text.

**v3 — build**, BRD-109: never reformat authored numbers. Do not insert separators, change digits,
round or apply a locale formatter. `120,000`, `0.04`, `10⁻⁴` and `1000` stay exactly those strings.
Authors choose Western digits and thousands separators. Generated step/column numbering and the
progress fraction use Western digits as well. Existing per-item direction/mixed-script wrapping is
**v2 — verify**; stronger automatic LTR-run isolation is new.

### 4.4 Three text sizes and accessibility

Heading > body > note (**v3 — build**, BRD-105). Suggested sizes are 20/18/14px, with note line
height 1.5; title is larger than heading. Notes are muted but readable, never collapsed tooltips.
Keep body content selectable, preserve long Latin term wrapping, and use labels/icons with graded
states. Options are voice-response displays without click handlers. No student editing, dragging
or resizing. Use a polite announcement of added/revealed/changed content without reading hidden
answers. Honor `prefers-reduced-motion`: remove movement/fade effects, apply the same final state.

## 5. All 17 item kinds

Every subsection's strings follow §4 limits; arrays have only the explicit bounds stated below.
Collections without a specified numeric maximum are nonempty, not arbitrarily capped by the client.
Every kind accepts item marks and legacy annotations (§6). Text-bearing kinds accept span marks on
the fields listed in §6.1, independently of whether inline markup is supported there. Applicable
marks are never a reason to hide an item. Except progressive definition/table/timeline, all payload
content appears on add (private blanks fills and options correct flags remain concealed).

### 5.1 `heading`

**v2 — verify**; inline markup/pens/marks **v3 — build**. BRD-102–110 as applicable.
Payload: `{text: nonempty string ≤180}`.

```json
{"text":"4 · Converting units"}
```

A stage heading within the topic, smaller than the board title and larger than body. Whole-text
update allowed; item/span marks and annotations apply. No progressive reveal. On portrait wrap
heading and isolate the numeric prefix; never truncate it. Fixture: `add-heading`.

### 5.2 `text`

**v2 — verify**; markup/pens/marks **v3 — build**. BRD-002, BRD-102–110, BRD-407.
Payload: `{text: nonempty string ≤180}`.

```json
{"text":"المطلوب: حوّل 300 cm إلى m"}
```

Plain body line. Whole-text update and item/span marks; no progressive reveal. Portrait wraps Latin
runs and Arabic prose with no clipping; superscripts remain attached. Fixture: `add-text`.

### 5.3 `bullet`

**v2 — verify**; optional children, markup/pens/marks **v3 — build**. BRD-121, BRD-102–110.
Payload: `{text: nonempty string ≤180, children?: string[1..6]}`, each child nonempty and ≤180.

```json
{"text":"الطول — متر (m)","children":["الكتلة — كيلوجرام (kg)","الزمن — ثانية (s)"]}
```

Parent bullet marker plus one indented child list, one level only. Do not number children or treat
them as separate region items; they arrive with their parent. Whole-text update replaces parent
only. Item/span marks include child text; no child-specific scope. Portrait uses modest logical
indent so children retain useful line width, wrapping with their markers. Fixture: `add-bullet`.

### 5.4 `step`

**v2 — verify**; markup/pens/marks and Western numbering **v3 — build**. BRD-109, BRD-110.
Payload: `{text: nonempty string ≤180}`.

```json
{"text":"المعطى: 300 cm"}
```

Number steps 1, 2, 3… within each region's current ordered step items, ignoring nonsteps/group
headings. Recompute after removals/clear/moves; no number field exists on the wire. Whole-text update,
item/span marks; no reveal. Phone: marker column beside wrapping text. Fixture: `add-step`.

### 5.5 `note`

**v3 — build**, BRD-105. Payload: `{text: nonempty string ≤180}`.

```json
{"text":"الأساسية تُقاس مباشرة بلا معادلة"}
```

Smaller/muted third text size for side explanation, no bullet marker. Whole-text update, item/span
marks and annotations; no reveal. On portrait remain inline in board flow and readable without
expansion. Fixture: `add-note`.

### 5.6 `definition`

**v2 — verify**; item/span marks and pen **v3 — build**. Supporting BRD-122; BRD-104 retains keyword emphasis.
Payload: `{chunks: string[2..6], key_words: string[]}`. Chunks/keywords nonempty and ≤180;
key_words array may be empty. No inline markup in either field.

```json
{"chunks":["A fundamental quantity is measured directly,","without an equation"],"key_words":["directly","without an equation"]}
```

Show chunk 0 on add, then each reveal index exposes that chunk in order. Match keyword occurrences
case-insensitively without stemming in visible chunks; consistently emphasize them. Preserve sentence
spacing at chunk boundaries. Item/span marks apply to visible chunk strings; no row scope. Phone
wraps the joined definition, with a brief reveal fade or stable reserved height if useful; no jump
that loses the current reading position. Fixture: `add-definition`.

### 5.7 `term`

**v2 — verify**; item/span marks and pen **v3 — build**. BRD-110, supporting BRD-105.
Payload: `{en: nonempty string ≤180, ar: nonempty string ≤180}`, neither permits inline markup.

```json
{"en":"conversion factor","ar":"معامل التحويل"}
```

English exam form primary, Arabic gloss smaller/muted, parenthesized or second line. Explicitly
isolate en LTR and ar RTL. This kind is the deliberate two-language exception. Item/span marks
can address either string; no whole-text update or reveal. On phone stack halves when necessary,
wrap long English terms, keep the gloss bound to its English token. Fixture: `add-term`.

### 5.8 `equation`

**v2 — verify** rendering; 600-character limit and span marks **v3 — build**. BRD-201, BRD-202.
Payload: `{latex: nonempty string ≤600, display: boolean}`. No inline markup in latex.

```json
{"latex":"\\begin{aligned}300\\ \\text{cm}\\times\\dfrac{1\\ \\text{m}}{100\\ \\text{cm}}&=\\dfrac{300}{100}\\ \\text{m}\\\\&=3\\ \\text{m}\\end{aligned}","display":true}
```

Use KaTeX with its CSS (an existing MathJax implementation must provide equivalent coverage,
including the span treatment). Support fractions, exponents, roots, `± × ÷ ≈ ≤ ≥ ≠ →`, and aligned
multiline solutions. Display true: centered own line; false: inline-sized math inside its item.
Always isolate rendered math LTR. Malformed math falls back to raw LaTeX without reducer exceptions.
Only item/span marks and annotations; no update latex operation, no reveal per aligned line.

For span marks, exact-match the **original** LaTeX substring and wrap with
`\htmlClass{board-mark-STATE}{matched latex}` before rendering. Ignore missing matches. Only allow
frontend-generated known classes in KaTeX's trust callback for `\htmlClass`, not general trusted
commands or HTML. Preserve original latex for later clear/re-render. A match that makes invalid
LaTeX falls back safely. Phone: fit/scale within readable limits; long aligned math may scroll
horizontally **inside the equation**, never rotate phone or scroll the whole page. Fixture:
`add-equation`; `mark-equation-span`.

### 5.9 `compare`

**v2 — verify**; markup/pens/marks **v3 — build**. BRD-301, BRD-302, BRD-304, BRD-407.
Payload: `{aspect_label: string, columns: [string,string], rows: [{aspect:string,x:string,y:string},…]}`.
All strings nonempty ≤180; rows nonempty (2–4 recommended, not a validator limit).

```json
{"aspect_label":"الوجه","columns":["أساسية (Fundamental)","مشتقة (Derived)"],"rows":[{"aspect":"المعادلة","x":"ما لها","y":"لها"},{"aspect":"أمثلة","x":"طول · كتلة · زمن","y":"مساحة · سرعة · كثافة"}]}
```

Wide: three-column table, aspect/x/y with aligned rows. `x` is columns[0], `y` columns[1]. Row/cell/
column/item/span marks and annotations apply; compare cells remain strings (static cell objects
are table-only). For mark coordinates, logical columns are **0=aspect, 1=x, 2=y**, irrespective of
RTL visual placement; rows index data rows. No progressive reveal.

Portrait: each row becomes a card with aspect as heading and two labelled aligned fields. Repeat
both column names on every card; consistent side accents maintain contrast. No horizontal scroll
or rotation. Cell/column marks still target their logical fields in cards; aspect-column marks
style card headings. Fixture: `add-compare`, `mark-compare-addresses`.

### 5.10 `table`

**v2 — verify**; object cells, numbered columns, progressive reveal, markup/pens/marks **v3 — build**.
BRD-123, BRD-301–304, BRD-004, BRD-407.
Payload: `{variant: "plain"|"journal", header: Cell[], rows: Cell[][], numbered_columns?: true,
reveal?: "progressive"}`. Header and rows nonempty. Cell is a string ≤180 (empty allowed in rows)
or `{text: string ≤180, state: "highlight"|"correct"|"wrong"|"dim"}`. Header text nonempty.
Each row has exactly one cell per header column. `numbered_columns` absent means no numbering.

```json
{"variant":"plain","header":["الكمية","الوحدة","الرمز"],"rows":[["الطول","metre","m"],["الكتلة",{"text":"kilogram","state":"highlight"},"kg"]],"numbered_columns":true,"reveal":"progressive"}
```

Style header distinctly and preserve empty-cell geometry. Numbered columns print Western 1, 2, 3…
**above** headers, mapping to 0-based wire indexes. No extra payload column is added. Static cell
states use the same visible state cues as marks; clearing marks restores authored cell state.
`journal` headers' text values must be exactly Account, Debit, Credit (English even in an Arabic
session). Debit/credit numeric cells: LTR, right aligned, tabular figures. Never format numbers.

Progressive add shows header plus first data row; further reveal indexes show successive data rows.
Without reveal, all rows show on add. Item/row/cell/column/span marks and annotations apply;
column mark includes header and visible data cells. Marks on unrevealed rows are stored, applied
when revealed, and never expose hidden rows. Portrait: one card per visible row, header repeated
as field labels; numbered headers repeat their number above each field label. Numeric journal
fields stay right aligned. No horizontal scroll or rotation. Fixtures: `add-table`,
`add-table-progressive`, `table-static-states`, `mark-row-states`, `mark-cell-states`,
`mark-column-states`.

### 5.11 `chain`

**v2 — verify**; item/span marks and pen **v3 — build**. No new chain/diagram vocabulary is added.
Payload: `{links: string[2..7], break_at: integer|null}`. Nonempty links ≤180, no inline markup.
`break_at` is null or 1..links.length−1: the connector entering the link with that zero-based
position is broken (the first connector is 1). This is the v2 “1-based connector index”.

```json
{"links":["Convert the edge first","Then square it"],"break_at":null}
```

Wide: boxes with visible connectors. Phone: stack vertically with downward arrows; do not mirror
horizontal arrow glyphs merely for RTL. Render whole on add, never progressive. Slot update uses
stringified zero-based link position; broken crosses its incoming connector (first link has no
incoming connector, so a broken state there strikes the link itself). Correct/wrong/key slot states
style the link. Item/span marks and annotations apply; no row/column scope. Fixture: `add-chain`,
`legacy-slot-states`, `chain-static-break`.

### 5.12 `blanks`

**v2 — verify**; template markup and item/span marks/pen **v3 — build**. Supporting BRD-005.
Payload: `{template: nonempty string ≤180, blanks: [{id:string,fill:string},…]}`. At least one
blank; unique nonempty ids; nonempty fills ≤180. Exactly one `___` per blank in template order.
Fill strings never permit markup.

```json
{"template":"وحدة الكتلة ___","blanks":[{"id":"u","fill":"كيلوجرام (kg)"}]}
```

Never show authored fill on add. Underline each unfilled slot with roughly expected answer width,
without exposing the answer to accessibility APIs. Only a slot text update or snapshot slots
fills it; a brief accent signals change without rebuilding the line. Item/span marks apply to
template text and visible slot text, not private fill. No board_reveal. On phone wrap template and
filled blanks together in sentence flow, isolate numeric/Latin fills, keep underlines visible.
Fixtures: `add-blanks`, `legacy-update-fill`.

### 5.13 `options`

**v2 — verify**; markup/pens/marks **v3 — build**. BRD-004, BRD-106.
Payload: `{stem: string, options: [{id:string,text:string,correct:boolean},…]}`. Nonempty stem/text
≤180; ≥2 options, unique ids, exactly one correct (not necessarily ≤4).

```json
{"stem":"What is the SI base unit of mass?","options":[{"id":"opt-gram","text":"Gram","correct":false},{"id":"opt-kg","text":"Kilogram","correct":true}]}
```

Stem, then A/B/C/D… labels in payload order (continue alphabetically if needed). Ignore correct
flags on initial rendering, in hidden DOM, labels and accessibility. Options are not clickable:
the student answers by voice. Existing set_topic checkpoint is a separate surface. Legacy slots
accept all four states, not just correct/wrong; new option marks use option ids. Item/option/span
marks and annotations; all options visible on add, no reveal. Portrait stacks labelled options,
wraps text and maintains state badge space. Fixtures: `add-options`, `mark-option-states`.

### 5.14 `callout`

**v2 — verify** six kinds; verbatim, markup/pens/marks **v3 — build**. BRD-101, BRD-701.
Payload: `{kind: loses_marks|mistake|mnemonic|definition|example|exam|verbatim, text: string ≤180}`.
Text nonempty.

```json
{"kind":"verbatim","text":"لاحظ أن الوحدات تختصر بشكل صحيح؛ فهذا أساس استخدام conversion factor بطريقة صحيحة!"}
```

Each of the seven kinds needs a recognisable label/icon/border/background treatment. Loses_marks
is the strongest **non-error** exam-strategy callout, never mistaken for an ordinary bullet; authors
use at most one per topic. Mistake denotes a common misconception, mnemonic a memory cue,
definition an explanatory definition box, example a compact example, exam an exam instruction.
Verbatim is specifically “textbook text” / “بنص الكتاب”, with quotation/textbook cue distinct from
all six; preserve the textbook words. Whole-text update, item/span marks, annotation; no reveal.
Portrait wraps a full-width box with its badge bound to the text. Fixture: `add-callout` plus
`callout-mistake`, `callout-mnemonic`, `callout-definition`, `callout-example`, `callout-exam`,
`callout-verbatim` (both languages).

### 5.15 `divider`

**v3 — build**, BRD-406. Payload: `{}` (no fields).

```json
{}
```

Horizontal rule for organisation only, never a mathematical minus, answer or group boundary. It
occupies one region item. Item marks and annotations apply to the rule; span scope does not.
No text update/reveal. On phone full available width with modest vertical space and readable
focus/highlight treatment. Fixture: `add-divider`.

### 5.16 `timeline`

**v3 — build**, BRD-504, BRD-123. Payload:
`{axis_label:string, divisions:string[2..8], markers:[{id:string,at:integer,label:string|null,
pen:Pen|null},…], reveal?:"progressive"}`. Labels/axis nonempty ≤180 when not null; unique marker
ids; marker `at` 0..divisions.length−1; markers array may be empty. Marker label/pen fields are
explicit, even when null. All label strings permit inline markup.

```json
{"axis_label":"تحويل الوحدات","divisions":["المعطى","معامل التحويل","النتيجة"],"markers":[{"id":"marker-answer","at":2,"label":"3 m","pen":"flow"}],"reveal":"progressive"}
```

Draw one ordered axis with named divisions/ticks and markers attached to their division, optionally
labelled. Labels stay bound to ticks/markers; no connector to arbitrary board items. Logical index
0 is the first division, and the axis is LTR to match authored numeric/order semantics even when
labels are individually RTL. Pens style the axis item and individual markers via §4.2 inheritance.

Progressive add shows first division and only its attached markers. Reveals expose the next
division and its markers; unrevealed labels/markers are hidden, while axis space may be reserved.
Without reveal show all divisions/markers. Item/division/span marks and annotations apply; division
state includes its tick, label and attached markers. Portrait preserves the ordered horizontal axis
in a **bounded horizontal scroll container**, rather than wrapping/reordering divisions onto new
axes. Labels may wrap within their division; tick spacing stays readable. No auto-scroll that
steals a student's scroll position. Fixture: `add-timeline`, `add-timeline-progressive`,
`mark-division-states`.

### 5.17 `icon`

**v3 — build**, BRD-601–604. Payload:
`{icon: nonempty Becan name from icons.json, label: nonempty string ≤180, attach_to: item id|null}`.
No cast references on wire. Icon names do not permit markup; labels do.

```json
{"icon":"ruler","label":"الطول — متر (m)","attach_to":null}
```

Icon names are Becan names from `src/tutor_agent_snd/board/icons.json`; each maps to a Lucide
drawing via its `lucide` field. The frontend uses the same file (copy or fetch) to resolve the
drawing and the Arabic default label (`label_ar`). The catalogue is the integration source for
T2/T5, not an extra frontend message. Unknown names render a neutral placeholder glyph and keep
the label.
Use monochrome currentColor icons, 24×24 viewBox and approximately 1.75 stroke; item pen sets accent.

Icon and label are a **single layout unit** (BRD-603), never two independently positioned objects.
Label wraps within its unit. `attach_to` places this icon beside an earlier icon item in the same
group, preserving add order; it is layout adjacency, not an arrow or merge of identities. A missing,
removed, different-group or different-region target falls back to ordinary flow. On phone scenario
rows wrap these complete units; labels never float away. Course cast/relabel resolution happens
backend-side; new labels simply arrive as resolved icons. Item/span marks and annotations apply;
span targets label only. No whole-text update or reveal. Fixture: `add-icon`,
`scenario-attached-icons`, `icon-unknown-placeholder`.

## 6. Marks and state composition

**v3 — build**, BRD-002, BRD-004, BRD-106, BRD-202, BRD-301, BRD-302, BRD-304, BRD-407.

### 6.1 Scope × kind matrix and addresses

All seven states `highlight, correct, wrong, dim, strike, focus, clear` apply to **every valid scope**.
There is no narrower state whitelist for table/compare cells or equation spans. Static table-cell
states and legacy slot/annotation kinds have their own smaller enums (§3/§5).

| Scope | Applicable item kinds | Address / sibling set |
| --- | --- | --- |
| `item` | all 17 | All address fields null. Siblings are other items in same current region, including grouped/ungrouped items, excluding title. |
| `row` | table, compare | index = data row, 0-based; siblings other data rows. |
| `cell` | table, compare | cell = [data row,column], 0-based; siblings other cells in that data row. |
| `column` | table, compare | index = logical column, 0-based; siblings other columns, including their headers and visible data cells. |
| `option` | options | option = exact option id; siblings other options. |
| `span` | heading, text, bullet, step, note, definition, term, equation, compare, table, chain, blanks, options, callout, timeline, icon | match = exact substring; siblings other visible text runs within the matched field. Divider has no span. |
| `division` | timeline | index = division, 0-based; siblings other divisions with attached markers. |

Compare coordinates include the aspect column: 0=aspect, 1=x, 2=y. Table coordinates are payload
header order, not screen order. Hidden rows/divisions can retain marks without becoming visible.
No header-cell address exists; use column marks (including header) or span marks on header text.

Span matching is case-sensitive and exact, against text **without inline markup**, except equation
matches original latex. Search each field independently (no concatenating across fields). Fields:
text and children; definition chunks; term en/ar; compare labels/aspect/x/y; table cell texts;
chain links; blanks template text/visible fills; options stem/text; callout text; timeline labels;
icon label. Match all occurrences in eligible visible fields, never private fills/answer flags.
Store marks on hidden text for when it becomes visible. Unmatched text/latex marks have no visual
effect and never throw. Equation spans use §5.8 wrapping; never search generated KaTeX DOM.

### 6.2 State semantics

| State | Required effect |
| --- | --- |
| `highlight` | Draw attention to address with a readable tinted highlight/border using pen/default mark. |
| `correct` | Confirm right with check + textual/accessible right-answer cue and success style. |
| `wrong` | Confirm wrong with cross + textual/accessible wrong-answer cue and error style. |
| `dim` | Reduce prominence of **only this address**; retain readable content. |
| `strike` | Strike addressed text; for whole structured items also use a cancellation cue/frame; never remove content. |
| `focus` | “Look here”: emphasize target and dim its siblings from §6.1. It does not write dim marks onto siblings. |
| `clear` | Remove earlier marks at exactly the same address; item clear removes **all** marks on the item. |

Row/column/division/item focus follows the final brief. Cell/option/span siblings above supply a
deterministic interpretation for the other allowed focus scopes. For math span focus, other math
content within that equation is muted without hiding it. Dim/focus never reveal hidden content.

### 6.3 Accumulation, precedence and clear

A mark address key is `(scope, active address value)` within its target item; ignore null fields
when comparing keys. Non-clear marks append in application order, including successive marks at
one address. Snapshot records store surviving entries in that same order. Clear removes **all**
entries with that address. `scope:item, state:clear` removes every scope on the item, including
focus effects on siblings. It does not clear legacy annotations, slot values, pen or static cell
states. Removing/clearing an item removes its marks and therefore its derived sibling dimming.

Visual composition: retain independent properties (e.g. highlight + strike + dim). For conflicting
values of the same property at the same address, later application wins (correct vs wrong is one
answer-state property). Static payload states form the base, legacy annotation/slot styling overlays
them, and marks overlay those; mark clear reveals the retained base/legacy state. An explicit wrong
state never loses its cross just because a highlight is present. Multiple active focus marks in
one sibling set keep the union of their targets prominent and dim non-target siblings; focus in
one scope does not delete a focus in another. Item focus siblings are recomputed on add/pin/remove.

Span overlays never destructively rewrite payload text. Re-render from original payload plus
current overlays after clears/updates; avoid nested invalid KaTeX wrappers when matches overlap.
For overlapping marks use shared styled segments with property precedence above. Invalid/missing
ids, illegal scope/kind or out-of-bounds addresses are ignored defensively, revision handling still
applies. Backend drops marks whose target was never shown; there is no phantom item or error packet.

## 7. Event cadence and release timing

**v2 — verify** for cadence; **v3 — build** for additional mark/table/timeline operations.
Board mutations are paced **backend-side** to the tutor's audio playout, not to when streamed text
arrives. The executor waits for sentence-bound word timestamps; if those are unavailable after the
speech transcript finishes, it estimates from the actual audio-start anchor and words/second.
Late computations release immediately once their audio point has passed. The frontend does not
receive timestamps or generation ids and must apply arriving messages immediately.

- Small bursts are normal: clear → group → add can arrive within a few hundred milliseconds.
  Batch rendering to avoid layout thrash, without adding pacing timers.
- A clear_live authored on a segment applies when its **first beat fires**, not when prose declares
  the segment started. A behind-cursor segment does not clear newer live material. Group is created
  once before first member, and later members join it. The client consumes actual packets only.
- Thirty quiet seconds with a title and three items is normal. No “stalled” indicator or synthetic
  additions. Chains/nested bullets appear whole; definitions and opted-in tables/timelines reveal.
- Mutations can arrive tens of seconds after add. Preserve addressable items throughout the topic.
- Interruption drops pending work backend-side; already published content stays. No client undo,
  fade-out timer or guessed completion. Answer marking/remediation boundaries can be immediate.
- Entering/removing remediation invalidates pending work. Temporary items clear on detour exit or
  replacement. Backend serializes all board mutations under one lock; the client preserves order.
- On topic start, all clear/title framing is immediate. Runtime has no production hide caller.
  State can implicitly show on title/group/add if hidden; clear itself does not show or hide.

Representative replay (delays belong to a test runner, never a production reducer):

| Time | Packet | Visual result |
| --- | --- | --- |
| 0.0s | clear all → show if hidden → title | Topic frame. |
| 4.1s | add definition | First chunk. |
| 7.6s | reveal index 1 | Second chunk. |
| 15.8s | group example/worked → add step | Worked example begins. |
| 24.3s | add callout loses_marks | Exam warning. |
| 31.0s | clear live → add options | New stage, pinned material remains. |
| 48.9s | update selected slot wrong (legacy), or mark option wrong (v3) | Explicit answer feedback. |
| 50.2s | mark row correct, if sent | Table answer feedback. |

Named short sequences: `sequence-worked-conversion`, `sequence-answer-remediation`,
`sequence-topic-turnover`. The fixture messages contain no synthetic time fields.

## 8. Revision, reconnect and divergence

**v2 — verify**. Track last applied board rev per session, not per region or action. Other session
packets do not modify it. Normally apply mutations only when rev is greater; equal/lower mutations
are duplicate/stale and ignored. A new session's first valid board message establishes the baseline.

On a gap greater than one, keep rendering the received valid mutations and set a resync-needed flag;
never infer the missing update/remove. Unknown-target update/annotate/mark/remove/reveal/pin must be
ignored silently, but consume the accepted revision. Malformed JSON/unknown actions never throw;
ignore unknown actions. Unknown board kinds render a neutral unsupported-item fallback rather than
crashing unrelated state. Out-of-bounds child operations have no content effect.

Snapshot is authoritative recovery: accept when its rev is ≥last applied, including **equal** rev
when reconnect/resync requires replacement; reject older snapshots. Replace visibility/title/groups/
ordered items and all state atomically, adopt snapshot rev and clear divergence. This equal-rev
exception is necessary because publishing a snapshot does not increment the counter. A snapshot
with a higher rev fills the gap instead of setting divergence. Subsequent mutations resume from it.
Do not replay item-add effects when restoring snapshots.

`BoardRuntime.publish_snapshot()` exists and is tested, but automatic reconnect/resync publishing
is not wired: no inbound board data handler or participant-connected trigger exists in current
agent flow. This contract defines receipt handling, not a new outbound `board_resync` action. After
local reset on a mid-topic reconnect, current backend can leave an empty board until next topic
boundary; implement snapshot restoration now and report that integration limitation accurately.
No persistence/archive UI or packet acknowledgements are added.

Fixture `snapshot-full` starts at rev 1/2, then receives authoritative rev 60 representing missed
backend mutations; all its shown content comes from that snapshot. For equal-rev acceptance replay
that snapshot again with a resync flag; for stale mutations/reordered packets inject repetitions of
fixture packets. Fault-injection harnesses may repeat/reorder; fixture source sequences themselves
have strictly increasing rev values as required.

## 9. Verification checklist using named fixtures

Run every visual check in light/dark themes at desktop, 390px portrait and 320px narrow portrait,
then reduced-motion mode. Each checkbox states an observable result; fixtures are inputs, not
claims that the current backend implements v3. No repository code changes/tests are required for
this documentation ticket. Frontend implementation must pass its applicable lint, type-check and
build commands, and live sessions in both languages after integration.

### 9.1 v2 — verify

- [ ] `frame-lifecycle`: clear/title/show/hide changes exactly the frame; clear preserves visibility,
  hide preserves state; live/temporary clear preserves pinned/title; all removes groups/title.
- [ ] `progress-events`: `set_checkpoint` opens and closes the checkpoint apart from `set_topic`, topic_done updates completion,
  scroll still navigates PDF, session_ending uses existing flow; no event enters board rev tracking.
- [ ] `add-heading`, `add-text`, `add-bullet`, `add-step`: correct base typography/markers, per-region
  steps; `legacy-update-text` replaces text in place without deleting other state.
- [ ] `add-definition`: starts with one chunk, reveals in order, keywords match without stemming;
  hidden chunks absent from accessibility tree; reduced motion keeps identical content.
- [ ] `add-term`, `add-equation`: independent English/Arabic token isolation; real fraction/math
  coverage; guarded invalid-math fallback using `equation-fallback`.
- [ ] `add-compare`, `add-table`: true desktop alignment, portrait labelled cards with no horizontal
  scroll; journal empty cells retain geometry and numbers use LTR/tabular alignment.
- [ ] `add-chain`, `chain-static-break`, `legacy-slot-states`: whole chain, incoming connector
  cancellation, vertical phone arrows and all legacy correct/wrong/broken/key slot states.
- [ ] `add-blanks`, `legacy-update-fill`: answer hidden initially, named slot fills in place;
  `add-options`, `legacy-slot-states`: correct flags remain secret until explicit feedback;
  options have no click handlers, all slot states render.
- [ ] `add-callout`, `callout-mistake`, `callout-mnemonic`, `callout-definition`, `callout-example`,
  `callout-exam`: six distinct treatments; loses_marks is conspicuous and not an error badge.
- [ ] `legacy-annotations`: all six annotations and null clear, explicit key movement; correct/wrong
  distinguishable without colour. Title annotations remain supported.
- [ ] `groups-box-columns`, `pin-and-clear`, `remove-item`: group precedes members; phone stacking;
  move preserves identity/state; live clear retains pin; individual removal retains other members.
- [ ] `eviction-live-13`: see removal before add 13, never render 13 live items; live scrolls while
  pinned reference remains available. Groups do not count as items.
- [ ] `snapshot-full`: restore complete state; replay at equal rev while resync-needed and recover;
  inject stale/duplicate/gap mutations and unknown ids without throwing or guessing missing content.
- [ ] `sequence-worked-conversion`, `sequence-answer-remediation`, `sequence-topic-turnover`: replay
  with quiet intervals/interruption in harness; immediate packet application, no client pacing,
  temporary cleanup, no header flicker; session reset hides and empties board.
- [ ] `progress-events` with live PDF: carousel, zoom and toolbar remain navigable after board bursts;
  frontend lint/type-check/build pass and English/Arabic sessions preserve mixed-script content.

### 9.2 v3 — build

- [ ] `pens-all-roles`: all five roles and null have defined light/dark tokens; trap differs from wrong.
- [ ] `markup-showcase`: every marker and all five named highlights render, no raw markers/nesting;
  mixed Arabic/English/math in a line preserves order. `bidi-numbers` matches specimen line and signed
  exponent visual order; numbers remain authored and arrows do not mirror.
- [ ] `add-note`, `add-divider`: third text size readable; divider is organisational, consumes a slot.
  `add-bullet` shows exactly one nesting level and phone indentation preserves reading width.
- [ ] `callout-verbatim`: both languages retain textbook text, distinct from six legacy kinds.
- [ ] `add-equation`, `equation-long-aligned`, `mark-equation-span`: >180 and ≤600-character LaTeX
  works, denominator/result highlight wraps using controlled htmlClass; unmatched substring ignored;
  clear restores original math; symbols/roots/alignment/LTR phone local overflow work.
- [ ] `table-static-states`: all four static states incl. header/empty cell; `add-table-progressive`:
  first row only, row-by-row reveal, count correct, numbered headers repeated on phone cards.
- [ ] `add-timeline`, `add-timeline-progressive`: stable axis order, markers only at visible divisions,
  marker pens/null inheritance; horizontal local phone scroll, labels wrap without division reflow.
- [ ] `scenario-attached-icons`, `add-icon`, `icon-unknown-placeholder`: one resolved icon per message,
  attachment adjacency within group, bound wrapping labels, unknown-name placeholder keeps label.
- [ ] `example-worked`, `example-faded`, `example-try`: unmistakable example container and distinct
  glanceable stage label/frame, with no invented blanks; snapshot restores these stages.
- [ ] `mark-item-states`, `mark-row-states`, `mark-cell-states`, `mark-column-states`,
  `mark-option-states`, `mark-span-states`, `mark-division-states`: all 49 scope/state pairs,
  dim versus focus siblings, noncolour answer cues, accumulate then clear the addressed overlays.
- [ ] `mark-compare-addresses`: aspect/x/y coordinates survive portrait cards; `mark-item-all-kinds`
  and `mark-span-text-kinds`: every permitted kind receives its supported mark.
- [ ] `mark-accumulate-clear`, `snapshot-full`: marks retain application order, item clear removes all
  scopes, static/legacy base survives clear, hidden target marks wait for reveal, focus recomputes
  after movement/removal. Snapshot pens, counts, slots and stage reproduce exact view.

## 10. Out of scope and deferred

ADR-0005 defers images/crops/zoom/captions, per-asset rights/storage/cache/byte budgets
(BRD-611–615, BRD-631–632); slide/blank surfaces and split-source views (BRD-702–703); cross-lesson
canvas, chapter map and screenshot/export moment (BRD-801–803); free connectors, braces, trees and
general diagrams (BRD-503, BRD-505, BRD-506, BRD-623). B-roll BRD-641 is not built.
No new derivation kind BRD-203: use aligned equation plus span marks; no labelled-arrow drawing API.
The scenario icons and timeline axis are structured renderers, not a general canvas.

Also out of scope: freehand drawing, student board editing/controls, dragging/resizing, coordinates,
board history UI, persistence across sessions, transcription display, frontend word-level speech
synchronization, render acknowledgements. PDF scroll/navigation remains a separate existing surface.

## 11. Contract choices for implementation review

These details were not completely specified in the brief; they make this document executable:

1. Compare mark columns include aspect (0), x (1), y (2); coordinates stay logical in portrait/RTL.
2. Span matching uses markup-free text, all exact occurrences per eligible field, including visible
   fills; no cross-field match. Cell focus dims other cells in its row, option focus other options,
   span focus the rest of its field. Multiple focuses keep the union of targets prominent.
3. Independent mark properties compose; later conflicting property wins. Static → legacy → marks
   precedence is visual only; clear retains static/legacy state. Missing-match marks stay stored
   without visible effect. Equation overlays use original LaTeX and controlled class names.
4. Timeline is a fixed LTR logical axis with local horizontal phone scroll; labels have own auto
   direction. Math also has bounded local horizontal overflow. No timeline auto-scroll.
5. Region-split groups are projected per occupied region; missing attachment/group falls back to
   ordinary flow. Step numbers recompute from current region order after moves/removals.
6. The illustrative palette, stage border patterns, UI-localized stage labels and neutral fallback
   styling are frontend presentation choices, not new wire fields. Becan names and Lucide drawings
   resolve through the shared `icons.json` catalogue (§5.17).
7. Equal-revision snapshot restoration is allowed (serializer does not increment snapshot rev).
   Markup is restricted to the exact field list in the brief; chain/title/group remain plain.
8. New nonprogressive table/timeline snapshot counts equal total visible length; legacy v2 table
   revealed=1 is not interpreted as hiding rows. Title records carry null pen and empty marks normally.

## Appendix A. BRD id → contract section

Each row marked “ADR in scope” is one of ADR-0005's explicit vocabulary scope IDs. Supporting
existing/frontend-only IDs are included separately; deferred IDs are listed in §10.

| BRD id | Scope | Sections |
| --- | --- | --- |
| BRD-002 | ADR in scope | §3.2, §3.4, §6 (updates/marks; no arbitrary payload replacement) |
| BRD-004 | ADR in scope | §5.10, §5.13, §6 (row/option feedback) |
| BRD-101 | ADR in scope | §5.14 (verbatim textbook callout) |
| BRD-102 | ADR in scope | §4.1 (bold) |
| BRD-103 | ADR in scope | §4.1 (underline) |
| BRD-104 | ADR in scope | §4.1, §5.6 (highlight/keywords) |
| BRD-105 | ADR in scope | §4.4, §5.5 (third size/note) |
| BRD-106 | ADR in scope | §4.1, §6 (strike) |
| BRD-107 | ADR in scope | §4.1 (super/subscript) |
| BRD-108 | ADR in scope | §4.1–4.2 (named pen highlights) |
| BRD-109 | ADR in scope | §4.3 (authored numbers) |
| BRD-110 | ADR in scope | §4.3, §5.7–5.8 (LTR isolation/specimen test) |
| BRD-121 | ADR in scope | §5.3 (nested bullets) |
| BRD-123 | ADR in scope | §3.6, §5.10, §5.16 (progressive reveal) |
| BRD-201 | ADR in scope | §5.8 (long aligned mathematics) |
| BRD-202 | ADR in scope | §5.8, §6 (LaTeX spans) |
| BRD-301 | ADR in scope | §5.9–5.10, §6 (cell state/marks) |
| BRD-302 | ADR in scope | §5.9–5.10, §6 (row marks) |
| BRD-303 | ADR in scope | §5.10 (numbered columns) |
| BRD-304 | ADR in scope | §5.9–5.10, §6 (column focus) |
| BRD-406 | ADR in scope | §5.15 (divider) |
| BRD-407 | ADR in scope | §3.3, §6 (dim/focus) |
| BRD-504 | ADR in scope | §5.16 (timeline) |
| BRD-601 | ADR in scope | §2.1, §5.17 (incremental scenario) |
| BRD-602 | ADR in scope | §5.17 (Becan icon catalogue) |
| BRD-603 | ADR in scope | §5.17 (bound icon labels) |
| BRD-604 | ADR in scope | §0, §5.17 (backend-resolved cast) |
| BRD-621 | ADR in scope | §2.1 (example container) |
| BRD-622 | ADR in scope | §2.1, §3.8–3.9 (three stages) |
| BRD-701 | ADR in scope | §3.1, §4.2 (pens) |
| BRD-001 | Existing support | §3.9, §8 (authoritative state/snapshot) |
| BRD-003 | Existing support | §3.5 (individual remove) |
| BRD-005 | Existing support | §3.2, §5.12 (blank fill) |
| BRD-122 | Existing support | §7 (speech-paced additions) |
| BRD-404 | Existing support | §1–2, §7 (temporary cleanup) |
| BRD-405 | Frontend rule | §2, §9 (backend eviction) |
| BRD-408 | Existing support | §3.5 (recall becomes add) |
| BRD-804 | Frontend rule | §1.2 (topic progress) |
