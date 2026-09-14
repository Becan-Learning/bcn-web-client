"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  RoomAudioRenderer,
  SessionProvider,
  useAgent,
  useSession,
  useTrackToggle,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track, TokenSource } from "livekit-client";
import { getExperience } from "@/lib/experience";
import { getAnonId } from "@/lib/session/anon-id";
import type { ChapterContent } from "@/lib/session/content";
import {
  INITIAL_SESSION_STATE,
  parseAgentMessage,
  sessionReducer,
  type Lesson,
} from "@/lib/session/session-reducer";
import { CHAT_TOPIC, UI_CONTROL_TOPIC } from "@/lib/session/ui-control";
import {
  Board,
  ChatPanel,
  EndSessionDialog,
  LanguageChoice,
  QuestionDialog,
  RotateNotice,
  SlidesMessage,
  Toolbar,
  TopBar,
  TopicsRail,
  TopicsSheet,
  TopicsTrack,
  lessonsLabel,
  type Phase,
  type SessionLanguage,
  type TopicState,
} from "./parts";
import { useIsMobile } from "./use-is-mobile";

/* شاشة الجلسة — تخطيط becan-design (عمود الدروس · السبورة · الشرائح)
   يقوده وكيل LiveKit الحقيقي من old-sanad.

   الوكيل يتحكّم بالصفحة برسائل `ui-control` (السبورة، الشريحة، الدرس
   والموضوع، سؤال الفهم، نهاية الحدّ)، والطالب يكلّمه بالمايك أو بنصّ
   على `lk.chat`. الحالة كلها في `sessionReducer`، والمرحلة المعروضة
   اشتقاق نقيّ من اتصال الغرفة وحالة الوكيل. */

const SlidesPane = dynamic(() => import("./slides-pdf").then((m) => m.SlidesPane), {
  ssr: false,
  loading: () => <SlidesMessage text="تجهيز الشرائح…" />,
});

/* اسم مؤقّت حتى يُركَّب الحساب (Clerk) */
const USER_NAME = "طالب بيكان";

type SessionViewProps = {
  courseName: string;
  courseSlug: string;
  chapterNo: number;
  chapterTitle: string;
  minutes: number;
  content: ChapterContent;
  pdfUrl: string;
  lessons: Lesson[];
};

export function SessionView(props: SessionViewProps) {
  const { courseId, chapterId } = props.content;
  const [language, setLanguage] = useState<SessionLanguage>("Arabic");

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const params = new URLSearchParams({
          course_id: courseId,
          chapter_id: chapterId,
          language,
          user_name: USER_NAME,
          user_id: getAnonId(),
          experience: getExperience(),
        });
        const res = await fetch(`/api/get-lk-token?${params}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Token request failed (${res.status})`);

        const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!serverUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");

        return { serverUrl, participantToken: await res.text() };
      }),
    [courseId, chapterId, language],
  );

  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <SessionScreen
        {...props}
        session={session}
        language={language}
        onLanguage={setLanguage}
      />
    </SessionProvider>
  );
}

function SessionScreen({
  session,
  language,
  onLanguage,
  courseName,
  courseSlug,
  chapterNo,
  chapterTitle,
  minutes,
  pdfUrl,
  lessons,
}: SessionViewProps & {
  session: ReturnType<typeof useSession>;
  language: SessionLanguage;
  onLanguage: (l: SessionLanguage) => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const agent = useAgent(session);
  const micTrack = useTrackToggle({ source: Track.Source.Microphone });
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);

  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [userEnding, setUserEnding] = useState(false);
  const [micPref, setMicPref] = useState(true);
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
      const message = parseAgentMessage(parsed);
      if (message) dispatch(message);
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [session.room]);

  /* مغادرة الصفحة بلا خروج صريح لا تترك الغرفة مفتوحة */
  useEffect(
    () => () => {
      sessionRef.current.end().catch(() => undefined);
    },
    [],
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
    dispatch({ action: "session_reset" });
    pendingLesson.current = lessonSlug;
    setFailed(false);
    setStarted(true);
    setStarting(true);
    try {
      await session.start({ tracks: { microphone: { enabled: micPref } } });
    } catch (error) {
      console.error("Failed to start session:", error);
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
      await sessionRef.current.end().catch(() => undefined);
      const q = new URLSearchParams();
      if (room) q.set("room", room);
      if (reason === "limit") q.set("limit", "1");
      const qs = q.toString();
      router.push(`/session/${courseSlug}/${chapterNo}/done${qs ? `?${qs}` : ""}`);
    },
    [router, courseSlug, chapterNo],
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
  else if (agentListening) phase = state.checkpoint ? "question" : "listening";
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
  const micOn = inRoom ? micTrack.enabled : micPref;
  const onMic = () => {
    if (inRoom) void micTrack.toggle();
    else setMicPref((v) => !v);
  };

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
        ? `الموضوع ${state.topic.index} من ${state.lesson.totalTopics}`
        : `الموضوع ${state.topic.index}`
      : undefined;

  /* ————— انقطاع ————— */
  if (phase === "cut") {
    const lastLesson = lessons.find((l) => l.slug === state.lesson?.slug);
    return (
      <Shell reduce={reduce}>
        <TopBar phase="cut" courseName={courseName} chapterNo={chapterNo} onExit={onExit} />
        <div className="mx-auto flex w-full max-w-measure flex-1 flex-col justify-center px-5 py-10">
          <h1 className="text-3xl font-bold text-ink">انقطع الاتصال</h1>
          <p className="mt-4 leading-base text-ink-2">
            {lastLesson ? (
              <>
                كنت في:{" "}
                <span dir="auto" className="font-semibold text-ink">
                  {lastLesson.name}
                </span>
                {detail ? ` · ${detail}` : ""}
              </>
            ) : (
              "ما قدرنا نوصل للشرح. تأكّد من اتصالك وجرّب مرة ثانية."
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void start(state.lesson?.slug ?? null)}
              className="inline-flex h-12 items-center justify-center rounded-pill bg-pressable px-6 font-semibold text-on-pressable"
            >
              {lastLesson ? "كمّل من وين وقفت" : "جرّب مرة ثانية"}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex h-12 items-center justify-center rounded-pill border border-line px-6 font-semibold text-ink"
            >
              ارجع للمقرر
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const intro = (
    <>
      <p className="text-sm text-ink-2">الفصل {chapterNo}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">{chapterTitle}</h1>
      {phase === "idle" ? (
        <>
          {/* التلدة رمز لاتيني ملاصق لرقم — تُلَفّ بـdir="ltr" */}
          <p className="mt-4 text-ink-2">
            {lessons.length > 0 ? `${lessonsLabel(lessons.length)} · ` : ""}
            <span dir="ltr">~{minutes}</span> دقيقة
          </p>
          <LanguageChoice value={language} onChange={onLanguage} />
          {lessons.length > 0 ? (
            <p className="mt-6 text-sm text-ink-2">أو اختر درسًا من المسار لتبدأ منه.</p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-ink-2">
          {phase === "connecting" ? "يجهّز الشرح…" : "السبورة تُكتب مع الشرح."}
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
          <Board board={state.board} speaking={phase === "live"} intro={intro} reduce={reduce} />

          {chat && inRoom ? (
            <ChatPanel
              listening={phase === "listening"}
              onSend={sendText}
              onClose={() => setChat(false)}
            />
          ) : null}

          <Toolbar
            phase={phase}
            hint={phase === "idle"}
            mic={micOn}
            chat={chat && inRoom}
            slides={showSlides}
            topics={isMobile ? topicsOpen : showTopics}
            onPrimary={() => void start(null)}
            onMic={onMic}
            onChat={() => setChat((c) => !c)}
            onSlides={() => setShowSlides((v) => !v)}
            onTopics={onTopics}
            onEnd={() => setConfirmEnd(true)}
          />
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

      <QuestionDialog
        checkpoint={state.checkpoint}
        open={phase === "question"}
        onChoose={(choice) => {
          dispatch({ action: "checkpoint_clear" });
          void sendText(choice);
        }}
        onDismiss={() => dispatch({ action: "checkpoint_clear" })}
      />

      <EndSessionDialog
        open={confirmEnd && phase !== "ending"}
        onConfirm={endNow}
        onCancel={() => setConfirmEnd(false)}
      />

      <RoomAudioRenderer />
    </Shell>
  );
}

/* الغلاف — سطح الجلسة الداكن، والدخول تلاشٍ 250ms */
function Shell({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  return (
    <motion.div
      data-theme="dark"
      data-surface="session"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-dvh flex-col bg-ground text-ink"
    >
      {children}
    </motion.div>
  );
}
