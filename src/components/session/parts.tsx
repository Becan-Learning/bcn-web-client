"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Dialog } from "radix-ui";
import {
  ChatIcon,
  CheckIcon,
  Chevron,
  CloseIcon,
  ConfusedIcon,
  ListIcon,
  MicIcon,
  MicOffIcon,
  PlayIcon,
  ReplayIcon,
  RotateIcon,
  SlidesIcon,
  StopIcon,
  Waveform,
} from "@/components/becan/icons";
import { BecanGlyph } from "@/components/becan/becan-face";
import type { BoardItem, BoardState } from "@/lib/session/teaching-board";
import type { Checkpoint } from "@/lib/session/session-reducer";

/* أجزاء شاشة الجلسة — تصميم becan-design (الشاشة 7) على محرّك حقيقي.
   الفرق عن التصميم: الحالة تأتي من الوكيل لا من نصّ مؤقَّت، والأدوات
   التي لا يدعمها الوكيل بعد ظاهرة بحدّ متقطّع ووسم «قريبًا». */

export type Phase =
  | "idle"
  | "connecting"
  | "live"
  | "thinking"
  | "listening"
  | "question"
  | "ending"
  | "cut";

export type TopicState = "none" | "now" | "done";

export type SessionLanguage = "Arabic" | "English";

/** «درس واحد · درسان · 3 دروس · 11 درسًا» */
export function lessonsLabel(n: number) {
  if (n === 1) return "درس واحد";
  if (n === 2) return "درسان";
  if (n >= 3 && n <= 10) return `${n} دروس`;
  return `${n} درسًا`;
}

/* ————— نافذة داخل سطح الجلسة —————
   Radix يرسم النافذة في بوابة خارج غلاف الجلسة، فتفقد سمتَي
   data-theme و data-surface ويقرأ نصّها ألوان الموقع الفاتح. الغلاف
   هنا يعيدهما، و`text-ink` لأن النصّ يرث لون body (مزلق 7).
   ومنه حبس التركيز وإغلاق Escape — النقطة المفتوحة في مراجعة التصميم. */

function SessionDialog({
  open,
  onOpenChange,
  title,
  overlayClassName,
  contentClassName,
  onOpenAutoFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  overlayClassName: string;
  contentClassName: string;
  /** لتوجيه التركيز الأول إلى زرّ بعينه بدل أول عنصر في النافذة */
  onOpenAutoFocus?: (event: Event) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div data-theme="dark" data-surface="session" className="text-ink">
          <Dialog.Overlay className={overlayClassName} />
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={onOpenAutoFocus}
            className={contentClassName}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ————— الشريط العلوي ————— */

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  connecting: "يجهّز الجلسة",
  live: "يشرح الآن",
  thinking: "يفكّر",
  listening: "يسمعك",
  question: "سؤال",
  ending: "انتهت الجلسة",
  cut: "انقطع الاتصال",
};

export function TopBar({
  phase,
  courseName,
  chapterNo,
  detail,
  onExit,
}: {
  phase: Phase;
  courseName: string;
  chapterNo: number;
  /** «الموضوع 2 من 5» — من رسالة set_topic */
  detail?: string;
  onExit: () => void;
}) {
  const live = phase === "live";
  /* في السؤال تتوقف النبضة ويبقى النصّ «سؤال» (بريف الجلسة، الحالة 3) */
  const pulse = phase === "listening" || phase === "thinking";

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-3 py-1 md:px-4">
      <p
        role="status"
        className={`flex items-center gap-2 text-xs font-semibold ${
          live ? "text-success" : "text-ink"
        }`}
      >
        {/* مؤشّر واحد لكل حالة: موجة أثناء الشرح، نبضة أثناء الاستماع */}
        {live ? <Waveform className="h-3 text-success" /> : null}
        {pulse ? (
          <span
            aria-hidden="true"
            className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center"
          >
            <span className="absolute inline-block h-2 w-2 rounded-pill bg-ink animate-speak" />
            <span className="relative inline-block h-2 w-2 rounded-pill bg-ink" />
          </span>
        ) : null}
        {PHASE_LABEL[phase]}
      </p>

      <p className="min-w-0 truncate text-xs text-ink-2">
        {courseName} · الفصل {chapterNo}
        {detail ? ` · ${detail}` : ""}
      </p>

      {/* هدف اللمس 44px على الجوال، وأصغر على الديسكتوب حيث الإدخال فأرة */}
      <button
        type="button"
        onClick={onExit}
        aria-label="خروج من الجلسة"
        title="خروج من الجلسة"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 hover:bg-panel pointer-fine:md:h-8 pointer-fine:md:w-8"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </header>
  );
}

/* ————— قائمة الدروس — مراحل بحالات ————— */

const STATE_LABEL: Record<TopicState, string> = {
  none: "لم يبدأ",
  now: "يُشرح الآن",
  done: "تم",
};

/** دائرة الدرس المرقّمة — تحمل حالته لونًا ورقمه نصًّا. */
function TopicPip({
  n,
  state,
  active,
}: {
  n: number;
  state: TopicState;
  active: boolean;
}) {
  const skin =
    state === "done"
      ? "border-transparent bg-success text-ground"
      : state === "now"
        ? "border-transparent bg-ink text-ground"
        : "border-ink-3 text-ink-2";

  return (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
      {state === "now" ? (
        <span
          aria-hidden="true"
          className="absolute h-5 w-5 rounded-pill bg-success animate-speak"
        />
      ) : null}
      <span
        className={`relative flex h-5 w-5 items-center justify-center rounded-pill border text-[10px] font-bold transition-colors ${skin} ${
          active ? "ring-1 ring-ink ring-offset-1 ring-offset-panel" : ""
        }`}
      >
        {/* المنتهي بعلامة لا بلون وحده */}
        {state === "done" ? <CheckIcon className="h-3 w-3" /> : n}
      </span>
    </span>
  );
}

type TopicsProps = {
  topics: string[];
  stateOf: (i: number) => TopicState;
  current: number;
  onPick: (i: number) => void;
};

/** القائمة الكاملة — تُستعمل في منسدلة الديسكتوب وفي ورقة الجوال. */
export function TopicsList({ topics, stateOf, current, onPick }: TopicsProps) {
  if (topics.length === 0) {
    return (
      <p className="p-4 text-sm leading-base text-ink-2">
        ما وصلت قائمة الدروس. تقدر تبدأ الشرح من الدرس الأول مباشرة.
      </p>
    );
  }

  return (
    <ol className="no-scrollbar h-full overflow-y-auto p-1.5">
      {topics.map((t, i) => {
        const st = stateOf(i);
        const active = i === current;
        return (
          <li key={`${i}-${t}`}>
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={active ? "step" : undefined}
              className={`relative flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start transition-colors ${
                active
                  ? "bg-surface text-ink"
                  : "text-ink-2 hover:bg-surface/60 hover:text-ink"
              }`}
            >
              <TopicPip n={i + 1} state={st} active={false} />
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block truncate text-sm">
                  {t}
                </span>
                <span className="block text-xs text-ink-2">{STATE_LABEL[st]}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ————— مسار الدروس على الجوال —————
   نفس دوائر الديسكتوب موصولةً بخطوط، لكن أفقيًا تحت الشريط العلوي. */

export function TopicsTrack({
  topics,
  stateOf,
  current,
  onPick,
  open,
  onToggle,
}: TopicsProps & { open: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.querySelector('[data-current="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);

  return (
    <div className="flex shrink-0 items-center gap-1 px-2 md:hidden">
      {/* المؤشّر في بداية السطر، خارج الجزء المُمرَّر فيبقى في مكانه */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "أغلق قائمة الدروس" : "افتح قائمة الدروس"}
        title={open ? "أغلق قائمة الدروس" : "افتح قائمة الدروس"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
      >
        <Chevron className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div ref={ref} className="no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto">
        {topics.map((t, i) => (
          <div key={`${i}-${t}`} className="flex shrink-0 items-center">
            <button
              type="button"
              data-current={i === current ? "true" : undefined}
              onClick={() => onPick(i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={`${i + 1}. ${t} — ${STATE_LABEL[stateOf(i)]}`}
              title={`${i + 1}. ${t}`}
              className="flex h-11 w-11 items-center justify-center"
            >
              <TopicPip n={i + 1} state={stateOf(i)} active={i === current} />
            </button>

            {i < topics.length - 1 ? (
              <span
                aria-hidden="true"
                className={`h-px w-3 shrink-0 ${stateOf(i) === "done" ? "bg-success" : "bg-line"}`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————— عمود الدروس على الديسكتوب ————— */

export function TopicsRail({
  topics,
  stateOf,
  current,
  onPick,
  open,
  onToggle,
}: TopicsProps & { open: boolean; onToggle: () => void }) {
  const done = topics.filter((_, i) => stateOf(i) === "done").length;

  return (
    <div className="relative hidden shrink-0 md:block">
      <section className="flex h-full w-16 flex-col items-center overflow-hidden rounded-xl border border-line bg-panel py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "أغلق قائمة الدروس" : "افتح قائمة الدروس"}
          title={open ? "أغلق قائمة الدروس" : "افتح قائمة الدروس"}
          /* 44px للّمس (التابلت فوق md لمسٌ أيضًا)، و32px حين المؤشّر فأرة */
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink pointer-fine:h-8 pointer-fine:w-8"
        >
          {/* القائمة تطفو إلى نهاية السطر: مغلقةً يشير السهم إليها، ومفتوحةً
              يشير عائدًا إلى العمود. الدوران يتبع الاتجاه كما تتبعه القائمة
              (start-[…])، فالشيفرون ينعكس مع السطر. */}
          <Chevron
            className={`h-4 w-4 transition-transform ${
              open ? "ltr:rotate-90 rtl:-rotate-90" : "ltr:-rotate-90 rtl:rotate-90"
            }`}
          />
        </button>

        <p className="mt-1 shrink-0 text-[10px] font-semibold text-ink-2">دروس</p>
        <p className="shrink-0 text-[10px] text-ink-2">
          {done}/{topics.length}
        </p>

        <ol className="no-scrollbar mt-2 flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
          {topics.map((t, i) => (
            <li key={`${i}-${t}`} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={i === current ? "step" : undefined}
                aria-label={`${i + 1}. ${t} — ${STATE_LABEL[stateOf(i)]}`}
                title={`${i + 1}. ${t}`}
                className="flex h-6 w-6 items-center justify-center"
              >
                <TopicPip n={i + 1} state={stateOf(i)} active={i === current} />
              </button>

              {i < topics.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-px shrink-0 ${stateOf(i) === "done" ? "bg-success" : "bg-line"}`}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* القائمة المنسدلة — تطفو فوق السبورة ولا توسّع العمود */}
      {open ? (
        <div className="absolute inset-y-0 start-[calc(100%+0.5rem)] z-30 w-64 overflow-hidden rounded-xl border border-line bg-panel shadow-lift">
          <TopicsList topics={topics} stateOf={stateOf} current={current} onPick={onPick} />
        </div>
      ) : null}
    </div>
  );
}

/** ورقة الدروس على الجوال — في متناول الإبهام (نمط 10). */
export function TopicsSheet({
  open,
  onClose,
  ...list
}: TopicsProps & { open: boolean; onClose: () => void }) {
  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="الدروس"
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm md:hidden"
      contentClassName="fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-xl border border-line bg-panel shadow-lift md:hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-1">
        <p className="text-sm font-semibold text-ink">الدروس</p>
        <Dialog.Close
          aria-label="أغلق الدروس"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </Dialog.Close>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <TopicsList {...list} />
      </div>
    </SessionDialog>
  );
}

/* ————— تنبيه قلب الشاشة —————
   نافذة تظهر مرة واحدة قبل البدء وفي الوضع الرأسي وحده — `portrait:`
   تُخفيها فور القلب بلا جافاسكربت ولا مستمع أحداث. */

export function RotateNotice() {
  const [shown, setShown] = useState(true);
  if (!shown) return null;

  return (
    <div className="fixed inset-0 z-40 hidden items-center justify-center p-6 portrait:flex md:portrait:hidden">
      {/* الخلفية خارج ترتيب التبويب — «تمام» يؤدّي الإغلاق نفسه */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="إغلاق"
        onClick={() => setShown(false)}
        className="absolute inset-0 bg-ground/85 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="اقلب الشاشة"
        className="relative w-full max-w-xs rounded-xl border border-line bg-surface-3 p-6 text-center shadow-lift"
      >
        <RotateIcon spinning className="mx-auto h-12 w-12 text-ink-2" />
        <p className="mt-4 text-xl font-bold text-ink">اقلب الشاشة</p>
        <p className="mx-auto mt-2 max-w-[22ch] text-sm leading-base text-ink-2">
          عشان تاخذ أفضل تجربة
        </p>
        {/* مقلوب لا كهرماني — الكهرماني الوحيد في الشاشة زرّ البدء */}
        <button
          type="button"
          onClick={() => setShown(false)}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-pill bg-ink px-5 text-sm font-bold text-ground"
        >
          تمام
        </button>
      </div>
    </div>
  );
}

/* ————— السبورة —————
   ما يكتبه الوكيل بـ board_* يُرسم بكتل التصميم:
   العنوان رأس · الخطوة مربّع مرقّم · النقطة سطر بعلامة · النصّ مثال.
   اللوح الفارغ أو المخفيّ يحمل مقدّمة الفصل بدل الفراغ. */

const markClass = "rounded-sm bg-tint-amber px-1.5 font-semibold text-ground";

function BoardLine({
  item,
  n,
  marked,
  reduce,
}: {
  item: BoardItem;
  n: number;
  marked: boolean;
  reduce: boolean;
}) {
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 7 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
      };

  /* لون النصّ يُبنى شرطيًا لا بالتكديس (مزلق 8) */
  if (item.type === "title") {
    return (
      <motion.p {...anim} className="text-xl leading-base font-bold text-ink md:text-2xl">
        <span dir="auto" className={marked ? markClass : undefined}>
          {item.text}
        </span>
      </motion.p>
    );
  }

  if (item.type === "step") {
    return (
      <motion.p {...anim} className="flex items-baseline gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-aubergine-mid text-xs font-bold text-on-dominant">
          {n}
        </span>
        <span dir="auto" className={`min-w-0 ${marked ? markClass : "font-semibold text-ink"}`}>
          {item.text}
        </span>
      </motion.p>
    );
  }

  if (item.type === "bullet") {
    return (
      <motion.p {...anim} className="flex items-baseline gap-3">
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-pill bg-ink-2" />
        </span>
        <span dir="auto" className={`min-w-0 ${marked ? markClass : "text-ink"}`}>
          {item.text}
        </span>
      </motion.p>
    );
  }

  return (
    <motion.p {...anim} dir="auto" className={marked ? `${markClass} self-start` : "text-ink-2"}>
      {item.text}
    </motion.p>
  );
}

export function Board({
  board,
  speaking,
  intro,
  reduce,
}: {
  board: BoardState;
  speaking: boolean;
  intro: React.ReactNode;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const count = board.items.length + (board.title ? 1 : 0);
  const empty = !board.visible || count === 0;

  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [count, reduce]);

  if (empty) {
    return (
      <div className="chalkboard flex flex-1 flex-col justify-center overflow-y-auto rounded-xl border border-chalkboard-edge px-6 pt-8 pb-20 md:px-10">
        <div className="mx-auto w-full max-w-measure">{intro}</div>
      </div>
    );
  }

  const steps = new Map<string, number>();
  board.items
    .filter((it) => it.type === "step")
    .forEach((it, i) => steps.set(it.id, i + 1));

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label="السبورة"
      className="chalkboard flex-1 overflow-y-auto rounded-xl border border-chalkboard-edge px-5 pt-6 pb-20 md:px-8 md:pt-8"
    >
      <div aria-live="polite" className="mx-auto flex max-w-measure flex-col gap-4">
        {board.title ? (
          <BoardLine
            key={board.title.id}
            item={board.title}
            n={0}
            marked={board.emphasizedId === board.title.id}
            reduce={reduce}
          />
        ) : null}
        {board.items.map((item) => (
          <BoardLine
            key={item.id}
            item={item}
            n={steps.get(item.id) ?? 0}
            marked={board.emphasizedId === item.id}
            reduce={reduce}
          />
        ))}
        {speaking ? <Caret /> : null}
      </div>
    </div>
  );
}

export function Caret() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-[3px] bg-ink-2 align-middle animate-caret"
    />
  );
}

/** اختيار لغة الشرح — قبل البدء وحده، لأنها تُرسل مع رمز الدخول. */
export function LanguageChoice({
  value,
  onChange,
}: {
  value: SessionLanguage;
  onChange: (v: SessionLanguage) => void;
}) {
  const options: { id: SessionLanguage; label: string; latin?: boolean }[] = [
    { id: "Arabic", label: "عربي" },
    { id: "English", label: "English", latin: true },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <p id="lang-label" className="text-sm text-ink-2">
        لغة الشرح
      </p>
      <div
        role="group"
        aria-labelledby="lang-label"
        className="flex items-center gap-0.5 rounded-pill bg-surface p-0.5"
      >
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`inline-flex h-11 items-center rounded-pill px-4 text-sm font-semibold transition-colors md:h-8 ${
                on ? "bg-ink text-ground" : "text-ink-2 hover:text-ink"
              }`}
            >
              {o.latin ? <span dir="ltr">{o.label}</span> : o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ————— الشات / الكتابة —————
   يُرسل نصّ الطالب إلى الوكيل على lk.chat. */

export function ChatPanel({
  listening,
  onSend,
  onClose,
}: {
  listening: boolean;
  onSend: (text: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const ok = await onSend(t);
    setSending(false);
    if (ok) {
      setText("");
      onClose();
    }
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      className="absolute inset-x-2 bottom-[4.25rem] z-20 rounded-xl border border-line bg-surface-2 p-4 animate-board-in"
    >
      <label htmlFor="ask" className="text-sm text-ink-2">
        {listening ? "يسمعك — أو اكتب سؤالك" : "اكتب سؤالك"}
      </label>
      <div className="mt-2 flex gap-2">
        {/* التركيز بمرجع نداء لحظة التركيب — لا مؤقّت ولا rAF (مزلق 14ب) */}
        <input
          id="ask"
          ref={(el) => el?.focus()}
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-ground px-4 text-ink placeholder:text-ink-2"
          placeholder="وش اللي ما وضح؟"
        />
        <button
          type="submit"
          aria-disabled={sending || !text.trim() ? true : undefined}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-pill border border-line px-5 text-sm font-semibold text-ink"
        >
          أرسل
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="أغلق الشات"
          title="أغلق الشات"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* ————— شريط الأدوات ————— */

function IconBtn({
  label,
  onClick,
  active,
  danger,
  soon,
  disabled,
  hideOnMobile,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  /** أداة لا يدعمها الوكيل بعد — ظاهرة ومعطّلة */
  soon?: boolean;
  /** معطّلة في هذه المرحلة فقط (لا «قريبًا») */
  disabled?: boolean;
  /** تُخفى دون sm لتتّسع الأدوات الأساسية في شريط 390px */
  hideOnMobile?: boolean;
  children: React.ReactNode;
}) {
  const inert = soon || disabled;
  const name = soon ? `${label} — قريبًا` : label;
  const skin = soon
    ? "border border-dashed border-ink-3 text-ink-2"
    : disabled
      ? "bg-surface text-ink-2 opacity-45"
      : danger
        ? "bg-surface text-ink-2"
        : active
          ? "bg-ink text-ground"
          : "bg-surface text-ink-2 hover:text-ink";

  return (
    <button
      type="button"
      onClick={inert ? undefined : onClick}
      aria-label={name}
      title={name}
      aria-pressed={inert ? undefined : active}
      aria-disabled={inert ? true : undefined}
      /* هدف اللمس 44px على الجوال والقرص المرئي 34 داخله؛
         وعلى الديسكتوب 32px هدفًا وقرصًا معًا — الإدخال فأرة.
         العرض يُبنى شرطيًا: flex و hidden لا يُكدَّسان (مزلق 8). */
      className={`${hideOnMobile ? "hidden sm:flex" : "flex"} h-11 w-11 shrink-0 items-center justify-center pointer-fine:md:h-8 pointer-fine:md:w-8`}
    >
      <span
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-pill transition-colors md:h-8 md:w-8 [&_svg]:h-[18px] [&_svg]:w-[18px] md:[&_svg]:h-4 md:[&_svg]:w-4 ${skin}`}
      >
        {children}
      </span>
    </button>
  );
}

/* فقاعة فوق زرّ البدء — مقلوبة لا كهرمانية، وتوسيطها بـ inset-x-0
   لا بـ start-1/2 مع إزاحة (تنقلب في RTL). */
function StartHint() {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-full z-20 flex justify-center pb-2">
      <span className="flex flex-col items-center animate-nudge">
        <span className="whitespace-nowrap rounded-pill bg-ink px-3 py-1.5 text-xs font-bold text-ground shadow-lift">
          اضغط هنا لتبدأ الشرح
        </span>
        <span aria-hidden="true" className="-mt-1 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink" />
      </span>
    </span>
  );
}

const SPEEDS = ["بطيء", "طبيعي", "سريع"] as const;

export function Toolbar({
  phase,
  mic,
  chat,
  slides,
  topics,
  hint,
  onPrimary,
  onMic,
  onChat,
  onSlides,
  onTopics,
  onEnd,
}: {
  phase: Phase;
  mic: boolean;
  chat: boolean;
  slides: boolean;
  topics: boolean;
  hint?: boolean;
  onPrimary: () => void;
  onMic: () => void;
  onChat: () => void;
  onSlides: () => void;
  onTopics: () => void;
  onEnd: () => void;
}) {
  const canStart = phase === "idle" || phase === "cut";
  const primaryLabel = canStart ? "ابدأ الشرح" : "وقّف — قريبًا";
  /* الإنهاء لا معنى له قبل البدء ولا بعد الانقطاع — يبقى ظاهرًا معطّلًا
     كي لا يتزحزح الشريط لحظة البدء */
  const inSession = !canStart && phase !== "ending";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-pill border border-line bg-panel px-1 py-0.5 shadow-lift md:gap-1 md:px-1.5 md:py-1">
        {/* إدخال الطالب */}
        <div className="flex items-center gap-1">
          <IconBtn
            label={mic ? "أقفل المايك" : "افتح المايك"}
            onClick={onMic}
            danger={!mic}
            active={mic}
          >
            {mic ? <MicIcon /> : <MicOffIcon />}
          </IconBtn>
          <IconBtn label="الشات" onClick={onChat} active={chat}>
            <ChatIcon />
          </IconBtn>
          <IconBtn label="ما فهمت" soon>
            <ConfusedIcon />
          </IconBtn>
        </div>

        <Divider />

        {/* الزر الأساسي — الكهرماني الوحيد في الشاشة. وجه بيكان يسكنه
            ويتكلّم حين يشرح؛ وأيقونة التشغيل تظهر عند التمرير قبل البدء. */}
        <span className="group/primary relative flex shrink-0">
          {hint ? <StartHint /> : null}
          <button
            type="button"
            onClick={canStart ? onPrimary : undefined}
            aria-label={primaryLabel}
            title={primaryLabel}
            aria-disabled={canStart ? undefined : true}
            aria-busy={phase === "connecting" ? true : undefined}
            /* الكهرماني للقابل للضغط وحده: أثناء الجلسة الإيقاف «قريبًا»،
               فيأخذ مظهر الأدوات المعطّلة ويبقى الوجه يتكلّم داخله */
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-pill transition-transform duration-200 ${
              canStart
                ? "bg-pressable text-on-pressable hover:scale-110 active:scale-95"
                : "border border-dashed border-ink-3 text-ink-2"
            }`}
          >
            <BecanGlyph
              speaking={phase === "live"}
              className={`h-6 w-8 transition-opacity ${
                canStart
                  ? "group-hover/primary:opacity-0 group-focus-within/primary:opacity-0"
                  : ""
              }`}
            />
            {canStart ? (
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/primary:opacity-100 group-focus-within/primary:opacity-100">
                <PlayIcon className="h-5 w-5 md:h-4 md:w-4" />
              </span>
            ) : null}
          </button>
        </span>

        <Divider />

        {/* أدوات العرض */}
        <div className="flex items-center gap-1">
          {/* يُخفى على الجوال ليتّسع الشريط لزرّ الإنهاء */}
          <IconBtn label="أعد السطر" soon hideOnMobile>
            <ReplayIcon />
          </IconBtn>

          <div
            role="group"
            aria-label="سرعة الشرح — قريبًا"
            title="قريبًا"
            className="hidden items-center gap-0.5 rounded-pill border border-dashed border-ink-3 p-0.5 sm:flex"
          >
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-disabled
                aria-pressed={s === "طبيعي"}
                className={`inline-flex h-11 items-center rounded-pill px-2.5 text-[11px] font-semibold md:h-8 ${
                  s === "طبيعي" ? "bg-surface text-ink" : "text-ink-2"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <IconBtn label="الشرائح" onClick={onSlides} active={slides}>
            <SlidesIcon />
          </IconBtn>
          <IconBtn label="الدروس" onClick={onTopics} active={topics}>
            <ListIcon />
          </IconBtn>
          {/* لا أحمر: الإنهاء قرار الطالب لا خطأ، والتأكيد نافذة لا لون */}
          <IconBtn label="إنهاء الجلسة" onClick={onEnd} disabled={!inSession}>
            <StopIcon />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-line sm:block" />;
}

/* ————— نافذة سؤال الفهم —————
   الاختيار يُرسل نصّه إلى الوكيل، والوكيل يصحّحه بصوته — فلا تلوين
   صح/خطأ هنا. والسبورة لا تُمسح تحت النافذة. */

export function QuestionDialog({
  checkpoint,
  open,
  onChoose,
  onDismiss,
}: {
  checkpoint: Checkpoint | null;
  open: boolean;
  onChoose: (choice: string) => void;
  onDismiss: () => void;
}) {
  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
      title="سؤال الفهم"
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm"
      contentClassName="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[80dvh] max-w-measure overflow-y-auto rounded-xl border-2 border-ink-3 bg-surface-3 p-5 shadow-lift animate-board-in md:inset-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:p-6"
    >
      <Dialog.Close
        aria-label="أجاوب بصوتي"
        title="أجاوب بصوتي"
        className="float-end -mt-1 -me-1 flex h-11 w-11 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-ground hover:text-ink"
      >
        <CloseIcon className="h-4 w-4" />
      </Dialog.Close>
      <p className="text-xs font-semibold text-ink-2">سؤال</p>
      <p dir="auto" className="mt-2 text-xl font-bold text-ink">
        {checkpoint?.question}
      </p>
      {checkpoint && checkpoint.choices.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {checkpoint.choices.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => onChoose(c)}
                className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-ground px-4 text-start text-ink transition-colors hover:border-ink-2"
              >
                <span dir="auto">{c}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 leading-base text-ink-2">جاوب بصوتك، أو اكتب جوابك في الشات.</p>
      )}
    </SessionDialog>
  );
}

/* ————— تأكيد إنهاء الجلسة —————
   ضغطة عابرة على الشريط لا تُنهي شرحًا صوتيًا حيًّا. التركيز الأول
   على «كمّل» فلا يُنهيها Enter بالخطأ، وEscape يُلغي. */

export function EndSessionDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const stayRef = useRef<HTMLButtonElement>(null);

  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
      title="تنهي الجلسة؟"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        stayRef.current?.focus();
      }}
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm"
      contentClassName="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl border-2 border-ink-3 bg-surface-3 p-5 shadow-lift animate-board-in md:inset-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:p-6"
    >
      <p className="text-xl font-bold text-ink">تنهي الجلسة؟</p>
      <p className="mt-2 leading-base text-ink-2">تقدر ترجع لنفس الفصل بعدين.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          ref={stayRef}
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center justify-center rounded-pill border border-ink-2 px-6 font-semibold text-ink"
        >
          كمّل
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-12 items-center justify-center rounded-pill border border-line px-6 font-semibold text-ink"
        >
          أنهِ الجلسة
        </button>
      </div>
    </SessionDialog>
  );
}

/** حالة لوح الشرائح قبل تحميل العارض أو عند تعذّره */
export function SlidesMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-24 flex-1 items-center justify-center rounded-lg border border-line bg-panel p-4 text-center text-sm text-ink-2">
      {text}
    </div>
  );
}
