# Board v3 contract questions

## Q-1 — Stage label language

- **Section:** Contract §2.1 (groups and stages).
- **Fixtures:** `example-worked`, `example-faded`, `example-try`.
- **Interim behaviour:** Stage labels follow the session's explanation language, like the board's
  other words, under [ADR 0001](adr/0001-interface-and-explanation-language-are-separate.md).
- **Question:** The contract says “Stage labels use UI locale”. Can you confirm that “UI locale”
  here means the session's explanation language? This repo lets interface and explanation
  languages differ.

## Q-L4-1 — Icon attachment outside a group

- **Section:** Contract §5.17 (`attach_to`) and §2.1.
- **Fixtures:** `scenario-attached-icons`.
- **Interim behaviour:** An attachment is honoured when the target is an earlier icon in the same
  region with the same `group_id`, and two items with a null `group_id` count as the same group.
  The attached icon is drawn in one row with its target (the whole chain and its fan-outs, in add
  order), which can move it ahead of unrelated items that were added between the two. Anything else
  falls back to ordinary flow.
- **Question:** Is `attach_to` only ever sent inside a `scenario` group? If so, can ungrouped
  attachments be treated as fallback instead? And does "preserving add order" mean the attached
  icon stays at its own position in the sequence, or may it sit beside its target?

## Q-L4-2 — Group heading in the record's own region after its members moved

- **Section:** Contract §2.1.
- **Fixtures:** `pin-and-clear`.
- **Interim behaviour:** The container is drawn around its members in every region they occupy. The
  record's own region does not repeat the heading when members live elsewhere. A group with no
  members anywhere shows its heading alone in the live region, and is hidden in the pinned and
  temporary regions.
- **Question:** §2.1 allows "hide its empty shell, or show heading alone". Is heading-alone expected
  in the pinned and temporary regions too?

## Q-L4-3 — Step numbers when a group's members are not contiguous

- **Section:** Contract §4.3 and §11.5.
- **Fixtures:** `groups-box-columns`, `snapshot-full`.
- **Interim behaviour:** A group container sits at its first member's position and gathers all its
  members, so steps are numbered in the order they appear on screen, not in raw insertion order.
- **Question:** §11.5 says numbers recompute "from current region order". Does the backend ever add
  non-group items between members of one group? If so, which order should numbering follow?

## Q-L4-4 — Timeline marker without a label

- **Section:** Contract §5.16.
- **Fixtures:** `add-timeline`, `mark-division-states` (`marker-factor`: `label: null`, `pen: "construct"`).
- **Interim behaviour:** A marker with a null label is a small pen-styled stub attached to its
  division. It carries no text and is hidden from screen readers, since the wire gives it no name.
- **Question:** Should a marker without a label be visible at all, and does it have an intended
  meaning ("a step happens here") that needs an accessible name?
