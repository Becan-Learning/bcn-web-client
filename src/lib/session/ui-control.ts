/* رسائل الوكيل إلى الصفحة — عقدٌ مع وكيل LiveKit الخارجي.

   الوكيل ينشر JSON على موضوع `ui-control`، والطالب يكتب له على
   `lk.chat`. أسماء الأفعال والحقول هنا يقرؤها الوكيل ويكتبها كما هي،
   فلا تُعاد تسميتها من طرف واحد. رسائل `board_*` في teaching-board.ts. */

export const UI_CONTROL_TOPIC = "ui-control";
export const CHAT_TOPIC = "lk.chat";

export type UIControlEvent =
  /** انتقل إلى شريحة — رقمها يبدأ من 1 */
  | { action: "scroll"; page: number }
  /** بدأ درسًا من قائمة الفصل، ومعه عدد مواضيعه */
  | { action: "set_lesson"; lesson: string; totalTopics: number }
  /** بدأ موضوعًا، ومعه سؤال التحقّق إن وُجد */
  | {
      action: "set_topic";
      topic: string | null;
      index: number;
      question: string;
      choices: string[];
    }
  | { action: "topic_done" }
  /** بلغت الجلسة حدّها الزمني */
  | { action: "session_ending" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const toCount = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

export function parseUIControlEvent(value: unknown): UIControlEvent | null {
  if (!isRecord(value) || typeof value.action !== "string") return null;

  switch (value.action) {
    case "scroll": {
      const page = Number(value.page);
      return Number.isInteger(page) && page >= 1 ? { action: "scroll", page } : null;
    }
    case "set_lesson":
      return typeof value.lesson === "string" && value.lesson
        ? {
            action: "set_lesson",
            lesson: value.lesson,
            totalTopics: toCount(value.number_of_topics),
          }
        : null;
    case "set_topic":
      return {
        action: "set_topic",
        topic: typeof value.topic === "string" && value.topic ? value.topic : null,
        index: toCount(value.current_topic_index),
        question: typeof value.question === "string" ? value.question.trim() : "",
        choices: Array.isArray(value.choices)
          ? value.choices.filter(
              (c): c is string => typeof c === "string" && c.trim().length > 0,
            )
          : [],
      };
    case "topic_done":
    case "session_ending":
      return { action: value.action };
    default:
      return null;
  }
}
