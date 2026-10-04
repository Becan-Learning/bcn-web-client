import { describe, expect, it, vi } from "vitest";
import type { Address, Decoration } from "@/lib/session/board/marks";
import type { BoardItem } from "@/lib/session/teaching-board";
import { MARK_LABEL } from "./labels";

/* الزخرفة تُستمدّ بعنوان `division` لكل تقسيمٍ ظاهر. القيم هنا مصنوعة
   لقياس الوصلة وحدها: الاستخلاص الفعلي من العلامات المخزّنة له اختباره. */
const decorate = vi.fn((_item: BoardItem, address: Address): Decoration => {
  const base: Decoration = {
    highlight: false,
    answer: null,
    dim: false,
    strike: false,
    focus: false,
    dimmedByFocus: false,
  };
  if (address.scope !== "division") return base;
  if (address.index === 1) return { ...base, answer: "correct", focus: true };
  return { ...base, dimmedByFocus: true };
});

vi.mock("@/lib/session/board/marks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session/board/marks")>()),
  decorate: (item: BoardItem, address: Address) => decorate(item, address),
}));

const { boardItem, boardState, renderBoardHtml } = await import("./test-utils");

const timeline = (revealed: number) =>
  boardItem(
    "timeline",
    {
      axisLabel: "تحويل الوحدات",
      divisions: ["المعطى", "معامل التحويل", "النتيجة"],
      markers: [{ id: "marker-factor", at: 1, label: "× 100", pen: null }],
      progressive: true,
    },
    { id: "board-mark-division", pen: "mark", revealed },
  );

describe("علامات التقسيم", () => {
  it("تطبَّق سمات الزخرفة على التقسيم نفسه فتشمل وسمه وواصقه", () => {
    decorate.mockClear();
    const html = renderBoardHtml(boardState({ items: [timeline(3)] }), { language: "English" });
    const division = html.match(/<li data-division="1"[^>]*>[\s\S]*?<\/li><\/ul><\/li>/)?.[0] ?? "";

    expect(division).toContain('data-mark-answer="correct"');
    expect(division).toContain("data-mark-focus");
    expect(division).not.toContain("data-mark-dimmed-by-focus");
    expect(division).toContain("× 100");
    expect(division).toContain("معامل التحويل");
  });

  it("إخفات التركيز يصيب التقسيمات الأخرى وحدها", () => {
    const html = renderBoardHtml(boardState({ items: [timeline(3)] }), { language: "English" });
    const dimmed = html.match(/<li data-division="\d"[^>]*data-mark-dimmed-by-focus/g) ?? [];
    expect(dimmed.map((tag) => tag.match(/data-division="(\d)"/)![1])).toEqual(["0", "2"]);
  });

  it("الصحيح يحمل أيقونته ولفظه لقارئ الشاشة لا لونه وحده", () => {
    const html = renderBoardHtml(boardState({ items: [timeline(3)] }), { language: "English" });
    expect(html).toContain('data-mark-icon=""');
    expect(html).toContain(MARK_LABEL.correct.English);
    expect(html).toContain(MARK_LABEL.focus.English);
  });

  it("لا تُستمدّ الزخرفة إلا للتقسيمات الظاهرة", () => {
    decorate.mockClear();
    renderBoardHtml(boardState({ items: [timeline(2)] }), { language: "English" });

    const addresses = decorate.mock.calls.map(([, address]) => address);
    expect(addresses).toEqual([
      { scope: "division", index: 0 },
      { scope: "division", index: 1 },
    ]);
  });
});
