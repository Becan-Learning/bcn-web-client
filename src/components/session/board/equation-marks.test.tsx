import { expect, it } from "vitest";
import type { Mark, MarkState } from "@/lib/session/teaching-board";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";

const span = (match: string, state: MarkState): Mark => ({ scope: "span", state, match, index: null, cell: null, option: null });
const equation = (latex: string, marks: Mark[] = [], display = true) => renderBoardHtml(boardState({ items: [boardItem("equation", { latex, display }, { marks })] }), { language: "English" });

it("marks original LaTeX denominators and clears back to the original", () => {
  const source = String.raw`\frac{300}{100\ \text{cm}}=3\ \text{m}`;
  const original = equation(source);
  const marked = equation(source, [span(String.raw`100\ \text{cm}`, "highlight"), span(String.raw`3\ \text{m}`, "correct")]);
  expect(marked).toContain("board-mark-highlight");
  expect(marked).toContain("board-mark-correct");
  expect(marked).toContain('data-mark-icon=""');
  expect(marked).toContain("Correct");
  expect(marked).toContain("<svg");
  expect(marked).not.toContain("<code");
  expect(equation(source, [span("missing", "focus")])).toBe(original);
  expect(equation(source)).toBe(original);
});

it.each(["highlight", "correct", "wrong", "dim", "strike", "focus"] as const)("equation span %s is controlled and visible", (state) => {
  const rendered = equation("x+y", [span("x", state)]);
  expect(rendered).toContain(`board-mark-${state}`);
  if (state === "focus") expect(rendered).toContain('data-equation-focus=""');
  if (state === "correct" || state === "wrong") {
    expect(rendered).toContain(`data-mark-answer="${state}"`);
    expect(rendered).toContain('data-mark-icon=""');
    expect(rendered).toContain(state === "correct" ? "Correct" : "Wrong");
  }
});

it("combines marks on the same original span with the later answer winning", () => {
  const rendered = equation("x+y", [span("x", "correct"), span("x", "highlight"), span("x", "wrong"), span("x", "strike"), span("x", "focus")]);
  expect(rendered).toContain("board-mark-highlight board-mark-wrong board-mark-strike board-mark-focus");
  expect(rendered).not.toContain("board-mark-correct");
  expect(rendered).not.toContain("<code");
});

it("marks repeated occurrences but skips nested and overlapping distinct matches", () => {
  const repeated = equation("x+x", [span("x", "highlight")]);
  expect(repeated.match(/class="enclosing board-mark-highlight"/g)?.length).toBe(2);
  const overlap = equation("abc", [span("ab", "highlight"), span("bc", "wrong"), span("a", "strike")]);
  expect(overlap).toContain("board-mark-highlight");
  expect(overlap).not.toContain("board-mark-wrong");
  expect(overlap).not.toContain("board-mark-strike");
  expect(overlap).not.toContain("<code");
});

it.each([String.raw`\frac{1}{`, String.raw`\unknownCommand{x}`])("malformed math falls back to raw source: %s", (source) => {
  const rendered = equation(source);
  expect(rendered).toContain("<code");
  expect(rendered).toContain(source);
  expect(rendered).not.toContain("katex-error");
});

it("a span wrapping part of an original command safely falls back", () => {
  const source = String.raw`\frac{1}{2}`;
  const rendered = equation(source, [span("frac", "highlight")]);
  expect(rendered).toContain("<code");
  expect(rendered).toContain("frac");
  expect(rendered).toContain("{1}{2}");
  expect(rendered).not.toContain("katex-error");
});

it.each([String.raw`\htmlClass{board-mark-highlight}{x}`, String.raw`\htmlStyle{opacity:0}{x}`, String.raw`\htmlId{unsafe}{x}`, String.raw`\href{https://example.com}{x}`])("author HTML commands never become trusted: %s", (source) => {
  const rendered = equation(source, [span("x", "highlight")]);
  expect(rendered).toContain("<code");
  expect(rendered).not.toContain('class="enclosing board-mark-highlight');
  expect(rendered).not.toContain("href=");
  expect(rendered).not.toContain('id="unsafe"');
});

it("600-character aligned equations render inside their own LTR scroll area", () => {
  const prefix = String.raw`\begin{aligned}` + Array.from({ length: 30 }, (_, i) => `x_{${i}}&=${i}\\\\`).join("") + String.raw`&=\text{`;
  const suffix = String.raw`}\end{aligned}`;
  const source = prefix + "x".repeat(600 - prefix.length - suffix.length) + suffix;
  expect(source.length).toBe(600);
  const rendered = equation(source);
  expect(rendered).toContain("katex-display");
  expect(rendered).toContain("overflow-x-auto");
  expect(rendered).toContain('dir="ltr"');
  expect(rendered).not.toContain("<code");
  expect(equation("x+1", [], false)).not.toContain("katex-display");
});
