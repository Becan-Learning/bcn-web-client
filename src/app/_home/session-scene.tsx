import {
  BOARD,
  SLIDE_OF_TOPIC,
  TOPICS_META,
} from "@/lib/data/session-demo";

/* لمحة من شاشة الجلسة الحقيقية — البريف يمنع صور الطلاب من بنوك
   الصور ويطلب مشهدًا من المنتج نفسه.

   وهي الجلسة **كاملة** لا السبورة وحدها: مسار المواضيع · السبورة ·
   الشرائح — بنفس ترتيب الشاشة وبنفس أسطحها، فيرى الزائر ما سيدخل
   إليه لا جزءًا منه.

   المحتوى مستورد من نصّ الجلسة لا منسوخ، فلا يمكن أن ينحرف عمّا
   يراه الطالب فعلًا (نمط 4: بيانات حقيقية بدل ادّعاءات).

   خادميّ بالكامل: الظهور التدريجي CSS لا Motion — حركة ثابتة، ولو
   رُسمت بـMotion لخرجت السطور من الخادم بـopacity:0 وبقي نصف الـHero
   خفيًّا حتى يعمل الجافاسكربت. */

const HEAD = BOARD.find((b) => b.kind === "head");
const ITEMS = BOARD.filter((b) => b.kind === "item").slice(0, 2);
const PENALTY = BOARD.find((b) => b.kind === "penalty");

/** أول شريحة يمرّ بها الفصل — من خريطة المواضيع نفسها. */
const SLIDE = SLIDE_OF_TOPIC[0];
const TOPICS = TOPICS_META.length;

/** ترتيب ظهور الأسطر — السطر لا يسبق نطقه (نمط 2).
    التأخير هنا إزاحة داخل دورة متكرّرة لا بداية لمرّة واحدة. */
const STEP_MS = 750;
const at = (i: number) => ({ animationDelay: `${350 + i * STEP_MS}ms` });

export function SessionScene() {
  return (
    <figure
      data-theme="dark"
      data-surface="session"
      /* نصّ [data-surface] يرث لون body لا لون السطح — يُثبَّت هنا */
      className="overflow-hidden rounded-xl border border-line bg-ground text-ink shadow-lift"
    >
      <figcaption className="sr-only">
        لمحة من جلسة شرح في بيكان — مسار المواضيع والسبورة والشرائح.
      </figcaption>

      {/* ترويسة الجلسة */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <p className="flex shrink-0 items-center gap-2 text-xs font-semibold text-live">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute h-full w-full rounded-pill bg-live animate-speak"
            />
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-pill bg-live"
            />
          </span>
          يشرح الآن
        </p>
        <p className="min-w-0 truncate text-xs text-ink-2">
          مبادئ المحاسبة 1 · الفصل 3
        </p>
      </div>

      {/* الأعمدة الثلاثة بترتيب الجلسة: المواضيع · السبورة · الشرائح */}
      <div className="flex gap-2 p-2">
        <TopicsRail />

        <div className="chalkboard min-w-0 flex-[2] space-y-3 rounded-lg border border-chalkboard-edge px-4 py-4">
          {HEAD ? (
            <p
              style={at(0)}
              className="animate-board-loop text-sm leading-base font-bold text-ink"
            >
              {HEAD.text}
            </p>
          ) : null}

          {ITEMS.map((item, i) => (
            <p
              key={item.n}
              style={at(i + 1)}
              className="animate-board-loop flex items-baseline gap-2 text-xs"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-aubergine-mid text-[10px] font-bold text-on-dominant">
                {item.n}
              </span>
              <span className="min-w-0">
                {/* لون النص يُبنى شرطيًا لا بالتكديس: صنفا لون-نصّ
                    متساويا الأولوية، والفائز ترتيب Tailwind */}
                <span
                  className={
                    item.mark
                      ? "rounded-sm bg-tint-amber px-1 font-semibold text-ground"
                      : "font-semibold text-ink"
                  }
                >
                  {item.term}
                </span>
                <span className="text-ink-2"> — {item.gloss}</span>
              </span>
            </p>
          ))}

          {PENALTY ? (
            <p
              style={at(ITEMS.length + 1)}
              className="animate-board-loop rounded-md border-s-4 border-s-pressable bg-surface-2 px-3 py-2 text-xs text-ink"
            >
              <span className="font-semibold text-pressable">
                ما يفقد الدرجة:{" "}
              </span>
              {PENALTY.text}
            </p>
          ) : null}
        </div>

        <SlidesColumn />
      </div>
    </figure>
  );
}

/** عمود المواضيع الضيّق — دوائر مرقّمة موصولة، كما في الجلسة. */
function TopicsRail() {
  return (
    <div className="hidden w-9 shrink-0 flex-col items-center rounded-lg border border-line bg-panel py-2 sm:flex">
      <p className="text-[9px] font-semibold text-ink-2">1/{TOPICS}</p>
      <ol className="mt-1.5 flex flex-col items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex flex-col items-center">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-pill border text-[9px] font-bold ${
                i === 0
                  ? "border-transparent bg-ink text-ground"
                  : "border-ink-3 text-ink-2"
              }`}
            >
              {i + 1}
            </span>
            {i < 4 ? (
              <span aria-hidden="true" className="h-2 w-px bg-line" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** عمود الشرائح — الشريحة المفتوحة يؤطّرها الجوزيّ كما في الجلسة.
    الإطار مكبَّر عن غلافه ليُقصّ مؤشّرا تمرير عارض الـPDF. */
function SlidesColumn() {
  return (
    <div className="hidden w-24 shrink-0 flex-col gap-2 md:flex">
      <span
        dir="ltr"
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-md border-2 border-warmth"
      >
        <iframe
          title="شريحة من المقرر"
          loading="lazy"
          src={`/slides/slides.pdf#page=${SLIDE}&toolbar=0&navpanes=0&statusbar=0&view=FitH`}
          className="absolute top-0 start-0 h-[calc(100%+22px)] w-[calc(100%+22px)]"
        />
      </span>

      {/* شريحتان تاليتان مطويّتان — تقولان إن الكومة أطول */}
      {[1, 2].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className="block aspect-[16/10] w-full rounded-md border border-line bg-panel"
        />
      ))}
    </div>
  );
}
