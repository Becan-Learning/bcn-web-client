# Interface language and explanation language are separate; the board follows the explanation language

The student picks the **interface language** (the product's own words and page direction) and the
**explanation language** (what the tutor speaks and writes) independently — the latter defaults to
the former but is chosen before each session, because a student may browse in English yet want
the course explained in Arabic, or the reverse for an English-language exam. The board belongs to
the tutor, so its frame — base direction, `lang`, step and band layout, and its own labels — follows
the explanation language, while everything around it (column, slides, toolbar, dialogs, chat)
follows the interface language. An Arabic interface with an English explanation therefore shows an
LTR board inside an RTL page, deliberately.

## Considered Options

- **One language for both** — rejected: forces a student to switch the whole site to change what
  the tutor speaks, and removes a picker the agent contract already supports.
- **Board frame follows the interface language** — rejected: an English board with step numbers
  on the right and a right-aligned title reads as broken; per-item `dir="auto"` alone cannot fix
  the frame.

## Consequences

- Content language (lesson names, slides, checkpoint questions) is neither; it renders as
  delivered with bidi isolation and is never translated by the product.
- The interface language cannot be switched inside a session — switching navigates and would
  drop the LiveKit room.
