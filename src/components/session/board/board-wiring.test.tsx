import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BoardItem, BoardState } from "@/lib/session/teaching-board";

/* الإطار يمرّر لغلاف البند ما يخصّه: رقم الخطوة وإخفات التركيز.
   الغلاف هنا بديلٌ يطبع ما تلقّاه، فالاختبار يقيس التمرير وحده لا
   معالجته. */
vi.mock("./item", () => ({
  BoardItemView: ({ item, n, dimmedByFocus }: { item: BoardItem; n: number; dimmedByFocus?: boolean }) => (
    <li data-probe={item.id} data-n={n} data-dimmed={dimmedByFocus ? "yes" : "no"} />
  ),
}));

const itemFocusDimmed = vi.fn<(state: BoardState, item: BoardItem) => boolean>(() => false);
vi.mock("@/lib/session/board/marks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session/board/marks")>()),
  itemFocusDimmed: (state: BoardState, item: BoardItem) => itemFocusDimmed(state, item),
}));

const { boardGroup, boardItem, boardState, renderBoardHtml } = await import("./test-utils");

const probe = (html: string, id: string) =>
  html.match(new RegExp(`<li data-probe="${id}" data-n="(\\d+)" data-dimmed="(yes|no)"`));

beforeEach(() => itemFocusDimmed.mockReset().mockReturnValue(false));

describe("تمرير الإطار إلى غلاف البند", () => {
  it("يمرّر إخفات التركيز المحسوب من الحالة كلها لكل بند", () => {
    const state = boardState({
      items: [
        boardItem("text", { text: "أ" }, { id: "a" }),
        boardItem("text", { text: "ب" }, { id: "b" }),
        boardItem("text", { text: "ج" }, { id: "c", region: "pinned" }),
      ],
    });
    itemFocusDimmed.mockImplementation((_state, item) => item?.id === "b");

    const html = renderBoardHtml(state, { language: "English" });

    expect(probe(html, "a")?.[2]).toBe("no");
    expect(probe(html, "b")?.[2]).toBe("yes");
    expect(probe(html, "c")?.[2]).toBe("no");
    expect(itemFocusDimmed.mock.calls.every(([passed]) => passed.items.length === 3)).toBe(true);
  });

  it("يمرّر رقم الخطوة بحسب المنطقة لا بحسب اللوح كله", () => {
    const step = (id: string, region: "live" | "pinned" | "temporary") =>
      boardItem("step", { text: id }, { id, region });
    const html = renderBoardHtml(
      boardState({
        items: [step("p1", "pinned"), step("l1", "live"), step("t1", "temporary"), step("l2", "live")],
      }),
      { language: "English" },
    );

    expect(probe(html, "p1")?.[1]).toBe("1");
    expect(probe(html, "l1")?.[1]).toBe("1");
    expect(probe(html, "l2")?.[1]).toBe("2");
    expect(probe(html, "t1")?.[1]).toBe("1");
  });

  it("البنود الأخرى تأخذ صفرًا ولا تقطع عدّ الخطوات", () => {
    const html = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g" })],
        items: [
          boardItem("step", { text: "a" }, { id: "a" }),
          boardItem("note", { text: "n" }, { id: "n" }),
          boardItem("step", { text: "b" }, { id: "b", groupId: "g" }),
        ],
      }),
      { language: "English" },
    );
    expect(probe(html, "n")?.[1]).toBe("0");
    expect(probe(html, "b")?.[1]).toBe("2");
  });

  it("العنوان يمرّ بغلاف البند نفسه", () => {
    const html = renderBoardHtml(
      boardState({
        title: boardItem("title", { text: "عنوان" }, { id: "the-title" }),
        items: [boardItem("text", { text: "س" }, { id: "a" })],
      }),
      { language: "English" },
    );
    expect(html).toContain('data-board-title=""');
    expect(probe(html, "the-title")).not.toBeNull();
  });
});
