import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { BoardItem, BoardState, Mark, MarkScope, MarkState, SlotState } from "@/lib/session/teaching-board";
import { itemFocusDimmed } from "@/lib/session/board/marks";
import { BoardItemView } from "./item";
import { MARK_LABEL } from "./labels";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";

const states: MarkState[] = ["highlight", "correct", "wrong", "dim", "strike", "focus"];
const mark = (scope: MarkScope, state: MarkState, address: Partial<Mark> = {}): Mark => ({ scope, state, index: null, cell: null, option: null, match: null, ...address });
const cell = (text: string) => ({ text, state: null });
const table = () => boardItem("table", { variant: "plain", header: [cell("Field"), cell("Value"), cell("Unit")], rows: [[cell("Mass"), cell("120,000"), cell("kg")], [cell("Length"), cell("0.04"), cell("m")]], numberedColumns: false, progressive: false });
const compare = () => boardItem("compare", { aspectLabel: "Aspect", columns: ["X field", "Y field"], rows: [{ aspect: "First aspect", x: "First X", y: "First Y" }, { aspect: "Second aspect", x: "Second X", y: "Second Y" }] });
const options = () => boardItem("options", { stem: "Choose", options: [{ id: "a", text: "First option" }, { id: "b", text: "Second option" }, { id: "c", text: "Third option" }] });
const html = (item: BoardItem, language: "Arabic" | "English" = "English") => renderBoardHtml(boardState({ items: [item] }), { language });
const tags = (source: string, attribute: string, value: string) => [...source.matchAll(/<[a-z][^>]*>/g)].map((match) => match[0]).filter((tag) => tag.includes(`${attribute}="${value}"`));
const expectedAttribute = (state: MarkState) => state === "correct" || state === "wrong" ? `data-mark-answer="${state}"` : `data-mark-${state}=""`;

for (const make of [table, compare]) {
  describe(`${make.name}: addressed marks in both layouts`, () => {
    for (const state of states) {
      for (const scope of ["row", "column", "cell"] as const) {
        it(`${scope}: ${state}`, () => {
          const item = make();
          item.marks = [mark(scope, state, scope === "cell" ? { cell: [0, 1] } : { index: 0 })];
          const rendered = html(item);
          const [attr, value] = scope === "row" ? ["data-board-row", "0"] : scope === "column" ? ["data-board-column", "0"] : ["data-board-cell", "0:1"];
          const addressed = tags(rendered, attr, value);
          expect(addressed.length).toBeGreaterThanOrEqual(2);
          for (const tag of addressed) expect(tag).toContain(expectedAttribute(state));
          if (state === "correct" || state === "wrong") {
            expect(rendered).toContain('data-mark-icon=""');
            expect(rendered).toContain(MARK_LABEL[state].English);
            expect(rendered).toContain("<svg");
          }
          if (state === "focus") {
            const [siblingAttr, sibling] = scope === "row" ? ["data-board-row", "1"] : scope === "column" ? ["data-board-column", "1"] : ["data-board-cell", "0:0"];
            for (const tag of tags(rendered, siblingAttr, sibling)) expect(tag).toContain('data-mark-dimmed-by-focus=""');
            for (const tag of addressed) expect(tag).not.toContain("data-mark-dimmed-by-focus");
            if (scope === "cell") for (const tag of tags(rendered, "data-board-cell", "1:0")) expect(tag).not.toContain("data-mark-dimmed-by-focus");
          }
          item.marks = [];
          expect(html(item)).not.toContain("data-mark-");
        });
      }
    }
  });
}

it.each(states)("whole structured item: %s", (state) => {
  const item = table();
  item.marks = [mark("item", state)];
  const rendered = html(item, "Arabic");
  expect(tags(rendered, "data-board-item", item.id)[0]).toContain(expectedAttribute(state));
  if (state === "correct" || state === "wrong") expect(rendered).toContain(MARK_LABEL[state].Arabic);
  if (state === "strike") {
    expect(rendered).toContain('data-cancelled=""');
    expect(rendered).toContain("120,000");
  }
});

it("combines properties and preserves annotation and pen after marks clear", () => {
  const item = table();
  item.annotation = "key";
  item.pen = "trap";
  item.marks = [mark("item", "highlight"), mark("item", "correct"), mark("item", "strike"), mark("item", "wrong"), mark("item", "dim")];
  const decorated = tags(html(item), "data-board-item", item.id)[0];
  for (const attr of ['data-mark-highlight=""', 'data-mark-strike=""', 'data-mark-dim=""', 'data-mark-answer="wrong"', 'data-pen="trap"']) expect(decorated).toContain(attr);
  expect(decorated).not.toContain('data-mark-answer="correct"');
  item.marks = [];
  const cleared = tags(html(item), "data-board-item", item.id)[0];
  expect(cleared).toContain('data-mark-highlight=""');
  expect(cleared).toContain('aria-current="true"');
  expect(cleared).toContain('data-pen="trap"');
  expect(cleared).not.toContain("data-mark-strike");
});

it.each(["correct", "wrong"] as const)("legacy whole-item %s uses the icon slot", (annotation) => {
  const item = table();
  item.annotation = annotation;
  const rendered = html(item);
  expect(tags(rendered, "data-board-item", item.id)[0]).toContain(`data-mark-answer="${annotation}"`);
  expect(rendered).toContain('data-mark-icon=""');
  expect(rendered).toContain(MARK_LABEL[annotation].English);
});

it("keeps static states on headers and empty cells after clear", () => {
  const item = table();
  item.payload.header[0].state = "highlight";
  item.payload.header[1].state = "correct";
  item.payload.rows[0][0] = { text: "", state: "wrong" };
  item.payload.rows[0][1].state = "dim";
  const baseline = html(item);
  expect(baseline).toContain('data-mark-highlight=""');
  expect(baseline).toContain('data-mark-answer="correct"');
  expect(tags(baseline, "data-board-cell", "0:0")[0]).toContain('data-mark-answer="wrong"');
  expect(tags(baseline, "data-board-cell", "0:1")[0]).toContain('data-mark-dim=""');
  item.marks = [mark("cell", "correct", { cell: [0, 0] }), mark("cell", "strike", { cell: [0, 0] })];
  expect(tags(html(item), "data-board-cell", "0:0")[0]).toContain('data-mark-answer="correct"');
  item.marks = [];
  expect(html(item)).toBe(baseline);
});

it("reveals only authored visible rows and repeats column numbers above field labels", () => {
  const item = table();
  item.payload.progressive = true;
  item.payload.numberedColumns = true;
  item.revealed = 1;
  item.marks = [mark("row", "wrong", { index: 1 })];
  const first = html(item);
  expect(first).toContain("Mass");
  expect(first).not.toContain("Length");
  expect(first).not.toContain("0.04");
  expect(first).not.toContain('data-mark-answer="wrong"');
  for (const n of [1, 2, 3]) expect(first).toContain(`>${n}</span>`);
  expect(first.indexOf(">1</span>")).toBeLessThan(first.indexOf("Field"));
  expect(first.match(/>2<\/span>/g)?.length).toBe(2);
  item.revealed = 2;
  const second = html(item);
  expect(second).toContain("Length");
  for (const tag of tags(second, "data-board-row", "1")) expect(tag).toContain('data-mark-answer="wrong"');
});

it.each(["Arabic", "English"] as const)("logical compare coordinates in %s", (language) => {
  const item = compare();
  item.marks = [mark("column", "strike", { index: 0 }), mark("cell", "wrong", { cell: [0, 1] }), mark("cell", "correct", { cell: [0, 2] })];
  const rendered = html(item, language);
  for (const tag of tags(rendered, "data-board-column", "0")) expect(tag).toContain('data-mark-strike=""');
  expect(rendered).toMatch(/data-board-cell="0:1"[^>]*data-mark-answer="wrong"[^>]*>[\s\S]*?First X/);
  expect(rendered).toMatch(/data-board-cell="0:2"[^>]*data-mark-answer="correct"[^>]*>[\s\S]*?First Y/);
  expect(tags(rendered, "data-board-column", "0").some((tag) => tag.startsWith("<p"))).toBe(true);
});

it("keeps journal numbers authored, LTR, tabular and aligned with empty cells", () => {
  const item = boardItem("table", { variant: "journal", header: [cell("Account"), cell("Debit"), cell("Credit")], rows: [[cell("Cash"), cell("120,000"), cell("")]], progressive: false, numberedColumns: false });
  const rendered = html(item, "Arabic");
  expect(rendered).toContain("120,000");
  expect(rendered).toContain('dir="ltr" class="block text-end tabular-nums');
  expect(tags(rendered, "data-board-cell", "0:2")).toHaveLength(2);
  expect(rendered).toContain("min-h-[1.75em]");
});

it.each(states)("option marks: %s", (state) => {
  const item = options();
  item.marks = [mark("option", state, { option: "b" })];
  const rendered = html(item);
  expect(tags(rendered, "data-board-option", "b")[0]).toContain(expectedAttribute(state));
  if (state === "focus") expect(tags(rendered, "data-board-option", "a")[0]).toContain('data-mark-dimmed-by-focus=""');
  item.marks = [];
  expect(html(item)).not.toContain("data-mark-");
});

it.each(["correct", "wrong", "broken", "key"] as SlotState[])("legacy option slot: %s", (state) => {
  const item = options();
  item.slots.b = { state };
  const rendered = html(item);
  const attr = state === "broken" ? 'data-mark-strike=""' : state === "key" ? 'data-mark-highlight=""' : `data-mark-answer="${state}"`;
  expect(tags(rendered, "data-board-option", "b")[0]).toContain(attr);
  if (state === "correct" || state === "wrong") expect(rendered).toContain(MARK_LABEL[state].English);
  else expect(rendered).toContain(state === "key" ? "Highlighted" : "Cancelled link");
});

it("options expose no answer metadata or interaction and continue alphabetically", () => {
  const item = options();
  item.payload.options.push(...Array.from({ length: 25 }, (_, i) => ({ id: `more-${i}`, text: `Choice ${i}` })));
  Object.assign(item.payload.options[1], { correct: true });
  const rendered = html(item);
  expect(rendered).not.toContain("correct");
  expect(rendered).not.toContain("Correct");
  expect(rendered).not.toContain("button");
  expect(rendered).not.toContain("onClick");
  expect(rendered).toContain(">AA</span>");
});

it("breakAt 1 cancels the connector into the second link", () => {
  const item = boardItem("chain", { links: ["First", "Second", "Third"], breakAt: 1 });
  const rendered = html(item);
  expect(tags(rendered, "data-board-connector", "1")[0]).toContain('data-broken=""');
  expect(tags(rendered, "data-board-connector", "2")[0]).not.toContain("data-broken");
  expect(tags(rendered, "data-board-link", "1")[0]).not.toContain("data-mark-strike");
});

it.each(["correct", "wrong", "key"] as const)("legacy chain link: %s", (state) => {
  const item = boardItem("chain", { links: ["First", "Second"], breakAt: null }, { slots: { "1": { state } } });
  const rendered = html(item);
  expect(tags(rendered, "data-board-link", "1")[0]).toContain(state === "key" ? 'data-mark-highlight=""' : `data-mark-answer="${state}"`);
  expect(rendered).toContain(state === "key" ? "Highlighted" : MARK_LABEL[state].English);
});

it("broken chain slots strike only the first link or the incoming connector", () => {
  const item = boardItem("chain", { links: ["First", "Second"], breakAt: null }, { slots: { "0": { state: "broken" }, "1": { state: "broken" } } });
  const rendered = html(item);
  expect(tags(rendered, "data-board-link", "0")[0]).toContain('data-mark-strike=""');
  expect(tags(rendered, "data-board-link", "1")[0]).not.toContain("data-mark-strike");
  expect(tags(rendered, "data-board-connector", "1")[0]).toContain('data-broken=""');
});

it("blanks never expose private fills, but render published slot text", () => {
  const item = boardItem("blanks", { template: "The unit is ___", blanks: [{ id: "unit" }] });
  Object.assign(item.payload.blanks[0], { fill: "PRIVATE ANSWER" });
  item.marks = [mark("span", "highlight", { match: "PRIVATE ANSWER" })];
  expect(html(item)).not.toContain("PRIVATE ANSWER");
  expect(html(item)).toContain("blank");
  item.slots.unit = { text: "PUBLIC FILL" };
  expect(html(item)).toContain("PUBLIC FILL");
  expect(html(item)).not.toContain("PRIVATE ANSWER");
});

it("multiple focus targets keep their union prominent and ignore invalid targets", () => {
  const item = table();
  item.marks = [mark("column", "focus", { index: 0 }), mark("column", "focus", { index: 2 }), mark("cell", "focus", { cell: [99, 0] }), mark("option", "focus", { option: "a" })];
  const rendered = html(item);
  for (const col of [0, 2]) for (const tag of tags(rendered, "data-board-column", String(col))) {
    expect(tag).toContain('data-mark-focus=""');
    expect(tag).not.toContain("data-mark-dimmed-by-focus");
  }
  for (const tag of tags(rendered, "data-board-column", "1")) expect(tag).toContain('data-mark-dimmed-by-focus=""');
  for (const tag of tags(rendered, "data-board-cell", "0:1")) expect(tag).not.toContain("data-mark-dimmed-by-focus");
});

/* الإطار يسلّم الخفوت إلى المحضن؛ هذا العرض يختبر الحدّ المشترك
   دون افتراض أن كل مناطق الإطار تستعمله بالفعل. */
function renderFocusHandoff(state: BoardState) {
  return renderToStaticMarkup(<ul>{[...(state.title ? [state.title] : []), ...state.items].map((item) => <BoardItemView key={item.id} item={item} n={0} language="English" reduce dimmedByFocus={itemFocusDimmed(state, item)} />)}</ul>);
}

it("item focus follows region, addition, moves, removal and excludes the title", () => {
  const focus = options();
  focus.marks = [mark("item", "focus")];
  const sibling = table();
  const other = boardItem("chain", { links: ["Pinned A", "Pinned B"], breakAt: null }, { region: "pinned" });
  const state = boardState({ title: boardItem("title", { text: "Title" }), items: [focus, sibling, other] });
  const first = renderFocusHandoff(state);
  expect(tags(first, "data-board-item", sibling.id)[0]).toContain('data-mark-dimmed-by-focus=""');
  expect(tags(first, "data-board-item", "item-title")[0]).not.toContain("data-mark-dimmed-by-focus");
  expect(tags(first, "data-board-item", other.id)[0]).not.toContain("data-mark-dimmed-by-focus");
  const added = compare();
  state.items.push(added);
  expect(tags(renderFocusHandoff(state), "data-board-item", added.id)[0]).toContain('data-mark-dimmed-by-focus=""');
  focus.region = "pinned";
  const moved = renderFocusHandoff(state);
  expect(tags(moved, "data-board-item", sibling.id)[0]).not.toContain("data-mark-dimmed-by-focus");
  expect(tags(moved, "data-board-item", other.id)[0]).toContain('data-mark-dimmed-by-focus=""');
  state.items = state.items.filter((item) => item.id !== focus.id);
  expect(renderFocusHandoff(state)).not.toContain("data-mark-dimmed-by-focus");
});

it("hidden row focus has no visible effect until that row is revealed", () => {
  const item = table();
  item.payload.progressive = true;
  item.revealed = 1;
  item.marks = [mark("row", "focus", { index: 1 })];
  expect(html(item)).not.toContain("data-mark-focus");
  expect(html(item)).not.toContain("data-mark-dimmed-by-focus");
  item.revealed = 2;
  for (const tag of tags(html(item), "data-board-row", "0")) expect(tag).toContain('data-mark-dimmed-by-focus=""');
  for (const tag of tags(html(item), "data-board-row", "1")) expect(tag).toContain('data-mark-focus=""');
});

it("item focus keeps multiple targets prominent and title focus never dims items", () => {
  const first = table();
  const second = compare();
  const third = options();
  first.marks = [mark("item", "focus")];
  second.marks = [mark("item", "focus")];
  const state = boardState({ items: [first, second, third] });
  const focused = renderFocusHandoff(state);
  for (const item of [first, second]) expect(tags(focused, "data-board-item", item.id)[0]).not.toContain("data-mark-dimmed-by-focus");
  expect(tags(focused, "data-board-item", third.id)[0]).toContain('data-mark-dimmed-by-focus=""');
  first.marks = [];
  second.marks = [];
  state.title = boardItem("title", { text: "Focused title" }, { marks: [mark("item", "focus")] });
  expect(renderFocusHandoff(state)).not.toContain("data-mark-dimmed-by-focus");
});

it("later item feedback replaces conflicting legacy answer frames", () => {
  const item = table();
  item.annotation = "correct";
  item.marks = [mark("item", "wrong")];
  const frame = tags(html(item), "data-board-item", item.id)[0];
  expect(frame).toContain('data-mark-answer="wrong"');
  expect(frame).toContain("border-error");
  expect(frame).not.toContain("border-live");
});
