import { describe, expect, it } from "vitest";
import type { BoardItem, Mark } from "@/lib/session/teaching-board";
import { MARK_LABEL } from "./labels";
import { boardItem, boardState, renderBoardHtml, visibleText } from "./test-utils";

const render = (item: BoardItem, language: "Arabic" | "English" = "English") =>
  renderBoardHtml(boardState({ items: [item] }), { language });
const count = (html: string, value: string) => html.split(value).length - 1;
const mark = (scope: Mark["scope"], state: Mark["state"], address: Partial<Mark> = {}): Mark =>
  ({ scope, state, index: null, cell: null, option: null, match: null, ...address });
const cell = (text: string) => ({ text, state: null });

const textItems: BoardItem[] = [
  boardItem("heading", { text: "عنوان" }),
  boardItem("text", { text: "شرح" }),
  boardItem("bullet", { text: "نقطة", children: ["ابن"] }),
  boardItem("step", { text: "خطوة" }),
  boardItem("note", { text: "ملاحظة" }),
];

it.each(textItems)("owns the $kind pen accent once on the item", (item) => {
  item.pen = "construct";
  const html = render(item);
  expect(html).toMatch(/<li[^>]*data-pen="construct"[^>]*data-board-item=/);
  expect(count(html, 'data-pen="construct"')).toBe(1);
  expect(html).not.toMatch(/<div[^>]*data-pen=/);
});

it("keeps the icon accent on its ring and highlights", () => {
  const html = render(boardItem("icon", { icon: "ruler", label: "المقياس =={mark}1==", attachTo: null }, { pen: "construct" }));
  expect(html.match(/<li[^>]*data-board-item=[^>]*>/)?.[0]).not.toContain("data-pen");
  expect(html).toContain('data-icon-pen="construct"');
  expect(html).not.toContain('data-pen="construct"');
  expect(html).toMatch(/<mark data-pen="mark" data-mark-highlight=""/);
});

for (const kind of ["table", "compare"] as const) {
  describe(`${kind} column answer cues`, () => {
    it.each(["correct", "wrong"] as const)("announces %s once in the header and once per portrait card", (answer) => {
      const item = kind === "table"
        ? boardItem("table", { variant: "plain", header: [cell("Field"), cell("Value")], rows: [[cell("Mass"), cell("5")], [cell("Length"), cell("3")]], numberedColumns: false, progressive: false })
        : boardItem("compare", { aspectLabel: "Aspect", columns: ["X", "Y"], rows: [{ aspect: "Mass", x: "5", y: "6" }, { aspect: "Length", x: "3", y: "4" }] });
      item.marks = [mark("column", answer, { index: 1 }), ...(["highlight", "strike", "dim"] as const).map((state) => mark("column", state, { index: 1 }))];
      const html = render(item);
      const desktop = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
      const header = desktop.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? "";
      const body = desktop.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0] ?? "";
      const cards = html.slice(html.indexOf("</table>") + "</table>".length);
      expect(count(header, 'data-mark-icon=""')).toBe(1);
      expect(count(visibleText(header), MARK_LABEL[answer].English)).toBe(1);
      expect(header).toMatch(/<th[^>]*data-board-column="1"[^>]*>[\s\S]*?data-mark-icon=/);
      expect(body).not.toContain("data-mark-icon");
      expect(visibleText(body)).not.toContain(MARK_LABEL[answer].English);
      expect(count(cards, 'data-mark-icon=""')).toBe(2);
      expect(count(visibleText(cards), MARK_LABEL[answer].English)).toBe(2);
      const addressed = [...html.matchAll(/<[a-z]+[^>]*data-board-column="1"[^>]*>/g)];
      expect(addressed).toHaveLength(5);
      for (const [tag] of addressed) {
        for (const attribute of [`data-mark-answer="${answer}"`, 'data-mark-highlight=""', 'data-mark-strike=""', 'data-mark-dim=""']) expect(tag).toContain(attribute);
      }
    });
  });
}

it.each(["Arabic", "English"] as const)("emits one cue per span state in %s", (language) => {
  const item = boardItem("text", { text: "مقطع" }, { marks: [mark("span", "correct", { match: "مقطع" }), mark("span", "strike", { match: "مقطع" })] });
  const html = render(item, language);
  const other = language === "Arabic" ? "English" : "Arabic";
  for (const state of ["correct", "strike"] as const) {
    expect(count(visibleText(html), MARK_LABEL[state][language])).toBe(1);
    expect(visibleText(html)).not.toContain(MARK_LABEL[state][other]);
  }
  expect(html).not.toContain("data-cue-lang");
});

it("places automatic direction on structured text blocks in an English board", () => {
  const items: BoardItem[] = [
    boardItem("options", { stem: "سؤال", options: [{ id: "a", text: "خيار" }] }),
    boardItem("table", { variant: "plain", header: [cell("حقل")], rows: [[cell("قيمة")]], numberedColumns: false, progressive: false }),
    boardItem("compare", { aspectLabel: "جانب", columns: ["أول", "ثان"], rows: [{ aspect: "وجه", x: "هنا", y: "هناك" }] }),
    boardItem("chain", { links: ["سبب", "نتيجة"], breakAt: null }),
    boardItem("blanks", { template: "قالب ___", blanks: [{ id: "blank" }] }),
    boardItem("timeline", { axisLabel: "محور", divisions: ["بداية", "نهاية"], markers: [{ id: "marker", at: 0, label: "واصق", pen: null }], progressive: false }),
    boardItem("icon", { icon: "ruler", label: "أيقونة", attachTo: null }),
  ];
  const html = renderBoardHtml(boardState({ items }), { language: "English" });
  expect(html).toContain('dir="ltr" lang="en"');
  for (const word of ["سؤال", "خيار", "حقل", "قيمة", "جانب", "وجه", "هنا", "هناك", "سبب", "نتيجة", "بداية", "نهاية", "أيقونة"]) {
    expect(html).toMatch(new RegExp(`<(?:p|span|th|dt)[^>]*dir="auto"[^>]*>${word}</`));
  }
  expect(html).toMatch(/<p dir="auto"[^>]*>قالب /);
  expect(html).toMatch(/<p dir="auto" id="[^"]+"[^>]*>محور<\/p>/);
  expect(html).toMatch(/<li data-marker="marker" dir="auto"[^>]*><span>واصق<\/span><\/li>/);
});
