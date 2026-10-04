import { describe, expect, it } from "vitest";
import type { TimelinePayload } from "@/lib/session/teaching-board";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";

/* حمولة `add-timeline` من board-fixtures.json */
const payload = (progressive: boolean): TimelinePayload => ({
  axisLabel: "تحويل الوحدات",
  divisions: ["المعطى", "معامل التحويل", "النتيجة"],
  markers: [
    { id: "marker-given", at: 0, label: "300 cm", pen: null },
    { id: "marker-factor", at: 1, label: null, pen: "construct" },
    { id: "marker-answer", at: 2, label: "3 m", pen: "flow" },
  ],
  progressive,
});

const render = (revealed: number | null, progressive: boolean, pen: "construct" | null = "construct") =>
  renderBoardHtml(
    boardState({
      items: [
        boardItem("timeline", payload(progressive), {
          id: "board-timeline",
          pen,
          ...(revealed === null ? {} : { revealed }),
        }),
      ],
    }),
    { language: "Arabic" },
  );

const marker = (html: string, id: string) => html.match(new RegExp(`<li data-marker="${id}"[^>]*>`))?.[0];

describe("المخطّط الزمني", () => {
  it("بلا كشف تدريجي: كل التقسيمات وواصقاتها بالترتيب", () => {
    const html = render(null, false);

    expect(html.indexOf("المعطى")).toBeGreaterThan(0);
    expect(html.indexOf("المعطى")).toBeLessThan(html.indexOf("معامل التحويل"));
    expect(html.indexOf("معامل التحويل")).toBeLessThan(html.indexOf("النتيجة"));
    expect(html).toContain("300 cm");
    expect(html).toContain("3 m");
    expect(html).toContain('data-division="0"');
    expect(html).toContain('data-division="2"');
  });

  it("المحور من اليسار إلى اليمين على الحاوية الممرِّرة، ووسم كل تقسيم باتجاهه", () => {
    const html = render(null, false);
    const scroller = html.match(/<div dir="ltr" role="group"[^>]*>/)?.[0] ?? "";

    expect(scroller).toContain("overflow-x-auto");
    expect(scroller).toContain('tabindex="0"');
    expect(scroller).toContain("aria-labelledby");
    expect(html.match(/<p dir="auto" class="[^>]*font-semibold/g)).toHaveLength(3);
  });

  it("الحاوية الممرِّرة محدودة العرض ولا تتجاوز عرض أبيها", () => {
    const html = render(null, false);
    expect(html).toContain("max-w-full overflow-x-auto");
    expect(html).toContain("min-width:21rem");
  });

  it("الكشف التدريجي: التقسيم الأوّل وواصقه فقط في الصفحة", () => {
    const html = render(1, true);

    expect(html).toContain("المعطى");
    expect(html).toContain("300 cm");
    expect(html).not.toContain("معامل التحويل");
    expect(html).not.toContain("النتيجة");
    expect(html).not.toContain("3 m");
    expect(html).not.toContain("marker-factor");
    expect(html).not.toContain("marker-answer");
    expect(html).not.toContain('data-division="1"');
    /* المساحة محجوزة لكل التقسيمات */
    expect(html).toContain("repeat(3, minmax(0, 1fr))");
    expect(html).toContain("min-width:21rem");
  });

  it("كل كشفٍ يضيف تقسيمه وواصقه", () => {
    const second = render(2, true);
    expect(second).toContain("معامل التحويل");
    expect(marker(second, "marker-factor")).toBeDefined();
    expect(second).not.toContain("النتيجة");
    expect(second).not.toContain("marker-answer");

    const third = render(3, true);
    expect(third).toContain("النتيجة");
    expect(third).toContain("3 m");
  });

  it("الخطّ لا يمتدّ إلى ما لم ينكشف", () => {
    expect(render(1, true)).not.toContain("data-timeline-line");
    expect(render(2, true)).toContain("width:33.333333333333336%");
    expect(render(3, true)).toContain("width:66.66666666666667%");
  });

  it("قلم الواصق يغلب قلم البند، وغيابه يرث قلم البند", () => {
    const html = render(null, false, "construct");

    expect(marker(html, "marker-given")).toContain('data-pen="construct"');
    expect(marker(html, "marker-factor")).toContain('data-pen="construct"');
    expect(marker(html, "marker-answer")).toContain('data-pen="flow"');
  });

  it("بلا قلم للواصق ولا للبند لا قلم", () => {
    const html = render(null, false, null);

    expect(marker(html, "marker-given")).not.toContain("data-pen");
    expect(marker(html, "marker-factor")).toContain('data-pen="construct"');
    expect(marker(html, "marker-answer")).toContain('data-pen="flow"');
  });

  it("الواصق بلا وسم لا يحمل نصًّا ويخفى عن قارئ الشاشة", () => {
    const html = render(null, false);
    expect(marker(html, "marker-factor")).toContain('aria-hidden="true"');
    expect(marker(html, "marker-factor")).toContain('data-marker-dot=""');
    expect(marker(html, "marker-factor")).toContain("size-3 rounded-pill");
    expect(html).toMatch(/<li data-marker="marker-factor"[^>]*><\/li>/);
  });

  it("وسم المحور يُرسم قبل المحور", () => {
    const html = render(null, false);
    expect(html.indexOf("تحويل الوحدات")).toBeLessThan(html.indexOf('data-division="0"'));
  });

  it("واصقٌ على تقسيمٍ خارج النطاق لا يُرسم ولا يكسر", () => {
    const html = renderBoardHtml(
      boardState({
        items: [
          boardItem("timeline", {
            ...payload(false),
            markers: [{ id: "stray", at: 9, label: "تائه", pen: null }],
          }),
        ],
      }),
      { language: "English" },
    );
    expect(html).not.toContain("تائه");
  });
});
