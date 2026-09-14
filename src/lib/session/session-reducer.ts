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

export type Checkpoint = { question: string; choices: string[] };

export type SessionState = {
  board: BoardState;
  /** آخر شريحة طلبها الوكيل (من 1)، أو null قبل أن يطلب */
  page: number | null;
  lesson: { slug: string; totalTopics: number } | null;
  topic: { name: string; index: number } | null;
  /** دروس انتقل الوكيل منها إلى غيرها */
  completedLessons: string[];
  checkpoint: Checkpoint | null;
  /** الوكيل أعلن بلوغ الحدّ الزمني */
  ending: boolean;
};

export const INITIAL_SESSION_STATE: SessionState = {
  board: INITIAL_BOARD_STATE,
  page: null,
  lesson: null,
  topic: null,
  completedLessons: [],
  checkpoint: null,
  ending: false,
};

export type AgentMessage = BoardAction | UIControlEvent;

export type SessionAction =
  | AgentMessage
  | { action: "checkpoint_clear" }
  | { action: "session_reset" };

export function parseAgentMessage(value: unknown): AgentMessage | null {
  return parseBoardControlEvent(value) ?? parseUIControlEvent(value);
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.action) {
    /* إعادة البدء بعد انقطاع تبقي ما أنجزه الطالب من دروس */
    case "session_reset":
      return { ...INITIAL_SESSION_STATE, completedLessons: state.completedLessons };

    case "checkpoint_clear":
      return state.checkpoint ? { ...state, checkpoint: null } : state;

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
        /* سؤال الموضوع الجديد يحلّ محلّ القديم، وغيابه يمسحه */
        checkpoint: action.question
          ? { question: action.question, choices: action.choices }
          : null,
      };

    case "topic_done":
      return { ...state, topic: null };

    case "session_ending":
      return state.ending ? state : { ...state, ending: true };

    default: {
      const board = teachingBoardReducer(state.board, action);
      return board === state.board ? state : { ...state, board };
    }
  }
}
