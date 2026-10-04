import type { BoardItem, BoardState, Pen } from "./types";

export type Address =
  | { scope: "item" }
  | { scope: "row"; index: number }
  | { scope: "cell"; cell: [number, number] }
  | { scope: "column"; index: number }
  | { scope: "option"; option: string }
  | { scope: "division"; index: number };

export type Decoration = {
  highlight: boolean;
  answer: "correct" | "wrong" | null;
  dim: boolean;
  strike: boolean;
  focus: boolean;
  dimmedByFocus: boolean;
};

/** القيم المحايدة تحفظ العرض؛ الحالة الأساسية وحدها تُنقل إلى الزخرفة. */
export function decorate(
  item: BoardItem,
  address: Address,
  base?: Partial<Decoration>,
): Decoration {
  void item;
  void address;
  return {
    highlight: false,
    answer: null,
    dim: false,
    strike: false,
    focus: false,
    dimmedByFocus: false,
    ...base,
  };
}

export function itemFocusDimmed(state: BoardState, item: BoardItem): boolean {
  void state;
  void item;
  return false;
}

/** غياب السمة يبقي المظهر العادي؛ وجودها يختار المعالجة المشتركة. */
export function decorationAttrs(decoration: Decoration) {
  return {
    "data-mark-highlight": decoration.highlight ? "" : undefined,
    "data-mark-answer": decoration.answer ?? undefined,
    "data-mark-dim": decoration.dim ? "" : undefined,
    "data-mark-strike": decoration.strike ? "" : undefined,
    "data-mark-focus": decoration.focus ? "" : undefined,
    "data-mark-dimmed-by-focus": decoration.dimmedByFocus ? "" : undefined,
  };
}

export function penAttrs(pen: Pen | null): { "data-pen"?: Pen } {
  return pen === null ? {} : { "data-pen": pen };
}
