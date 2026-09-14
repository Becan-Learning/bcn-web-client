export type BoardItemType = "title" | "bullet" | "text" | "step";

export type BoardItem = {
  id: string;
  type: BoardItemType;
  text: string;
};

export type BoardState = {
  visible: boolean;
  title: BoardItem | null;
  items: BoardItem[];
  emphasizedId: string | null;
};

export type BoardControlEvent =
  | { action: "board_show" }
  | { action: "board_hide" }
  | { action: "board_clear" }
  | { action: "board_set_title"; id: string; text: string }
  | { action: "board_add_bullet"; id: string; text: string }
  | { action: "board_add_text"; id: string; text: string }
  | { action: "board_add_step"; id: string; text: string }
  | { action: "board_emphasize"; id: string };

export type BoardAction = BoardControlEvent | { action: "board_reset" };

export const INITIAL_BOARD_STATE: BoardState = {
  visible: false,
  title: null,
  items: [],
  emphasizedId: null,
};

const MAX_BOARD_ITEMS = 15;
const MAX_TITLE_LENGTH = 80;
const MAX_ITEM_LENGTH = 180;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text || Array.from(text).length > maxLength) return null;

  return text;
}

export function parseBoardControlEvent(
  value: unknown,
): BoardControlEvent | null {
  if (!isRecord(value) || typeof value.action !== "string") return null;

  switch (value.action) {
    case "board_show":
    case "board_hide":
    case "board_clear":
      return { action: value.action };
    case "board_set_title": {
      const text = normalizeText(value.text, MAX_TITLE_LENGTH);
      if (!hasValidId(value.id) || text === null) return null;
      return { action: value.action, id: value.id, text };
    }
    case "board_add_bullet":
    case "board_add_text":
    case "board_add_step": {
      const text = normalizeText(value.text, MAX_ITEM_LENGTH);
      if (!hasValidId(value.id) || text === null) return null;
      return { action: value.action, id: value.id, text };
    }
    case "board_emphasize":
      if (!hasValidId(value.id)) return null;
      return { action: value.action, id: value.id };
    default:
      return null;
  }
}

export function teachingBoardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  if (action.action === "board_reset") return INITIAL_BOARD_STATE;

  const event = parseBoardControlEvent(action);
  if (!event) return state;

  switch (event.action) {
    case "board_show":
      return state.visible ? state : { ...state, visible: true };
    case "board_hide":
      return state.visible ? { ...state, visible: false } : state;
    case "board_clear":
      return {
        visible: state.visible,
        title: null,
        items: [],
        emphasizedId: null,
      };
    case "board_set_title": {
      if (state.items.some((item) => item.id === event.id)) return state;

      const replacedEmphasizedTitle =
        state.title?.id === state.emphasizedId && state.title.id !== event.id;

      return {
        ...state,
        visible: true,
        title: { id: event.id, type: "title", text: event.text },
        emphasizedId: replacedEmphasizedTitle ? null : state.emphasizedId,
      };
    }
    case "board_add_bullet":
    case "board_add_text":
    case "board_add_step": {
      if (
        state.items.length >= MAX_BOARD_ITEMS ||
        state.title?.id === event.id ||
        state.items.some((item) => item.id === event.id)
      ) {
        return state;
      }

      const type = event.action.replace("board_add_", "") as Exclude<
        BoardItemType,
        "title"
      >;

      return {
        ...state,
        visible: true,
        items: [...state.items, { id: event.id, type, text: event.text }],
      };
    }
    case "board_emphasize": {
      const itemExists =
        state.title?.id === event.id ||
        state.items.some((item) => item.id === event.id);

      if (!itemExists || state.emphasizedId === event.id) return state;
      return { ...state, emphasizedId: event.id };
    }
  }
}
