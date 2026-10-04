import { beforeEach, expect, it, vi } from "vitest";
import type { RichTextProps } from "./rich-text";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";
import type { BoardItem, Mark } from "@/lib/session/teaching-board";

const { fields } = vi.hoisted(() => ({ fields: [] as RichTextProps[] }));
/* نختبر ما يُسلَّم إلى عارض النصّ، لا طريقة ترميزه أو عزله. */
vi.mock("./rich-text", () => ({ RichText: (props: RichTextProps) => {
  fields.push(props);
  return <span>{props.text}{props.renderBlank?.(0)}</span>;
} }));
beforeEach(() => { fields.length = 0; });
const span: Mark = { scope: "span", index: null, cell: null, option: null, match: "field", state: "highlight" };
const itemMark: Mark = { ...span, scope: "item", match: null };
const cell = (text: string) => ({ text, state: null });
const render = (item: BoardItem) => {
  item.pen = "construct";
  item.marks = [span, itemMark];
  renderBoardHtml(boardState({ items: [item] }), { language: "English" });
};
const assertFields = (texts: string[], markup: boolean) => {
  for (const text of texts) {
    const matches = fields.filter((field) => field.text === text);
    expect(matches.length).toBeGreaterThan(0);
    for (const field of matches) {
      expect(field.markup).toBe(markup);
      expect(field.pen).toBe("construct");
      expect(field.spans).toEqual([span]);
    }
  }
};

it("routes table headers and visible cells with markup, pen and span marks", () => {
  render(boardItem("table", { header: [cell("Header field")], rows: [[cell("Cell field")], [cell("Hidden field")]], variant: "plain", progressive: true, numberedColumns: true }, { revealed: 1 }));
  assertFields(["Header field", "Cell field"], true);
  expect(fields.some((field) => field.text === "Hidden field")).toBe(false);
});

it("routes all comparison labels and logical fields through RichText", () => {
  render(boardItem("compare", { aspectLabel: "Aspect field", columns: ["X label field", "Y label field"], rows: [{ aspect: "Row field", x: "X field", y: "Y field" }] }));
  assertFields(["Aspect field", "X label field", "Y label field", "Row field", "X field", "Y field"], true);
});

it("routes the options stem and answers through RichText", () => {
  render(boardItem("options", { stem: "Stem field", options: [{ id: "a", text: "A field" }, { id: "b", text: "B field" }] }));
  assertFields(["Stem field", "A field", "B field"], true);
});

it("routes chain links with markup disabled", () => {
  render(boardItem("chain", { links: ["First field", "Second field"], breakAt: null }));
  assertFields(["First field", "Second field"], false);
});

it("routes blank templates with markup and visible fills without markup", () => {
  render(boardItem("blanks", { template: "Template field ___", blanks: [{ id: "a" }] }, { slots: { a: { text: "Fill field" } } }));
  assertFields(["Template field ___"], true);
  assertFields(["Fill field"], false);
});
