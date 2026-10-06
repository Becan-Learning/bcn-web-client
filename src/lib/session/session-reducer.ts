import {
  INITIAL_BOARD_STATE,
  parseBoardControlEvent,
  teachingBoardReducer,
  type BoardAction,
  type BoardState,
} from "./teaching-board";
import { parseUIControlEvent, type UIControlEvent } from "./ui-control";

/* حالة الجلسة كلها في مخفّض واحد — كل ما يكتبه الوكيل يمرّ من هنا.
   الأفعال تصل من مستمع قناة البيانات أو من ضغطة الطالب، لا من
   تأثيرات تضبط الحالة (قاعدة react-hooks/set-state-in-effect). */

/** درس من `lessons_list.json` في تخزين الفصل */
export type Lesson = { name: string; brief: string; slug: string };

export type Checkpoint = { id: string; question: string; choices: string[] };

export type SessionState = {
  board: BoardState;
  /** آخر شريحة طلبها الوكيل (من 1)، أو null قبل أن يطلب */
  page: number | null;
  lesson: { slug: string; totalTopics: number } | null;
  topic: { name: string; index: number } | null;
  /** دروس انتقل الوكيل منها إلى غيرها */
  completedLessons: string[];
  checkpoint: Checkpoint | null;
  handledCheckpointId: string | null;
  /** الوكيل أعلن بلوغ الحدّ الزمني */
  ending: boolean;
  /** سببٌ تشخيصيّ من الوكيل، لا يُعرض لأنه لا يتبع لغة الطالب */
  endingMessage: string | null;
};

export const INITIAL_SESSION_STATE: SessionState = {
  board: INITIAL_BOARD_STATE,
  page: null,
  lesson: null,
  topic: null,
  completedLessons: [],
  checkpoint: null,
  handledCheckpointId: null,
  ending: false,
  endingMessage: null,
};

export type AgentMessage = BoardAction | UIControlEvent;

export type SessionAction =
  | AgentMessage
  | { action: "checkpoint_handled"; id: string }
  | { action: "checkpoint_unhandled"; id: string }
  | { action: "session_reset" };

export function parseAgentMessage(value: unknown): AgentMessage | null {
  return parseBoardControlEvent(value) ?? parseUIControlEvent(value);
}

/** سؤال مفتوح لم يتعامل معه الطالب، والوكيل جاهز للسمع */
export function checkpointShown(
  state: SessionState,
  agentState: string,
  studentQuestionStatus: { busy: boolean; startedAt: number | null },
): boolean {
  return state.checkpoint !== null &&
    agentState === "listening" &&
    studentQuestionStatus.busy === false &&
    studentQuestionStatus.startedAt === null &&
    state.checkpoint.id !== state.handledCheckpointId;
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.action) {
    /* إعادة البدء بعد انقطاع تبقي ما أنجزه الطالب من دروس */
    case "session_reset":
      return { ...INITIAL_SESSION_STATE, completedLessons: state.completedLessons };

    case "checkpoint_handled":
      return { ...state, handledCheckpointId: action.id };

    case "checkpoint_unhandled":
      return state.handledCheckpointId === action.id
        ? { ...state, handledCheckpointId: null }
        : state;

    case "set_checkpoint":
      return { ...state, checkpoint: action.checkpoint };

    case "scroll":
      return state.page === action.page ? state : { ...state, page: action.page };

    case "set_lesson": {
      const next = { slug: action.lesson, totalTopics: action.totalTopics };
      const prev = state.lesson?.slug;
      if (prev === action.lesson) return { ...state, lesson: next };
      return {
        ...state,
        lesson: next,
        topic: null,
        completedLessons:
          prev && !state.completedLessons.includes(prev)
            ? [...state.completedLessons, prev]
            : state.completedLessons,
      };
    }

    case "set_topic":
      return {
        ...state,
        topic: action.topic ? { name: action.topic, index: action.index } : state.topic,
      };

    case "topic_done":
      return { ...state, topic: null };

    case "session_ending":
      return { ...state, ending: true, endingMessage: action.message };

    default: {
      const board = teachingBoardReducer(state.board, action);
      return board === state.board ? state : { ...state, board };
    }
  }
}
