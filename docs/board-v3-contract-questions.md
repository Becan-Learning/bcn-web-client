# Board v3 contract questions

## Q-1 — Stage label language

- **Section:** Contract §2.1 (groups and stages).
- **Fixtures:** `example-worked`, `example-faded`, `example-try`.
- **Interim behaviour:** Stage labels follow the session's explanation language, like the board's
  other words, under [ADR 0001](adr/0001-interface-and-explanation-language-are-separate.md).
- **Question:** The contract says “Stage labels use UI locale”. Can you confirm that “UI locale”
  here means the session's explanation language? This repo lets interface and explanation
  languages differ.

## Q-L2-1 — Greek letters and unit symbols in LTR runs

- **Section:** Contract §4.3 (bidi and numbers).
- **Fixtures:** `bidi-numbers`, `markup-showcase` (no fixture contains a Greek letter).
- **Interim behaviour:** A run may also start with a Greek letter, and continues through `µ`, `°`, `′`,
  `″` and Greek letters, in addition to Latin letters, Western digits and superscript/subscript
  characters. Otherwise `1 μm` splits into a run `1`, a stray `μ` (a strong LTR letter in RTL flow) and a
  run `m`, which reads reversed.
- **Question:** The contract lists only “Latin letter, Western digit or signed number” as run starts.
  Can you confirm that Greek letters (`μ`, `Ω`, `π`, `Δ`) and `° ′ ″` count as unit symbols that belong in
  the run?

## Q-L2-2 — Where an LTR run ends

- **Section:** Contract §4.3.
- **Fixtures:** `bidi-numbers` (`الأس تضاعف: − 2 ⇒ −4`, `الطول ← m`), `add-bullet`.
- **Interim behaviour:** A run ends at its last letter, digit, superscript/subscript character, `%`, unit
  symbol or balanced closing bracket. Trailing whitespace and trailing operators or punctuation
  (`= + − × ÷ / . ,` and arrows) stay outside, in the surrounding Arabic flow, so a sentence-final `.` or
  a dangling `=` sits at the logical end of the line. A closing bracket whose opener sits directly before
  the run pulls the opener in (`متر (m)` isolates `(m)`); an unpaired bracket stays outside. `:` joins a
  run only between two letters/digits (`1:2`). `[` `]` are treated like `( )`.
- **Question:** The contract says runs continue through “whitespace connecting them and math punctuation
  such as …” but does not say what happens at the edge. Is “stop before Arabic prose” meant to exclude
  trailing operators and brackets, as implemented?

## Q-L2-3 — Unrevealed definition chunks are not in the HTML

- **Section:** Contract §3.6 and §5.6 (“hide … from sight and the accessibility tree”, versus “stable
  reserved height if useful”).
- **Fixtures:** `add-definition`.
- **Interim behaviour:** Chunks beyond `revealed` are not rendered at all, so they are absent from the
  page source too and no height is reserved. The earlier implementation rendered them `invisible`.
- **Question:** Is reserving height optional enough to give up in favour of keeping hidden text out of the
  DOM entirely?
