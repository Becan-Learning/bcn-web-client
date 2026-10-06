"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { ExplanationLanguage } from "./explanation-language";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useAudioWaveform, useTrackVolume, type useSession } from "@livekit/components-react";
import {
  ChatIcon,
  CheckIcon,
  Chevron,
  CloseIcon,
  ListIcon,
  MicIcon,
  PlayIcon,
  RotateIcon,
  SlidesIcon,
  LeaveIcon,
  Waveform,
} from "@/components/becan/icons";
import { BecanGlyph } from "@/components/becan/becan-face";
import type { Checkpoint } from "@/lib/session/session-reducer";

/* أجزاء شاشة الجلسة — تصميم becan-design (الشاشة 7) على محرّك حقيقي.
   الحالة تأتي من الوكيل، وصوت الطالب محصور في سؤال الطالب. */

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
  const t = useTranslations("Session");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
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
        {t(`phase.${phase}`)}
      </p>

      <p className="min-w-0 truncate text-xs text-ink-2">
        {t(detail ? "courseChapterDetail" : "courseChapter", {
          course: courseName, number: number(chapterNo), ...(detail ? { detail } : {}),
        })}
      </p>

      {/* هدف اللمس 44px على الجوال، وأصغر على الديسكتوب حيث الإدخال فأرة */}
      <button
        type="button"
        onClick={onExit}
        aria-label={t("exit")}
        title={t("exit")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 hover:bg-panel pointer-fine:md:h-8 pointer-fine:md:w-8"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </header>
  );
}

/* ————— قائمة الدروس — مراحل بحالات ————— */

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
  const t = useTranslations("Session");
  if (topics.length === 0) {
    return (
      <p className="p-4 text-sm leading-base text-ink-2">
        {t("noLessons")}
      </p>
    );
  }

  return (
    <ol className="no-scrollbar h-full overflow-y-auto p-1.5">
      {topics.map((topic, i) => {
        const st = stateOf(i);
        const active = i === current;
        return (
          <li key={`${i}-${topic}`}>
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
                  {topic}
                </span>
                <span className="block text-xs text-ink-2">{t(`lessonState.${st}`)}</span>
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
  const t = useTranslations("Session");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
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
        aria-label={open ? t("closeLessonsList") : t("openLessonsList")}
        title={open ? t("closeLessonsList") : t("openLessonsList")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
      >
        <Chevron className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div ref={ref} className="no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto">
        {topics.map((topic, i) => (
          <div key={`${i}-${topic}`} className="flex shrink-0 items-center">
            <button
              type="button"
              data-current={i === current ? "true" : undefined}
              onClick={() => onPick(i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={t("lessonAccessible", { number: number(i + 1), lesson: topic, state: t(`lessonState.${stateOf(i)}`) })}
              title={t("lessonTitle", { number: number(i + 1), lesson: topic })}
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
  const t = useTranslations("Session");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const done = topics.filter((_, i) => stateOf(i) === "done").length;

  return (
    <div className="relative hidden shrink-0 md:block">
      <section className="flex h-full w-16 flex-col items-center overflow-hidden rounded-xl border border-line bg-panel py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? t("closeLessonsList") : t("openLessonsList")}
          title={open ? t("closeLessonsList") : t("openLessonsList")}
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

        <p className="mt-1 shrink-0 text-[10px] font-semibold text-ink-2">{t("lessonsShort")}</p>
        <p className="shrink-0 text-[10px] text-ink-2">
          {t("lessonProgress", { done: number(done), total: number(topics.length) })}
        </p>

        <ol className="no-scrollbar mt-2 flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
          {topics.map((topic, i) => (
            <li key={`${i}-${topic}`} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={i === current ? "step" : undefined}
                aria-label={t("lessonAccessible", { number: number(i + 1), lesson: topic, state: t(`lessonState.${stateOf(i)}`) })}
                title={t("lessonTitle", { number: number(i + 1), lesson: topic })}
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
  const t = useTranslations("Session");
  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={t("lessons")}
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm md:hidden"
      contentClassName="fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-xl border border-line bg-panel shadow-lift md:hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-1">
        <p className="text-sm font-semibold text-ink">{t("lessons")}</p>
        <Dialog.Close
          aria-label={t("closeLessons")}
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
  const t = useTranslations("Session");
  const [shown, setShown] = useState(true);
  if (!shown) return null;

  return (
    <div className="fixed inset-0 z-40 hidden items-center justify-center p-6 portrait:flex md:portrait:hidden">
      {/* الخلفية خارج ترتيب التبويب — «تمام» يؤدّي الإغلاق نفسه */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("close")}
        onClick={() => setShown(false)}
        className="absolute inset-0 bg-ground/85 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("rotate")}
        className="relative w-full max-w-xs rounded-xl border border-line bg-surface-3 p-6 text-center shadow-lift"
      >
        <RotateIcon spinning className="mx-auto h-12 w-12 text-ink-2" />
        <p className="mt-4 text-xl font-bold text-ink">{t("rotate")}</p>
        <p className="mx-auto mt-2 max-w-[22ch] text-sm leading-base text-ink-2">
          {t("rotateHint")}
        </p>
        {/* مقلوب لا كهرماني — الكهرماني الوحيد في الشاشة زرّ البدء */}
        <button
          type="button"
          onClick={() => setShown(false)}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-pill bg-ink px-5 text-sm font-bold text-ground"
        >
          {t("okay")}
        </button>
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
  value: ExplanationLanguage;
  onChange: (v: ExplanationLanguage) => void;
}) {
  const t = useTranslations("Session");
  const labelId = useId();
  const options = [
    { id: "Arabic", label: t("languageOptions.ar"), lang: "ar", dir: "rtl" },
    { id: "English", label: t("languageOptions.en"), lang: "en", dir: "ltr" },
  ] as const;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <p id={labelId} className="text-sm text-ink-2">
        {t("explanationLanguage")}
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex items-center gap-0.5 rounded-pill bg-surface p-0.5"
      >
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              lang={o.lang}
              dir={o.dir}
              onClick={() => onChange(o.id)}
              className={`inline-flex h-11 items-center rounded-pill px-4 text-sm font-semibold transition-colors md:h-8 ${
                on ? "bg-ink text-ground" : "text-ink-2 hover:text-ink"
              }`}
            >
              {o.label}
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
  onSend,
  onClose,
}: {
  onSend: (text: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const t = useTranslations("Session");
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
        {t("chatQuestion")}
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
          placeholder={t("chatPlaceholder")}
        />
        <button
          type="submit"
          aria-disabled={sending || !text.trim() ? true : undefined}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-pill border border-line px-5 text-sm font-semibold text-ink"
        >
          {t("send")}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeChat")}
          title={t("closeChat")}
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
  label, text, onClick, active, disabled, children,
}: {
  label: string;
  /** كلمة ظاهرة بجانب الأيقونة؛ بدونها يبقى الزرّ أيقونة وحدها. */
  text?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const skin = disabled
    ? "bg-surface text-ink-2 opacity-45"
    : active ? "bg-ink text-ground" : "bg-surface text-ink-2 hover:text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      className={`group/btn flex h-11 shrink-0 items-center justify-center rounded-pill pointer-fine:md:h-8 ${text ? "focus-visible:outline-none" : "w-11 pointer-fine:md:w-8"}`}
    >
      <span className={`inline-flex h-[34px] items-center justify-center rounded-pill transition-colors md:h-8 [&_svg]:h-[18px] [&_svg]:w-[18px] md:[&_svg]:h-4 md:[&_svg]:w-4 ${text ? "gap-1 px-2.5 text-sm font-semibold group-focus-visible/btn:outline-2 group-focus-visible/btn:outline-offset-2 group-focus-visible/btn:outline-ring" : "w-[34px] md:w-8"} ${skin}`}>
        {children}
        {text}
      </span>
    </button>
  );
}

/* فقاعة فوق زرّ البدء — مقلوبة لا كهرمانية، وتوسيطها بـ inset-x-0
   لا بـ start-1/2 مع إزاحة (تنقلب في RTL). */
function StartHint() {
  const t = useTranslations("Session");
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-full z-20 flex justify-center pb-2">
      <span className="flex flex-col items-center animate-nudge">
        <span className="whitespace-nowrap rounded-pill bg-ink px-3 py-1.5 text-xs font-bold text-ground shadow-lift">
          {t("startHint")}
        </span>
        <span aria-hidden="true" className="-mt-1 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink" />
      </span>
    </span>
  );
}

type MicrophoneTrack = ReturnType<typeof useSession>["local"]["microphoneTrack"];

export function Toolbar({
  phase, canAsk, micUnavailable, studentQuestionStartedAt, microphoneTrack,
  noSpeech, reduce, chat, slides, topics, hint,
  onPrimary, onAsk, onSendStudentQuestion, onCancelStudentQuestion, onSpeech,
  onChat, onSlides, onTopics, onEnd,
}: {
  phase: Phase;
  canAsk: boolean;
  micUnavailable: boolean;
  studentQuestionStartedAt: number | null;
  microphoneTrack: MicrophoneTrack;
  noSpeech: boolean;
  reduce: boolean;
  chat: boolean;
  slides: boolean;
  topics: boolean;
  hint?: boolean;
  onPrimary: () => void;
  onAsk: () => void;
  onSendStudentQuestion: () => void;
  onCancelStudentQuestion: () => void;
  onSpeech: () => void;
  onChat: () => void;
  onSlides: () => void;
  onTopics: () => void;
  onEnd: () => void;
}) {
  const t = useTranslations("Session");
  const canStart = phase === "idle" || phase === "cut";
  const inSession = !canStart && phase !== "ending";
  const recording = studentQuestionStartedAt !== null;
  const askRef = useRef<HTMLButtonElement>(null);
  const wasRecording = useRef(false);
  useEffect(() => {
    if (wasRecording.current && !recording && !document.querySelector('[role="dialog"]')) {
      askRef.current?.focus();
    }
    wasRecording.current = recording;
  }, [recording]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2 px-3">
      <div role="status" className="text-sm text-ink-2">
        {noSpeech ? t("studentQuestionNoSpeech") : null}
      </div>
      <motion.div
        layout={reduce ? false : true}
        transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className={`pointer-events-auto relative max-w-full rounded-pill border border-line bg-panel px-1 py-0.5 shadow-lift md:px-1.5 md:py-1 ${recording ? "w-[22rem]" : "w-fit"}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {recording ? (
            <motion.div
              key="recorder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StudentQuestionRecorder
                startedAt={studentQuestionStartedAt}
                microphoneTrack={microphoneTrack}
                reduce={reduce}
                onSend={onSendStudentQuestion}
                onCancel={onCancelStudentQuestion}
                onSpeech={onSpeech}
              />
            </motion.div>
          ) : (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-1"
            >
              <div className="flex items-center justify-start gap-1">
                <button
                  ref={askRef}
                  type="button"
                  disabled={!canAsk}
                  onClick={onAsk}
                  title={micUnavailable ? t("studentQuestionMicUnavailable") : t("studentQuestionShortcut")}
                  className="group/ask flex h-11 shrink-0 items-center justify-center rounded-pill focus-visible:outline-none pointer-fine:md:h-8"
                >
                  <span
                    className={`inline-flex h-[34px] items-center justify-center gap-1 rounded-pill px-2.5 text-sm font-semibold transition-[transform,background-color] group-focus-visible/ask:outline-2 group-focus-visible/ask:outline-offset-2 group-focus-visible/ask:outline-ring group-disabled/ask:opacity-45 motion-safe:group-enabled/ask:group-active/ask:scale-95 md:h-8 [&_svg]:h-[18px] [&_svg]:w-[18px] md:[&_svg]:h-4 md:[&_svg]:w-4 ${canStart ? "border border-line text-ink-2" : "bg-pressable text-on-pressable group-enabled/ask:group-hover/ask:bg-pressable/90"}`}
                  >
                    <MicIcon />
                    {t("studentQuestionAsk")}
                  </span>
                </button>
                <IconBtn label={t("chat")} text={t("chatShort")} onClick={onChat} active={chat}>
                  <ChatIcon />
                </IconBtn>
              </div>

              <span className="group/primary relative flex shrink-0">
                {hint ? <StartHint /> : null}
                {canStart ? (
                  <button
                    type="button"
                    onClick={onPrimary}
                    aria-label={t("start")}
                    title={t("start")}
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-pressable text-on-pressable transition-transform duration-200 motion-safe:hover:scale-110 motion-safe:active:scale-95"
                  >
                    <BecanGlyph className="h-6 w-8 transition-opacity group-hover/primary:opacity-0 group-focus-within/primary:opacity-0" />
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/primary:opacity-100 group-focus-within/primary:opacity-100">
                      <PlayIcon className="h-5 w-5 md:h-4 md:w-4" />
                    </span>
                  </button>
                ) : (
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-2">
                    <BecanGlyph speaking={phase === "live"} className="h-6 w-8" />
                  </span>
                )}
              </span>

              <div className="flex items-center justify-end gap-1">
                <IconBtn label={t("slides")} onClick={onSlides} active={slides}>
                  <SlidesIcon />
                </IconBtn>
                <IconBtn label={t("lessons")} onClick={onTopics} active={topics}>
                  <ListIcon />
                </IconBtn>
                <IconBtn label={t("end")} onClick={onEnd} disabled={!inSession}>
                  <LeaveIcon />
                </IconBtn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Audio subscriptions and clock stay here so they never re-render the teaching board. */
function StudentQuestionRecorder({
  startedAt, microphoneTrack, reduce, onSend, onCancel, onSpeech,
}: {
  startedAt: number;
  microphoneTrack: MicrophoneTrack;
  reduce: boolean;
  onSend: () => void;
  onCancel: () => void;
  onSpeech: () => void;
}) {
  const t = useTranslations("Session");
  const { bars } = useAudioWaveform(reduce ? undefined : microphoneTrack ?? undefined, {
    barCount: 24, updateInterval: 50,
  });
  const volume = useTrackVolume(microphoneTrack ?? undefined);
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  const sendRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    sendRef.current?.focus();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(timer);
  }, [startedAt]);
  useEffect(() => {
    if (volume > 0.02) onSpeech();
  }, [volume, onSpeech]);

  return (
    <div className="flex h-11 items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        aria-label={t("studentQuestionCancel")}
        title={t("studentQuestionCancel")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-line text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      <span aria-hidden="true" className="flex h-8 min-w-0 flex-1 items-center justify-center gap-0.5 text-ink">
        {reduce ? (
          <span className="h-[3px] w-full rounded-pill bg-ink-2" />
        ) : bars.map((bar, index) => (
          <span
            key={index}
            className="w-[3px] shrink-0 rounded-pill bg-current"
            style={{ height: `${4 + Math.min(1, Math.max(0, bar)) * 28}px` }}
          />
        ))}
      </span>
      <span dir="ltr" className="shrink-0 text-sm tabular-nums text-ink-2">
        {`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
      </span>
      <button
        ref={sendRef}
        type="button"
        onClick={onSend}
        title={t("studentQuestionShortcut")}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-pill bg-pressable px-4 text-sm font-semibold text-on-pressable transition-colors hover:bg-pressable/90"
      >
        {t("send")}
      </button>
    </div>
  );
}

/* ————— نافذة سؤال الفهم —————
   الاختيار يُرسل نصّه إلى الوكيل، والوكيل يصحّحه بصوته — فلا تلوين
   صح/خطأ هنا. والسبورة لا تُمسح تحت النافذة. */

export function CheckpointDialog({
  checkpoint,
  open,
  onChoose,
  onDismiss,
  canAnswerByVoice,
  micUnavailable,
  onAnswerByVoice,
}: {
  checkpoint: Checkpoint | null;
  open: boolean;
  onChoose: (choice: string) => void;
  onDismiss: () => void;
  canAnswerByVoice: boolean;
  micUnavailable: boolean;
  onAnswerByVoice: () => void;
}) {
  const t = useTranslations("Session");
  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
      title={t("questionTitle")}
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm"
      contentClassName="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[80dvh] max-w-measure overflow-y-auto rounded-xl border-2 border-ink-3 bg-surface-3 p-5 shadow-lift animate-board-in md:inset-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:p-6"
    >
      <p className="text-xs font-semibold text-ink-2">{t("question")}</p>
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
        <p className="mt-4 leading-base text-ink-2">{t("answerHint")}</p>
      )}
      <button
        type="button"
        disabled={!canAnswerByVoice}
        onClick={onAnswerByVoice}
        title={micUnavailable ? t("studentQuestionMicUnavailable") : t("answerVoice")}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-ink-2 px-4 font-semibold text-ink transition-colors enabled:hover:bg-ground disabled:opacity-45"
      >
        <MicIcon className="h-4 w-4" />
        {t("answerVoice")}
      </button>
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
  const t = useTranslations("Session");
  const stayRef = useRef<HTMLButtonElement>(null);

  return (
    <SessionDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
      title={t("endTitle")}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        stayRef.current?.focus();
      }}
      overlayClassName="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm"
      contentClassName="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl border-2 border-ink-3 bg-surface-3 p-5 shadow-lift animate-board-in md:inset-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:p-6"
    >
      <p className="text-xl font-bold text-ink">{t("endTitle")}</p>
      <p className="mt-2 leading-base text-ink-2">{t("endHint")}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          ref={stayRef}
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center justify-center rounded-pill border border-ink-2 px-6 font-semibold text-ink"
        >
          {t("continue")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-12 items-center justify-center rounded-pill border border-line px-6 font-semibold text-ink"
        >
          {t("confirmEnd")}
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
