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
  | { action: "session_ending"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function parseUIControlEvent(value: unknown): UIControlEvent | null {
  if (!isRecord(value) || typeof value.action !== "string") return null;

  switch (value.action) {
    case "scroll":
      return positiveInteger(value.page) ? { action: "scroll", page: value.page } : null;
    case "set_lesson":
      return typeof value.lesson === "string" && value.lesson && positiveInteger(value.number_of_topics)
        ? { action: "set_lesson", lesson: value.lesson, totalTopics: value.number_of_topics }
        : null;
    case "set_topic":
      if (typeof value.topic !== "string" || !positiveInteger(value.current_topic_index) ||
          typeof value.question !== "string" || !Array.isArray(value.choices) ||
          !value.choices.every((choice): choice is string => typeof choice === "string")) return null;
      return {
        action: "set_topic",
        topic: value.topic || null,
        index: value.current_topic_index,
        question: value.question,
        choices: value.choices,
      };
    case "topic_done":
      return { action: "topic_done" };
    case "session_ending":
      return typeof value.message === "string" ? { action: "session_ending", message: value.message } : null;
    default:
      return null;
  }
}
