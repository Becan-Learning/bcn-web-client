import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import arabicMessages from "../../../../messages/ar.json";
import englishMessages from "../../../../messages/en.json";
import {
  INITIAL_BOARD_STATE,
  type BoardGroup,
  type BoardItem,
  type BoardPayloadByKind,
  type BoardState,
  type ItemBase,
} from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";
import { Board } from "./board";

/** بناء الحالة مباشرة يتيح اختبار العرض دون المرور برسائل الوكيل. */
export function boardItem<K extends BoardItem["kind"]>(
  kind: K,
  payload: BoardPayloadByKind[K],
  overrides: Partial<ItemBase> = {},
): Extract<BoardItem, { kind: K }> {
  const revealed =
    "progressive" in payload && !payload.progressive
      ? "rows" in payload ? payload.rows.length : "divisions" in payload ? payload.divisions.length : 1
      : 1;
  return {
    id: `item-${kind}`,
    kind,
    payload,
    region: "live",
    groupId: null,
    annotation: null,
    revealed,
    slots: {},
    pen: null,
    marks: [],
    ...overrides,
  } as Extract<BoardItem, { kind: K }>;
}

export function boardGroup(overrides: Partial<BoardGroup> = {}): BoardGroup {
  return {
    id: "group",
    kind: "box",
    region: "live",
    heading: "Group",
    stage: null,
    ...overrides,
  };
}

export function boardState(overrides: Partial<BoardState> = {}): BoardState {
  return { ...INITIAL_BOARD_STATE, visible: true, groups: [], items: [], ...overrides };
}

/** رسائل المزود هي رسائل المنتج الحقيقية، واتجاه اللوح يتبع لغة الشرح. */
export function renderBoardHtml(
  state: BoardState,
  { language }: { language: ExplanationLanguage },
): string {
  const locale = language === "Arabic" ? "ar" : "en";
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ar" ? arabicMessages : englishMessages}
      timeZone="Asia/Riyadh"
    >
      <div data-theme="dark" data-surface="session">
        <Board board={state} speaking={false} intro={null} reduce language={language} />
      </div>
    </NextIntlClientProvider>,
  );
}

/** النصّ كما يُقرأ: عزل الاتجاه والتنسيق يقطعان النصّ إلى عناصر،
    فالمقارنة بالحروف تجري بعد نزع الوسوم لا على HTML الخام. */
export function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
