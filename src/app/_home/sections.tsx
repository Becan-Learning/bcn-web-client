import Link from "next/link";
import {
  ArrowForward,
  BadgeCheckIcon,
  LayersIcon,
  MicIcon,
  PlayIcon,
  SearchIcon,
  SmileChatIcon,
  SparkIcon,
  StarIcon,
  Waveform,
} from "@/components/becan/icons";
import { PrimaryButton, QuietLink, Section } from "@/components/becan/kit";
import { BecanMorph } from "@/components/becan/becan-morph";
import { PLANS } from "@/lib/data/plans";
import { PlanCard } from "@/app/plans/plan-card";
import { FAQ } from "@/lib/data/faq";
import { FaqItem } from "@/app/faq/faq-item";

/* أقسام اللاندينج — الشاشة ٤ في docs/design-brief.md.

   قاعدتان حاكمتان من البريف تسريان على كل ما دون:
   لا ذكر لنطاق التغطية، ولا ادّعاء شمول. */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl leading-tight font-bold text-ink md:text-4xl xl:text-5xl">
      {children}
    </h2>
  );
}

/* ————— ثلاث جُمل تحت الـHero —————
   كل واحدة دعوى قصيرة وتحتها سببها. لا عناوين تسويقية بلا معنى
   قابل للقياس: «ما يخرف» دعوى، و«مدرَّب على مقررك» سببها.

   أسطح معتمة كما طُلبت، والكلمة أكبر عنصر فيها وأعلاه تباينًا:
   أبيض على الباذنجاني والزيتي الغامق. ووضوحها لم يكن يومًا من
   السطح بل من الختم الباهت الذي كان خلفها — حُذف، والقرص الفاتح
   يحمل الأيقونة فوقها لا تحتها. */

const POINTS = [
  {
    claim: "يفهمك",
    why: "بدون ما يكثر كلام",
    Icon: SmileChatIcon,
    fill: "bg-aubergine-base",
    edge: "border-aubergine-mid",
    mark: "bg-aubergine-tint text-aubergine-base",
    body: "text-aubergine-tint",
  },
  {
    claim: "ما يخرف",
    why: "لأنه مدرَّب على مقررك",
    Icon: BadgeCheckIcon,
    fill: "bg-aubergine-deep",
    edge: "border-aubergine-mid",
    mark: "bg-tint-walnut text-warmth",
    body: "text-aubergine-tint",
  },
  {
    claim: "سهل جدًا",
    why: "بضغطة زر تبدأ مذاكرة",
    Icon: SparkIcon,
    fill: "bg-olive-dark",
    edge: "border-olive",
    mark: "bg-olive-tint text-olive-deep",
    body: "text-olive-soft",
  },
];

/* البطاقة تستجيب للمؤشّر: ترتفع بظلّ ويكبر قرص أيقونتها. حركة
   واحدة مقودة بفعل المستخدم لا دورة تعمل من نفسها.

   **مربّعان في الصفّ على الجوال** (2×2) لا عمودٌ واحد: العمود يجعل
   الثلاث شريطًا طويلًا يُمرَّر، والشبكة تُريها دفعةً واحدة.

   **والرابع فعل لا دعوى**: بطاقة كهرمانية تُكمل الشبكة وتقود إلى
   اختيار المقرر. وبها يكتمل المربّع — ثلاثُ دعاوى ومخرجٌ منها.

   ⚠️ وبها يعود الفعل الكهرماني إلى **أربعة مواضع** في اللاندينج
   (هيرو · هذه البطاقة · كيف يعمل · شريط الالتقاط)، وهو انحراف عن
   «زرّ كهرماني واحد لكل شاشة» مسجَّل في docs/STATE.md. أُضيف بطلب
   صريح — والفعل واحد ونصّه واحد في كل مواضعه.

   والمقاسات تصغر على الجوال: القرص 48px بدل 64، والكلمة 24px بدل 48 —
   وإلا خرجت البطاقة عن نصف عرض 390px. */

export function ThreePoints({ cta }: { cta: string }) {
  return (
    <Section className="pt-4 pb-16 md:pb-20">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {POINTS.map(({ claim, why, Icon, fill, mark, edge, body }) => (
          <li
            key={claim}
            className={`group flex flex-col items-center rounded-xl border p-5 text-center transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-lift md:p-8 ${fill} ${edge}`}
          >
            {/* الأيقونة قرصًا فاتحًا على السطح المعتم لا ختمًا خلف
                النص: الختم الباهت كان يقع تحت الكلمة فيقلّل وضوحها،
                والكلمة هي المقصد. */}
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-pill transition-transform duration-300 ease-out group-hover:scale-110 md:h-16 md:w-16 ${mark}`}
            >
              <Icon className="h-6 w-6 md:h-8 md:w-8" />
            </span>

            {/* الكلمة أكبر عنصر في البطاقة، أبيض على السطح المعتم
                وخلفها خالٍ تمامًا. */}
            <h2 className="mt-4 font-display text-2xl leading-tight font-bold tracking-tight text-on-dominant md:mt-6 md:text-4xl">
              {claim}
            </h2>
            <p className={`mt-2 leading-base md:mt-3 md:text-lg ${body}`}>
              {why}
            </p>
          </li>
        ))}

        {/* الرابع — الفعل */}
        <li>
          <Link
            href="/courses"
            className="group flex h-full flex-col items-center justify-center rounded-xl bg-pressable p-5 text-center text-on-pressable transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-lift md:p-8"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-on-pressable/15 transition-transform duration-300 ease-out group-hover:scale-110 md:h-16 md:w-16">
              {/* السهم يشير إلى نهاية السطر — يسارًا في RTL */}
              <ArrowForward className="h-6 w-6 md:h-8 md:w-8" />
            </span>

            <span className="mt-4 font-display text-2xl leading-tight font-bold tracking-tight md:mt-6 md:text-4xl">
              {cta}
            </span>
            <span className="mt-2 leading-base md:mt-3 md:text-lg">
              بلا بطاقة ولا اشتراك
            </span>
          </Link>
        </li>
      </ul>
    </Section>
  );
}

/* ————— يسمع منك ويتكلم معك —————

   **سطر لا قسم**: بلا عنوان ولا وصف ولا بطاقات. الجملة نفسها هي
   المحتوى، والأيقونتان تقولان أي نصفٍ منها لمن — الميكروفون للطالب
   والموجة لبيكان. عنوانٌ فوقها كان يجعلها قسمًا ثالثًا بين قسمين،
   وهي ليست كذلك: هي فاصلةٌ تقول أهمّ ما يفرّق المنتج.

   **الحركة الوحيدة تناوبٌ في الإبراز**: النصف الفاعل بلونه كاملًا
   والآخر يخفت — فتُقرأ المناوبة حديثًا ذا اتجاهين بلا رسمٍ يشرحها.
   والنصّ نفسه لا يخفت أبدًا: الخفوت على الأيقونتين وحدهما فيبقى
   تباين الكلام كاملًا.

   الموجة خضراء `--live` كما هي في شريط الجلسة حرفيًا — «يحدث الآن».

   CSS لا Motion: حركة تعمل من نفسها بلا حدث (المزلق 12).
   و`prefers-reduced-motion` يثبّتها على أوّل مفتاح: الاثنتان
   ظاهرتان، فلا يضيع شيء. */

export function TwoWayVoice() {
  return (
    <Section className="pb-16 md:pb-24">
      <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12 xl:gap-16">
        {/* الشعار يصير وجهًا ويعود — أوّلًا في السطر، أي يمينه في RTL */}
        <BecanMorph className="shrink-0 text-ink" />

        {/* سطران لا سطر واحد: الجملة فعلان متقابلان، وسطرٌ واحد
            يجمعهما فيضيع تقابلهما. `block` على كل نصف يفرض القسمة
            في كل عرض بدل تركها لالتفاف النصّ. */}
        <p className="text-center font-display text-3xl leading-tight font-bold text-ink md:text-start md:text-4xl xl:text-5xl">
          <span className="flex items-center justify-center gap-3 md:justify-start">
            {/* الميكروفون لا ينعكس مع الاتجاه */}
            <MicIcon
              aria-hidden="true"
              className="animate-voice-hear h-[0.9em] w-[0.9em] shrink-0 text-aubergine-mid"
            />
            يسمع منك
          </span>{" "}
          {/* المسافة صريحة: العنصران متجاوران، وبلاها يقرأ القارئ
              الصوتي «منكويتكلم» كلمةً واحدة. */}
          <span className="mt-2 flex items-center justify-center gap-3 md:justify-start">
            ويتكلم معك
            <Waveform
              className="animate-voice-talk h-[0.62em] shrink-0 text-live"
              bars={9}
            />
          </span>
        </p>
      </div>
    </Section>
  );
}

/* ————— كيف يعمل —————
   الترقيم مستحقّ هنا لا زخرفة: التسلسل نفسه هو المعلومة — لا تبدأ
   الشرح قبل اختيار الفصل. وسطر تحت كل خطوة يقول ماذا يحدث فيها. */

const STEPS = [
  {
    step: "اختر مقررك",
    detail: "برمزه أو باسمه — تلقاه جاهزًا بفصوله",
    Icon: SearchIcon,
  },
  {
    step: "اختر الفصل",
    detail: "ترى مواضيعه ومدّته قبل ما تبدأ",
    Icon: LayersIcon,
  },
  {
    step: "ابدأ الشرح",
    detail: "يشرح على السبورة ويسألك ليتأكّد إنك فهمت",
    Icon: PlayIcon,
  },
];

export function HowItWorks({ cta }: { cta: string }) {
  return (
    <section id="how" className="relative overflow-hidden bg-aubergine-deep">
      {/* رسم خلفي — شبكة نقاط باهتة تعطي القسم عمقًا بلا أن تزاحم
          النص. تدرّج شعاعي يخفّها عند الحواف فلا تنتهي بخطّ حادّ. */}
      <span
        aria-hidden="true"
        className="dotgrid pointer-events-none absolute inset-0 opacity-[0.18]"
      />

      <div className="relative mx-auto w-full max-w-page px-4 py-16 md:px-8 md:py-20 xl:px-10">
        <h2 className="font-display text-3xl leading-tight font-bold text-on-dominant md:text-4xl xl:text-5xl">
          كيف يعمل
        </h2>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ step, detail, Icon }, i) => (
            <li key={step} className="relative flex gap-4 md:block">
              {/* الخيط الواصل بين الخطوات — يقول إنها سلسلة لا ثلاثة
                  عناصر متجاورة. يختفي بعد الأخيرة. */}
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute start-6 top-14 bottom-[-2rem] w-px bg-aubergine-mid md:start-14 md:top-6 md:bottom-auto md:h-px md:w-[calc(100%-3.5rem)]"
                />
              ) : null}

              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-aubergine-base text-on-dominant">
                <Icon />
              </span>

              <div className="md:mt-5">
                <p className="text-sm font-semibold text-aubergine-soft">
                  الخطوة {i + 1}
                </p>
                <h3 className="mt-1 text-xl font-bold text-on-dominant">
                  {step}
                </h3>
                <p className="mt-1.5 leading-base text-aubergine-tint">
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <PrimaryButton href="/courses" className="w-full sm:w-fit">
            {cta}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

/* ————— الدليل الاجتماعي —————

   عمودان: **الدعوى في بداية السطر، والشهادات تنساب في نهايته**.

   **الرقم هو العنوان وتتمّته**: لا سطر عنوانٍ ثالث فوقهما. `92%` ثم
   «من الطلاب قالوا…» جملة واحدة، وهي `h2` القسم كاملةً — فيقرؤها
   القارئ الصوتي جملةً لا رقمًا معلّقًا وعنوانًا منفصلًا. والرقم
   يكبر إلى حجم العرض لأنه صار العنوان لا رقمًا داخل فقرة.

   ————— الحركة —————

   ملفّ الاقتباسات يمنع **الشريط الدوّار** صراحةً: «الطالب لن ينتظر
   دورانه». وهذا اعتراضٌ على الاختفاء لا على الحركة — فالدوّار يُخفي
   بطاقتين ليعرض واحدة.

   والمنفَّذ هنا **انسياب لا دوران**: القائمة كلّها ظاهرة وتنزلق ببطء
   (32ث للدورة)، فلا بطاقة مخفيّة تنتظر دورها ولا شيء يُفوَّت. وتقف
   عند التمرير بالفأرة كي يُقرأ ما يُختار.

   **القائمة مكرّرة مرّتين** والإزاحة نصفُ ارتفاعها: العودة إلى الصفر
   تقع على صورة مطابقة فلا تُرى القفزة.

   **والفجوة داخل البطاقة (`mb`) لا بين القائمتين (`gap`)**: بالفجوة
   بينهما يصير الارتفاع `2H + G` ووحدةُ التكرار `H + G`، فلا يساويها
   النصف — وقيس الانزياح 8px في كل دورة. وبنقلها إلى البطاقة صارت كل
   قائمة وحدةً مكتفية بفجوتها الخلفية، والمجموع `2H` بالضبط.

   والنسخة الثانية `aria-hidden` وإلا قرأ القارئ الصوتي كل شهادة
   مرّتين.

   **التلاشي عند الحافّتين بقناع لا بتدرّج فوق البطاقات**: طبقةٌ فوقها
   كانت ستحجب ما تحتها عن الضغط، والقناع يخفت البكسل نفسه.

   وعلى الجوال يبقى الانسياب لكن بارتفاع أقصر — والعمودان يصيران
   طبقتين.

   المحتوى والمواصفات في `becan_testimonials.md`. */

const RATING = 4.12;

const VOICES = [
  {
    quote:
      "ساعدني في الوقت الضيق، وركّز على المهم، وفعلًا جاء في الاختبار النهائي.",
    stats: [
      { value: "28", label: "جلسة" },
      { value: "216", label: "دقيقة مذاكرة" },
      { value: "5.0", label: "تقييمه من 5" },
    ],
    fill: "bg-tint-amber",
  },
  {
    quote: "بذاكر منه مرة ثانية لاختبار الإعادة.",
    stats: [
      { value: "82", label: "دقيقة" },
      { value: "21", label: "دقيقة متوسط الجلسة" },
    ],
    fill: "bg-tint-aubergine",
  },
  {
    quote: "الشرح واضح وسلس وساعدني أفهم كثير.",
    /* بلا بيانات سلوك: من استبيان مجهول، فمصدره هو دليله */
    note: "من استبيان الاختبار الميداني",
    fill: "bg-tint-walnut",
  },
];

/** خمس نجوم، والتعبئة بالنسبة لا بالتقريب.
    والبطاقات بلا نجوم كما يشترط الملفّ: نجمةٌ فوق شهادةٍ تزاحم رقمها. */
function Stars({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  return (
    <span
      className="relative inline-flex"
      role="img"
      aria-label={`${value} من 5`}
    >
      <span aria-hidden="true" className="inline-flex gap-1 text-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className="h-6 w-6" />
        ))}
      </span>

      {/* `start-0` لا `left-0`: القصّ يبدأ من بداية السطر في الاتجاهين */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 overflow-hidden text-warmth"
        style={{ inlineSize: `${pct}%` }}
      >
        <span className="inline-flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-6 w-6" />
          ))}
        </span>
      </span>
    </span>
  );
}

function VoiceCard({ voice }: { voice: (typeof VOICES)[number] }) {
  return (
    <li className={`mb-4 rounded-xl p-6 ${voice.fill}`}>
      {/* بلا علامة تنصيص زخرفية — الحاصرتان جزء من النصّ */}
      <blockquote className="text-lg leading-base font-medium text-ink">
        «{voice.quote}»
      </blockquote>

      <div className="mt-5 border-t border-ink/10 pt-4">
        {voice.stats ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-3">
            {voice.stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-2xl leading-none font-bold text-ink">
                  {s.value}
                </dd>
                <dt className="mt-1 text-xs text-ink-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-ink-2">{voice.note}</p>
        )}
      </div>
    </li>
  );
}

/** التلاشي عند الحافّتين — قناعٌ على البكسل لا طبقةٌ فوق البطاقات. */
const FADE = {
  maskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
} as const;

export function Proof() {
  return (
    <Section className="py-16 md:py-20">
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:gap-12 xl:gap-16">
        {/* ————— الدعوى ————— */}
        <div>
          <h2 className="font-display font-bold text-ink">
            <span className="block text-7xl leading-none text-warmth md:text-8xl xl:text-9xl">
              92%
            </span>
            <span className="mt-5 block max-w-measure text-2xl leading-snug md:text-3xl xl:text-4xl">
              من الطلاب قالوا إن بيكان صار مصدرهم الأساسي للمذاكرة{" "}
              <span aria-hidden="true" className="text-[0.8em]">
                🫡
              </span>
            </span>
          </h2>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Stars value={RATING} />
            <p className="text-ink-2">
              <span className="font-semibold text-ink">{RATING}</span> من 5 ·
              تقييم الجلسات
            </p>
          </div>

          <p className="mt-6 max-w-measure text-sm text-ink-2">
            الأرقام من الاختبار الميداني — جلسات فعلية لا تسجيلات اهتمام.
          </p>
        </div>

        {/* ————— الشهادات تنساب ————— */}
        <div
          className="relative h-[26rem] overflow-hidden md:h-[32rem]"
          style={FADE}
        >
          <div className="animate-marquee marquee-track hover:[animation-play-state:paused]">
            <ul className="flex flex-col">
              {VOICES.map((v) => (
                <VoiceCard key={v.quote} voice={v} />
              ))}
            </ul>

            {/* النسخة الثانية تُكمل الدورة ولا تُقرأ */}
            <ul aria-hidden="true" className="flex flex-col">
              {VOICES.map((v) => (
                <VoiceCard key={v.quote} voice={v} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ————— اشترك الآن —————

   **العنوان فعلٌ لا تسمية**: «الأسعار» عنوان فهرس، و«اشترك الآن» طلب.
   وتحته المقارنة التي تبرّره.

   ⚠️ **«بسعر حصة واحدة» مرساةٌ يحذّر منها ملفّ البحث** (النتيجة 8:
   «مرساة سعر المدرس الخاص عندك مشكوك فيها»). كُتبت بطلب صريح، ويلزم
   تثبيت سعر الحصة قبل النشر وإلا صارت الجملة ادّعاءً غير مسنود.
   مسجَّلة في docs/STATE.md.

   **وجملة «بيكان نفسه في كل الخطط» حُذفت من هنا** بطلب صريح: العنوان
   طلبٌ لا مقارنة، وشرحُ التساوي في موضع الطلب يبرّد الاندفاع. وهي
   باقية في  حيث يقارن الطالب فعلًا.

   **المميّزة هي الوسطى** (لايت) لا الأخيرة: الوسط هو ما تقع عليه
   العين أولًا في شبكة ثلاثية، والقفزة من المجاني إليه أقصر — فهو
   أدعى للشراء من الأعلى سعرًا.

   وبطاقةُ الخطة مشتركة مع `/plans` (‏`./plans/plan-card`) فلا يفترق
   شكل التسعير بين موضعين. واللاندينج يقود إلى `/plans` لا إلى الدفع
   مباشرةً: يعرض ولا يبيع.

   **عدد الفصول محذوف من البطاقة** بطلب صريح، وباقٍ في جدول `/plans`.
   والدقائق وترجمتها إلى ساعات باقيتان — البريف يشترط الترجمة. */

export function Pricing() {
  return (
    <Section id="pricing" className="py-16 md:py-20">
      <SectionTitle>اشترك الآن</SectionTitle>

      <p className="mt-4 max-w-measure text-lg leading-base text-ink-2">
        تاخذ فايدة المدرّس الخصوصي —{" "}
        <span className="font-semibold text-ink">بسعر حصة واحدة منه</span>.
      </p>

      {/* `pt` يترك مجالًا لارتفاع البطاقة المميّزة فلا تُقصّ */}
      <ul className="mt-10 grid items-stretch gap-4 md:grid-cols-3 md:pt-3">
        {PLANS.map((plan) => (
          <li key={plan.id}>
            <PlanCard plan={plan} href="/plans" showBadge={!!plan.featured} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-2">
        الأسعار شهرية وشاملة ضريبة القيمة المضافة ·{" "}
        <Link
          href="/refunds"
          className="font-semibold text-pressable underline underline-offset-4"
        >
          تلغي في أي وقت
        </Link>
      </p>
    </Section>
  );
}

/* ————— الأسئلة الشائعة على اللاندينج —————

   خمسة أسئلة من `app/faq/faq-data.ts` نفسه — **لا نسخة ثانية من
   النصّ**: تُنتقى بسؤالها فإن غُيّر في المصدر ظهر الخطأ في البناء لا
   في الصفحة.

   **أوّلها «وش الفرق بينك وبين ChatGPT؟»** كما يشترط البريف. وبهذا
   يعود أوّل اعتراضٍ على المنتج إلى اللاندينج بعد أن كان محذوفًا منها
   (انحراف مسجَّل في docs/STATE.md) — لكن جوابًا في مكانه لا قسمًا
   مستقلًّا يجادل.

   وموضعه **قبل شريط الالتقاط مباشرة**: الاعتراض يُرفع من الطريق في
   اللحظة التي تسبق الطلب، لا بعده. */

const LANDING_FAQ = [
  "وش الفرق بينك وبين ChatGPT؟",
  "مقرري مو موجود، وش أسوي؟",
  "بيكان يغنيني عن المحاضرة؟",
  "وش يصير لو خلصت دقائقي؟",
  "كيف ألغي الاشتراك؟",
].map((q) => {
  const found = FAQ.flatMap((g) => g.questions).find((item) => item.q === q);
  if (!found) throw new Error(`سؤال غير موجود في faq-data: ${q}`);
  return found;
});

export function LandingFaq() {
  return (
    <Section className="pb-16 md:pb-20">
      <SectionTitle>أسئلة قبل ما تبدأ</SectionTitle>

      <div className="mt-8 max-w-measure overflow-hidden rounded-xl border border-line bg-surface">
        {LANDING_FAQ.map((item) => (
          <FaqItem key={item.q} item={item} />
        ))}
      </div>

      <div className="mt-6">
        <QuietLink href="/faq">شوف كل الأسئلة</QuietLink>
      </div>
    </Section>
  );
}
