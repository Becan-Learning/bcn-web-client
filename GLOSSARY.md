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

## Account

**Account** (الحساب):
The student's one record with Becan: who they are (name, email, phone), how they sign in, and the
study facts that shape what they see (university, major). Nothing about the student lives outside
it. A student has exactly one Account.
_Avoid_: user, profile, student account, member

## Catalog

**Catalog** (الكتالوج):
Every Course Becan offers. Students choose from it; they never add to it.
_Avoid_: library, materials

**Course** (المقرر):
One university course as one Institution teaches it, split into Chapters. The same subject at two
Institutions is two Courses.
_Avoid_: subject, material (مادة), class

**Chapter** (الفصل):
One numbered part of a Course, and the unit a session teaches. A Chapter is either published, so
an enrolled student can open it, or announced as coming soon.
_Avoid_: unit, module, section

**Lesson** (الدرس):
One of the ordered parts a Chapter is taught in; a session moves through a Chapter's Lessons in
order. It is the smallest unit the student sees outside a session.
_Avoid_: topic (outside a session), part

**Enrollment** (التسجيل في المقرر):
A student's hold on one Course that lets them open its Chapters. It is active from the moment
they enroll until it ends; it ends when the student un-enrolls. An ended Enrollment is kept, never
erased, and a student holds at most one active Enrollment per Course.
_Avoid_: subscription, registration (that is creating an Account), membership

**Archived Course** (مقرر مؤرشف):
A retired Course. It is out of the Catalog and closed to new Enrollments, but a student who is still enrolled keeps their
Enrollment and can open its published Chapters. The student sees it marked «مؤرشف» / Archived.
_Avoid_: deleted, disabled course, closed course

## Session

**Session** (الحصة):
One sitting in which the tutor teaches one student one Chapter, from the moment it starts until it
ends. A student has at most one Session open at a time.
_Avoid_: lesson, call, room, class; and never the sign-in sense of "session" (a Device session)

**Topic** (الموضوع):
One step inside a Lesson that the tutor marks while teaching it. It exists only inside a
session; nothing outside a session counts or shows Topics.
_Avoid_: lesson, section, step

**Checkpoint** (سؤال الفهم):
A question the tutor puts to the student during a session to confirm they understood a topic.
It is open from the moment the tutor has finished asking it until the tutor judges an answer or
moves on. After a wrong answer the tutor explains again and asks again; each ask is opened and
closed on its own. Topics without one end on a readiness question, which is not a checkpoint.
_Avoid_: question (alone), quiz, assessment, open question

**Student question** (سؤال الطالب):
A spoken question the student deliberately starts by pressing Ask, cutting the tutor off
mid-explanation. Outside a student question the tutor does not hear the student's voice.
_Avoid_: question (alone), interruption, voice message

## Plans

**Plan** (الباقة):
A named set of limits on what a student may use. Every student is on exactly one Plan at a time;
at launch every student is on the Free Plan.
_Avoid_: tier, subscription, package, خطة

**Allowance** (حدود الاستخدام):
What a Plan lets a student use in one Period: how many Sessions they may start, how many minutes
of Session time, and how many Courses they may hold an Enrollment in at once.
_Avoid_: quota, credits, balance, الحصة (that is a Session)

**Usage** (الاستخدام):
How much of the Allowance the student has used in the current Period.
_Avoid_: consumption, spend

**Period** (دورة الاستخدام):
The 30-day window an Allowance applies to. When one Period ends the next begins and Usage starts
again from zero.
_Avoid_: month, billing cycle, cycle (alone)
