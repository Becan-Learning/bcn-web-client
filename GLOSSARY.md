# Becan — بيكان

An Arabic-first product that explains a university course to the student by voice, writing on a
board as it speaks, then questions them to confirm they understood.

## Language

Three different "languages" meet on one screen. They are independent and must never be conflated.

**Interface language** (لغة الواجهة):
The language of the product's own words — navigation, buttons, labels, marketing copy, policies.
Arabic is primary, English secondary. The student chooses it; it also sets the page direction.
_Avoid_: locale (in conversation), site language, app language

**Explanation language** (لغة الشرح):
The language the tutor speaks and writes on the board during a session. Chosen by the student
before the session starts; it defaults to the interface language but is chosen separately.
_Avoid_: session language, tutor language, agent language

**Content language**:
The language a course's own material happens to be in — lesson names, slides, course names as
the university writes them. Neither the product nor the tutor translates it.
_Avoid_: course language, material language
