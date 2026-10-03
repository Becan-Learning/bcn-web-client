import type { AnnotationKind, CalloutKind } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";

/* ألفاظ السبورة كلام المعلّم فتتبع لغة الشرح، لا الواجهة؛
   هذا استثناء موثّق من جمع نصوص الواجهة في messages/ (ADR 0001). */
export const BOARD_LABEL = { Arabic: "السبورة", English: "Board" } as const;

export const BAND_LABEL = {
  pinned: { Arabic: "مرجع", English: "Reference" },
  temporary: { Arabic: "جانبيّ", English: "Aside" },
} as const;

export const ANNOTATION_LABEL: Partial<Record<AnnotationKind, Record<ExplanationLanguage, string>>> = {
  warning: { Arabic: "تنبيه", English: "Note" },
  correct: { Arabic: "إجابة صحيحة", English: "Correct" },
  wrong: { Arabic: "إجابة خاطئة", English: "Wrong" },
  broken: { Arabic: "وصلة ملغاة", English: "Cancelled link" },
};

export const CALLOUT_LABEL: Record<CalloutKind, Record<ExplanationLanguage, string>> = {
  loses_marks: { Arabic: "يضيّع درجات", English: "Loses marks" },
  mistake: { Arabic: "غلط شائع", English: "Common mistake" },
  mnemonic: { Arabic: "حيلة للحفظ", English: "Mnemonic" },
  definition: { Arabic: "تعريف", English: "Definition" },
  example: { Arabic: "مثال", English: "Example" },
  exam: { Arabic: "يجي في الاختبار", English: "In the exam" },
};

export const BLANK_LABEL = { Arabic: "فراغ", English: "blank" } as const;

export const OPTION_LABELS = {
  Arabic: ["A", "B", "C", "D", "E", "F"],
  English: ["A", "B", "C", "D", "E", "F"],
} as const;
