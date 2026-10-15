"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  getExplanationLanguage,
  getServerExplanationLanguage,
  resolveExplanationLanguage,
  setExplanationLanguage,
  subscribeExplanationLanguage,
  type ExplanationLanguage,
} from "./explanation-language";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import {
  RoomAudioRenderer,
  SessionProvider,
  useAgent,
  useSession,
} from "@livekit/components-react";
import {
  ConnectionState,
  createLocalAudioTrack,
  RoomEvent,
  Track,
  TokenSource,
} from "livekit-client";
import { createStudentQuestion, type StudentQuestionStatus } from "./student-question";
import { getExperience } from "@/lib/experience";
import { tokenSchema } from "@/lib/courses/schema";
import { AllowanceUsedUpError, ChapterUnavailableError, tokenErrorOutcome } from "@/lib/session/token-error";
import { sessionHref } from "@/lib/session/resolve";
import { usePinnedContent } from "./use-pinned-content";
import { readSessionAllowance } from "@/lib/allowance/client";
import type { Allowance } from "@/lib/allowance/schema";
import { sessionEndingQuota } from "@/lib/session/ending";
import { QuotaBlock } from "@/components/becan/quota";
import { SessionShell as Shell } from "./session-start";
import { RemainingMinutes } from "./remaining-minutes";
import {
  INITIAL_SESSION_STATE,
  checkpointShown,
  parseAgentMessage,
  sessionReducer,
  type Lesson,
} from "@/lib/session/session-reducer";
import { CHAT_TOPIC, UI_CONTROL_TOPIC } from "@/lib/session/ui-control";
import { Board } from "./board/board";
import {
  ChatPanel,
  EndSessionDialog,
  LanguageChoice,
  CheckpointDialog,
  RotateNotice,
  SlidesMessage,
  Toolbar,
  TopBar,
  TopicsRail,
  TopicsSheet,
  TopicsTrack,
  type Phase,
  type TopicState,
} from "./parts";
import { useIsMobile } from "./use-is-mobile";
import { useReducedMotion } from "./use-reduced-motion";
import { PacketRecorderButtons, usePacketRecorder } from "./use-packet-recorder";

/* شاشة الجلسة — تخطيط becan-design (عمود الدروس · السبورة · الشرائح)
   يقوده وكيل LiveKit الحقيقي من old-sanad.

   الوكيل يتحكّم بالصفحة برسائل `ui-control` (السبورة، الشريحة، الدرس
   والموضوع، سؤال الفهم، نهاية الحدّ)، والطالب يكلّمه بسؤال طالب أو بنصّ
   على `lk.chat`. الحالة كلها في `sessionReducer`، والمرحلة المعروضة
   اشتقاق نقيّ من اتصال الغرفة وحالة الوكيل. */

const SlidesPane = dynamic(() => import("./slides-pdf").then((m) => m.SlidesPane), {
  ssr: false,
  loading: LoadingSlides,
});

function LoadingSlides() {
  const t = useTranslations("Session");
  return <SlidesMessage text={t("loadingSlides")} />;
}

type SessionViewProps = {
  courseName: string;
  courseSlug: string;
  chapterNo: number;
  chapterTitle: string;
  minutes: number;
  chapterId: string;
  /* مسار محتوى الفصل في الكتالوج — يُعرض قبل البدء؛ بعد وصول الرمز يُستبدل بالمسار المثبَّت فيه. */
  contentPath: string;
  lessons: Lesson[];
  minutesRemaining: number | null;
};

type ScreenProps = Omit<SessionViewProps, "contentPath"> & { pdfUrl: string };

export function SessionView(props: SessionViewProps) {
  const { contentPath, lessons: catalogLessons, ...rest } = props;
  const { chapterId } = rest;
  const { onPinned, pdfUrl, lessons } = usePinnedContent(contentPath, catalogLessons);
  const locale = useLocale();
  const stored = useSyncExternalStore(
    subscribeExplanationLanguage,
    getExplanationLanguage,
    getServerExplanationLanguage,
  );
  /* الاختيار يبقى حتى إن حُجب التخزين؛ وبعد البدء لا يغيّره لسان آخر. */
  const [picked, setPicked] = useState<ExplanationLanguage | null>(null);
  const [locked, setLocked] = useState<ExplanationLanguage | null>(null);
  const language = locked ?? picked ?? resolveExplanationLanguage(stored, locale);
  const chooseLanguage = (value: ExplanationLanguage) => {
    if (locked) return;
    setPicked(value);
    setExplanationLanguage(value);
  };

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const res = await fetch("/api/v1/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, language, experience: getExperience() }),
          cache: "no-store",
        });
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null);
          const outcome = tokenErrorOutcome(res.status, body);
          if (outcome === "used-up") throw new AllowanceUsedUpError();
          if (outcome === "content-unavailable" || outcome === "not-published") throw new ChapterUnavailableError(outcome);
          throw new Error(`Token request failed (${res.status})`);
        }
        const { serverUrl, token, contentPath: pinnedPath } = tokenSchema.parse(await res.json());
        /* الحصة مثبَّتة على هذه النسخة من المحتوى؛ منها نقرأ الدروس والشرائح من الآن. */
        onPinned(pinnedPath);
        return { serverUrl, participantToken: token };
      }),
    [chapterId, language, onPinned],
  );

  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <SessionScreen
        {...rest}
        lessons={lessons}
        pdfUrl={pdfUrl}
        session={session}
        language={language}
        onLanguage={chooseLanguage}
        onLockLanguage={() => setLocked(language)}
      />
    </SessionProvider>
  );
}

function SessionScreen({
  session,
  language,
  onLanguage,
  onLockLanguage,
  courseName,
  courseSlug,
  chapterId,
  chapterNo,
  chapterTitle,
  minutes,
  pdfUrl,
  lessons,
  minutesRemaining,
}: ScreenProps & {
  session: ReturnType<typeof useSession>;
  language: ExplanationLanguage;
  onLanguage: (l: ExplanationLanguage) => void;
  onLockLanguage: () => void;
}) {
  const t = useTranslations("Session");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const router = useRouter();
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const agent = useAgent(session);
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  const [endingAllowance, setEndingAllowance] = useState<Allowance | null>(null);
  const allowanceRead = useRef<Promise<Allowance | null> | null>(null);
  const allowanceRequest = useRef<AbortController | null>(null);
  const recorder = usePacketRecorder();
  const { record } = recorder;

  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  /* رفض الخادم فتح الحصة لسبب في الفصل نفسه — لا تفيد إعادة المحاولة. */
  const [unavailable, setUnavailable] = useState<ChapterUnavailableError["reason"] | null>(null);
  const [userEnding, setUserEnding] = useState(false);
  const [micUnavailable, setMicUnavailable] = useState(false);
  /* useSession().local.microphoneTrack يكون null ما دام المايك مكتومًا، فلا يصلح
     دليلًا على النشر. نتتبّع نجاح publishTrack بأنفسنا. */
  const [micPublished, setMicPublished] = useState(false);
  const [studentQuestionStatus, setStudentQuestionStatus] = useState<StudentQuestionStatus>({
    busy: false,
    startedAt: null,
  });
  const [noSpeech, setNoSpeech] = useState(false);
  const voiceAnswerId = useRef<string | null>(null);
  const studentQuestion = useMemo(
    () => createStudentQuestion(
      session.room.localParticipant,
      setStudentQuestionStatus,
      () => setNoSpeech(true),
      // eslint-disable-next-line react-hooks/refs -- لا يُستدعى هذا النداء إلا بعد إغلاق سؤال الطالب.
      (outcome) => {
        const id = voiceAnswerId.current;
        voiceAnswerId.current = null;
        if (outcome === "cancelled" && id !== null) {
          dispatch({ action: "checkpoint_unhandled", id });
        }
      },
    ),
    [session.room],
  );

  useEffect(() => {
    if (!noSpeech) return;
    const timer = setTimeout(() => setNoSpeech(false), 3_000);
    return () => clearTimeout(timer);
  }, [noSpeech]);

  useEffect(() => {
    if (!session.isConnected || state.ending || userEnding || agent.state === "failed") {
      void studentQuestion.close("cancel_turn");
    } else {
      studentQuestion.observeAgentState(agent.state);
    }
  }, [
    agent.state, session.isConnected, state.ending, userEnding,
    studentQuestion, studentQuestionStatus.startedAt,
  ]);
  const [chat, setChat] = useState(false);
  const [showTopics, setShowTopics] = useState(true);
  const [showSlides, setShowSlides] = useState(true);
  /* null = تلقائي: القائمة تُفتح وحدها حين ينتظر الوكيل اختيار درس */
  const [topicsPref, setTopicsPref] = useState<boolean | null>(null);
  /* نافذة تأكيد الإنهاء — من زرّ الشريط ومن × الشريط العلوي */
  const [confirmEnd, setConfirmEnd] = useState(false);

  /* درس طُلب قبل أن يصير الوكيل جاهزًا للسمع — يُرسل عند أول استماع */
  const pendingLesson = useRef<string | null>(null);
  const finishing = useRef(false);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  const courseHref = `/c/${courseSlug}`;

  /* ————— رسائل الوكيل ————— */
  useEffect(() => {
    const room = session.room;
    const onData = (
      payload: Uint8Array,
      _participant?: unknown,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== UI_CONTROL_TOPIC) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        return;
      }
      record(parsed, room.name);
      const message = parseAgentMessage(parsed);
      if (message?.action === "allowance_reached" && !allowanceRead.current) {
        const request = new AbortController();
        allowanceRequest.current = request;
        allowanceRead.current = readSessionAllowance(
          AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]),
        ).then((allowance) => {
          if (!request.signal.aborted) setEndingAllowance(allowance);
          return allowance;
        });
      }
      if (message) dispatch(message);
    };
    const onDisconnected = () => dispatch({ action: "board_reset" });
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      allowanceRequest.current?.abort();
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [session.room, record]);

  /* مغادرة الصفحة بلا خروج صريح لا تترك الغرفة مفتوحة */
  useEffect(
    () => () => {
      void studentQuestion.close("cancel_turn")
        .then(() => sessionRef.current.end())
        .catch(() => undefined);
    },
    [studentQuestion],
  );

  const sendText = useCallback(
    async (text: string) => {
      if (!session.isConnected) return false;
      try {
        await session.room.localParticipant.sendText(text, { topic: CHAT_TOPIC });
        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        return false;
      }
    },
    [session],
  );

  const start = async (lessonSlug: string | null = null) => {
    if (starting) return;
    onLockLanguage();
    allowanceRequest.current?.abort();
    allowanceRead.current = null;
    setEndingAllowance(null);
    dispatch({ action: "session_reset" });
    pendingLesson.current = lessonSlug;
    setFailed(false);
    setUnavailable(null);
    setStarted(true);
    setStarting(true);
    try {
      setMicUnavailable(false);
      setMicPublished(false);
      setNoSpeech(false);
      // enabled:false skips capture in useSession. Acquire and mute BEFORE publishing.
      const microphone = await createLocalAudioTrack().catch((error) => {
        console.error("Microphone unavailable:", error);
        setMicUnavailable(true);
        return null;
      });
      try {
        if (microphone) await microphone.mute();
        // publishTrack waits for the signal connection; publish before start waits for the agent.
        await Promise.all([
          session.start({ tracks: { microphone: { enabled: false } } }),
          microphone
            ? session.room.localParticipant.publishTrack(microphone, {
                source: Track.Source.Microphone,
                stopMicTrackOnMute: false,
              }).then(() => setMicPublished(true), (error) => {
                microphone.stop();
                setMicUnavailable(true);
                console.error("Failed to publish muted microphone:", error);
              })
            : Promise.resolve(),
        ]);
      } catch (error) {
        microphone?.stop();
        throw error;
      }
    } catch (error) {
      if (error instanceof AllowanceUsedUpError) {
        /* رُفض البدء بعد قراءة الصفحة؛ نعيد قراءة الاستخدام وموعد التجدد من الخادم. */
        setStarted(false);
        router.refresh();
        return;
      }
      if (error instanceof ChapterUnavailableError) setUnavailable(error.reason);
      else console.error("Failed to start session:", error);
      setFailed(true);
    } finally {
      setStarting(false);
    }
  };

  /* الخروج إلى ملخّص الجلسة — بطلب الطالب أو ببلوغ الحدّ */
  const finish = useCallback(
    async (reason: "user" | "limit") => {
      if (finishing.current) return;
      finishing.current = true;
      const room = sessionRef.current.room.name;
      await studentQuestion.close("cancel_turn");
      await sessionRef.current.end().catch(() => undefined);
      /* القراءة بدأت مع الإشارة؛ لا مؤقّت جديد ولا مسار إنهاء ثانٍ. */
      if (reason === "limit") await allowanceRead.current;
      const q = new URLSearchParams();
      if (room) q.set("room", room);
      if (reason === "limit") q.set("limit", "1");
      const qs = q.toString();
      router.push(`${sessionHref(courseSlug, chapterId, true)}${qs ? `?${qs}` : ""}`);
    },
    [router, courseSlug, chapterId, studentQuestion],
  );

  useEffect(() => {
    if (state.ending) void finish("limit");
  }, [state.ending, finish]);

  const agentListening = agent.state === "listening";

  useEffect(() => {
    if (!agentListening || !pendingLesson.current) return;
    const slug = pendingLesson.current;
    pendingLesson.current = null;
    void sendText(`please explain ${slug}`);
  }, [agentListening, sendText]);

  /* ————— المرحلة المعروضة — اشتقاق نقيّ ————— */
  const cs = session.connectionState;
  const ending = state.ending || userEnding;
  const endingQuota = sessionEndingQuota(state, endingAllowance);
  let phase: Phase;
  if (ending) phase = "ending";
  else if (
    failed ||
    agent.state === "failed" ||
    (started && !starting && cs === ConnectionState.Disconnected)
  )
    phase = "cut";
  else if (!started) phase = "idle";
  else if (starting || cs !== ConnectionState.Connected) phase = "connecting";
  else if (agent.state === "speaking") phase = "live";
  else if (agent.state === "thinking") phase = "thinking";
  else if (agentListening) phase = checkpointShown(state, agent.state, studentQuestionStatus) ? "question" : "listening";
  else phase = "connecting";

  /* ————— الدروس ————— */
  const titles = lessons.map((l) => l.name);
  const current = lessons.findIndex((l) => l.slug === state.lesson?.slug);
  const stateOf = (i: number): TopicState =>
    i === current ? "now" : state.completedLessons.includes(lessons[i]?.slug) ? "done" : "none";

  const autoTopics = phase === "listening" && !state.lesson && lessons.length > 0;
  const topicsOpen = topicsPref ?? autoTopics;

  const pickLesson = (i: number) => {
    const slug = lessons[i]?.slug;
    if (!slug) return;
    setTopicsPref(false);
    if (phase === "idle" || phase === "cut") {
      void start(slug);
    } else if (agentListening || agent.state === "speaking" || agent.state === "thinking") {
      void sendText(`please explain ${slug}`);
    } else {
      pendingLesson.current = slug;
    }
  };

  const onTopics = () =>
    isMobile ? setTopicsPref(!topicsOpen) : setShowTopics((v) => !v);

  const inRoom = session.isConnected;
  const canAsk = inRoom && agent.isConnected && !ending && !micUnavailable &&
    micPublished && !studentQuestionStatus.busy &&
    studentQuestionStatus.startedAt === null;
  const startStudentQuestion = useCallback(() => {
    if (!canAsk || finishing.current) return;
    setChat(false);
    setTopicsPref(false);
    setNoSpeech(false);
    void studentQuestion.start(agent.internal.agentParticipant!.identity, agent.state);
  }, [canAsk, studentQuestion, agent.internal.agentParticipant, agent.state]);

  useEffect(() => {
    if (isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ||
        (target instanceof HTMLElement && (target.closest("input, textarea, select") || target.isContentEditable)) ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      if (event.code === "Space") {
        if (studentQuestionStatus.startedAt !== null) {
          event.preventDefault();
          void studentQuestion.close("end_turn");
        } else if (canAsk) {
          event.preventDefault();
          startStudentQuestion();
        }
      } else if (event.key === "Escape" &&
        (studentQuestionStatus.startedAt !== null || studentQuestionStatus.busy)) {
        event.preventDefault();
        void studentQuestion.close("cancel_turn");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isMobile, canAsk, startStudentQuestion, studentQuestion,
    studentQuestionStatus.startedAt, studentQuestionStatus.busy,
  ]);

  const endNow = () => {
    setConfirmEnd(false);
    setUserEnding(true);
    void finish("user");
  };

  /* قبل البدء أو بعد الانقطاع لا شرح يضيع — خروج مباشر إلى المقرر.
     أثناء الجلسة يمرّ الخروج بالتأكيد. */
  const onExit = () => {
    if (phase === "idle" || phase === "cut") {
      sessionRef.current.end().catch(() => undefined);
      router.push(courseHref);
      return;
    }
    if (phase === "ending") return;
    setConfirmEnd(true);
  };

  const detail =
    state.topic && state.topic.index > 0
      ? state.lesson?.totalTopics
        ? t("topicOf", { number: number(state.topic.index), total: number(state.lesson.totalTopics) })
        : t("topic", { number: number(state.topic.index) })
      : undefined;

  /* ————— انقطاع ————— */
  if (phase === "cut" && unavailable) {
    return (
      <Shell reduce={reduce}>
        <TopBar phase="idle" courseName={courseName} chapterNo={chapterNo} onExit={onExit} />
        <div className="mx-auto flex w-full max-w-measure flex-1 flex-col justify-center px-5 py-10">
          <h1 className="text-3xl font-bold text-ink">{t(`unavailable.${unavailable}.title`)}</h1>
          <p className="mt-4 leading-base text-ink-2">{t(`unavailable.${unavailable}.body`)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex h-12 items-center justify-center rounded-pill bg-pressable px-6 font-semibold text-on-pressable"
            >
              {t("backCourse")}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "cut") {
    const lastLesson = lessons.find((l) => l.slug === state.lesson?.slug);
    return (
      <Shell reduce={reduce}>
        <TopBar phase="cut" courseName={courseName} chapterNo={chapterNo} onExit={onExit} />
        <div className="mx-auto flex w-full max-w-measure flex-1 flex-col justify-center px-5 py-10">
          <h1 className="text-3xl font-bold text-ink">{t("connectionCut")}</h1>
          <p className="mt-4 leading-base text-ink-2">
            {lastLesson ? (
              t.rich(detail ? "lastPositionDetail" : "lastPosition", {
                lessonName: lastLesson.name,
                ...(detail ? { detail } : {}),
                lesson: (chunks) => <bdi className="font-semibold text-ink">{chunks}</bdi>,
              })
            ) : (
              t("connectionFailed")
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void start(state.lesson?.slug ?? null)}
              className="inline-flex h-12 items-center justify-center rounded-pill bg-pressable px-6 font-semibold text-on-pressable"
            >
              {lastLesson ? t("resume") : t("retry")}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex h-12 items-center justify-center rounded-pill border border-line px-6 font-semibold text-ink"
            >
              {t("backCourse")}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const intro = (
    <>
      <p className="text-sm text-ink-2">{t("chapter", { number: number(chapterNo) })}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">{chapterTitle}</h1>
      {phase === "idle" ? (
        <>
          {/* التلدة رمز لاتيني ملاصق لرقم — تُلَفّ بـdir="ltr" */}
          <p className="mt-4 text-ink-2">
            {t.rich(lessons.length > 0 ? "introStats" : "duration", {
              count: minutes,
              countLabel: number(minutes),
              lessons: lessons.length,
              lessonsLabel: number(lessons.length),
              estimate: (chunks) => <span dir="ltr">{chunks}</span>,
            })}
          </p>
          {minutesRemaining !== null ? <RemainingMinutes count={minutesRemaining} /> : null}
          <LanguageChoice value={language} onChange={onLanguage} />
          {lessons.length > 0 ? (
            <p className="mt-6 text-sm text-ink-2">{t("chooseLesson")}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-ink-2">
          {phase === "connecting" ? t("preparingExplanation") : t("boardHint")}
        </p>
      )}
    </>
  );

  return (
    <Shell reduce={reduce}>
      <TopBar
        phase={phase}
        courseName={courseName}
        chapterNo={chapterNo}
        detail={detail}
        onExit={onExit}
      />

      {/* مسار الدروس على الجوال — بديل العمود الجانبي */}
      <TopicsTrack
        topics={titles}
        stateOf={stateOf}
        current={current}
        onPick={pickLesson}
        open={topicsOpen}
        onToggle={() => setTopicsPref(!topicsOpen)}
      />

      {phase === "idle" ? <RotateNotice /> : null}

      <div className="relative flex flex-1 flex-col gap-2 overflow-hidden p-2 md:flex-row md:p-3">
        {showTopics ? (
          <TopicsRail
            topics={titles}
            stateOf={stateOf}
            current={current}
            onPick={pickLesson}
            open={!isMobile && topicsOpen}
            onToggle={() => setTopicsPref(!topicsOpen)}
          />
        ) : null}

        {/* السبورة — الثلثان، والشريط يسبح فوقها */}
        <main className="relative flex min-w-0 flex-[2] flex-col">
          {endingQuota ? (
            <div role="status" className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto p-5 md:p-8">
              <QuotaBlock {...endingQuota} surface="session" />
            </div>
          ) : <Board
            board={state.board}
            speaking={phase === "live"}
            intro={intro}
            reduce={reduce}
            language={language}
          />}

          {!endingQuota && chat && inRoom ? (
            <ChatPanel
              onSend={sendText}
              onClose={() => setChat(false)}
            />
          ) : null}

          {!endingQuota ? <Toolbar
            phase={phase}
            hint={phase === "idle"}
            canAsk={canAsk}
            micUnavailable={micUnavailable}
            studentQuestionStartedAt={studentQuestionStatus.startedAt}
            microphoneTrack={session.local.microphoneTrack}
            noSpeech={noSpeech}
            reduce={reduce}
            onAsk={startStudentQuestion}
            onSendStudentQuestion={() => void studentQuestion.close("end_turn")}
            onCancelStudentQuestion={() => void studentQuestion.close("cancel_turn")}
            onSpeech={studentQuestion.speechDetected}
            chat={chat && inRoom}
            slides={showSlides}
            topics={isMobile ? topicsOpen : showTopics}
            onPrimary={() => void start(null)}
            onChat={() => setChat((c) => !c)}
            onSlides={() => setShowSlides((v) => !v)}
            onTopics={onTopics}
            onEnd={() => setConfirmEnd(true)}
          /> : null}
        </main>

        {/* الثلث — الشرائح تملأ العمود كاملًا */}
        {showSlides ? (
          <aside className="flex min-h-0 w-full flex-1 flex-col md:w-[19rem] md:flex-none md:shrink-0">
            <SlidesPane url={pdfUrl} agentPage={state.page} />
          </aside>
        ) : null}
      </div>

      <TopicsSheet
        open={isMobile && topicsOpen}
        onClose={() => setTopicsPref(false)}
        topics={titles}
        stateOf={stateOf}
        current={current}
        onPick={pickLesson}
      />

      <CheckpointDialog
        checkpoint={state.checkpoint}
        open={phase === "question"}
        onChoose={(choice) => {
          if (!state.checkpoint) return;
          dispatch({ action: "checkpoint_handled", id: state.checkpoint.id });
          void sendText(choice);
        }}
        canAnswerByVoice={canAsk}
        micUnavailable={micUnavailable}
        onAnswerByVoice={() => {
          if (!state.checkpoint || !canAsk || finishing.current) return;
          const id = state.checkpoint.id;
          dispatch({ action: "checkpoint_handled", id });
          voiceAnswerId.current = id;
          startStudentQuestion();
        }}
        onDismiss={() => {
          if (state.checkpoint) dispatch({ action: "checkpoint_handled", id: state.checkpoint.id });
        }}
      />

      <EndSessionDialog
        open={confirmEnd && phase !== "ending"}
        onConfirm={endNow}
        onCancel={() => setConfirmEnd(false)}
      />

      <RoomAudioRenderer />
      <PacketRecorderButtons recorder={recorder} />
    </Shell>
  );
}
