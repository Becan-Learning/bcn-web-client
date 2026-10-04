import type { BoardItem } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";

/** مدخل موحّد يحفظ هوية العنصر وحالته إلى جانب حمولته */
export type BoardKindProps<K extends BoardItem["kind"] = BoardItem["kind"]> = {
  item: Extract<BoardItem, { kind: K }>;
  language: ExplanationLanguage;
  n: number;
};
