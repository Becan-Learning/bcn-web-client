import { describe, expect, it } from "vitest";
import type { BoardGroup, BoardItem, Stage } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";
import {
  ANNOTATION_LABEL,
  BAND_LABEL,
  BLANK_LABEL,
  EXAMPLE_LABEL,
  STAGE_LABEL,
  UNKNOWN_ICON_LABEL,
  UNSUPPORTED_LABEL,
} from "./labels";
import { boardGroup, boardItem, boardState, renderBoardHtml, visibleText } from "./test-utils";

const LANGUAGES: ExplanationLanguage[] = ["Arabic", "English"];

const step = (text: string, overrides: Partial<BoardItem> = {}) =>
  boardItem("step", { text }, { id: `step-${text}`, ...overrides });

/** ما بين علامتين من الصفحة المرسومة — لعزل منطقة واحدة */
function between(html: string, from: string, to: string): string {
  const start = html.indexOf(from);
  expect(start, `missing ${from}`).toBeGreaterThanOrEqual(0);
  const end = to ? html.indexOf(to, start + from.length) : -1;
  return html.slice(start, end < 0 ? undefined : end);
}

const count = (html: string, needle: string) => html.split(needle).length - 1;

/** الصفحة المرسومة تهرب الفاصلة العليا */
const escaped = (text: string) => text.replaceAll("'", "&#x27;");

describe("مجموعات المثال والمراحل", () => {
  const stages: [Stage, string][] = [
    ["worked", "solid"],
    ["faded", "dashed"],
    ["try", "dotted"],
  ];

  it.each(LANGUAGES.flatMap((language) => stages.map(([stage, pattern]) => [language, stage, pattern] as const)))(
    "مثال في المرحلة %s/%s بوسم المثال ووسم المرحلة وإطارها",
    (language, stage, pattern) => {
      const html = renderBoardHtml(
        boardState({
          groups: [boardGroup({ id: "g", kind: "example", heading: "حوّل 300 cm إلى m", stage })],
          items: [step("المعطى", { groupId: "g" })],
        }),
        { language },
      );

      expect(html).toContain('data-board-group="example"');
      expect(html).toContain(`data-stage="${stage}"`);
      expect(html).toContain('data-group-badge="example"');
      expect(html).toContain(EXAMPLE_LABEL[language]);
      expect(html).toContain(`data-group-badge="${stage}"`);
      expect(html).toContain(escaped(STAGE_LABEL[stage][language]));
      /* الوسم يكرّر نمط الإطار فيُقرأ المرحلة دون لون */
      expect(between(html, `data-group-badge="${stage}"`, "</span>")).toContain(`border-${pattern}`);
      /* لا فراغات تُخترع من المرحلة */
      expect(html).not.toContain(BLANK_LABEL[language]);
      expect(visibleText(html)).toContain("حوّل 300 cm إلى m");
    },
  );

  it("لغة الشرح تحدّد لغة الوسم لا لغة الواجهة", () => {
    const state = boardState({
      groups: [boardGroup({ id: "g", kind: "example", stage: "try" })],
      items: [step("س", { groupId: "g" })],
    });

    expect(renderBoardHtml(state, { language: "Arabic" })).toContain(STAGE_LABEL.try.Arabic);
    expect(renderBoardHtml(state, { language: "Arabic" })).not.toContain(STAGE_LABEL.try.English);
    expect(renderBoardHtml(state, { language: "English" })).toContain(escaped(STAGE_LABEL.try.English));
  });

  it("المرحلة تصحّ على كل أنواع الحاويات", () => {
    const kinds: BoardGroup["kind"][] = ["box", "columns", "example", "scenario"];
    for (const kind of kinds) {
      const html = renderBoardHtml(
        boardState({
          groups: [boardGroup({ id: "g", kind, stage: "faded" })],
          items: [step("س", { groupId: "g" })],
        }),
        { language: "English" },
      );
      expect(html, kind).toContain(`data-board-group="${kind}"`);
      expect(html, kind).toContain('data-stage="faded"');
      expect(html, kind).toContain(escaped(STAGE_LABEL.faded.English));
    }
  });

  it("الحاوية بلا مرحلة لا تحمل وسم مرحلة ولا data-stage", () => {
    const html = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g", kind: "box", stage: null })],
        items: [step("س", { groupId: "g" })],
      }),
      { language: "English" },
    );
    expect(html).not.toContain("data-stage");
    expect(html).not.toContain("data-group-badge");
  });

  it("المثال حاوية كاملة تختلف عن نداء مثال مفرد", () => {
    const group = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g", kind: "example", stage: null })],
        items: [step("س", { groupId: "g" })],
      }),
      { language: "English" },
    );
    const callout = renderBoardHtml(
      boardState({ items: [boardItem("callout", { kind: "example", text: "مثال" })] }),
      { language: "English" },
    );
    expect(group).toContain("data-group-badge");
    expect(callout).not.toContain("data-group-badge");
    expect(callout).not.toContain("data-board-group");
  });

  it("الأعمدة تتكدّس تحت عنوانها وتتجاور على الشاشة العريضة", () => {
    const html = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g", kind: "columns", heading: "مقارنة" })],
        items: [step("عمود-أول", { groupId: "g" }), step("عمود-ثان", { groupId: "g" })],
      }),
      { language: "Arabic" },
    );
    const group = between(html, 'data-board-group="columns"', "");
    expect(group.indexOf("مقارنة")).toBeLessThan(group.indexOf("عمود-أول"));
    expect(group).toContain("grid-cols-1");
    expect(group).toContain("md:grid-cols-2");
  });
});

describe("إسقاط الحاوية على المناطق", () => {
  const grouped = (region: "live" | "pinned" | "temporary") =>
    boardState({
      groups: [boardGroup({ id: "g", heading: "تحويل الوحدات" })],
      items: [step("المعطى", { groupId: "g", region })],
    });

  it("العضو المثبَّت يحمل عنوان حاويته وإطارها في الشريط المثبَّت", () => {
    const html = renderBoardHtml(grouped("pinned"), { language: "Arabic" });
    const pinned = between(html, `aria-label="${BAND_LABEL.pinned.Arabic}"`, 'tabindex="0"');

    expect(pinned).toContain('data-board-group="box"');
    expect(pinned).toContain("تحويل الوحدات");
    expect(pinned).toContain("المعطى");
    /* العنوان لا يتكرّر في الحيّ فارغًا */
    expect(count(html, "تحويل الوحدات")).toBe(1);
  });

  it("بعد مسح الحاوية يُرسم العضو بلا حاوية", () => {
    const state = grouped("pinned");
    const html = renderBoardHtml({ ...state, groups: [] }, { language: "Arabic" });
    const pinned = between(html, `aria-label="${BAND_LABEL.pinned.Arabic}"`, 'tabindex="0"');

    expect(pinned).toContain("المعطى");
    expect(pinned).not.toContain("data-board-group");
    expect(html).not.toContain("تحويل الوحدات");
  });

  it("الحاوية تُسقَط في كل منطقة يسكنها أعضاؤها", () => {
    const state = boardState({
      groups: [boardGroup({ id: "g", heading: "تحويل الوحدات" })],
      items: [
        step("أ", { groupId: "g", region: "pinned" }),
        step("ب", { groupId: "g", region: "live" }),
      ],
    });
    const html = renderBoardHtml(state, { language: "English" });
    expect(count(html, 'data-board-group="box"')).toBe(2);
    expect(count(html, "تحويل الوحدات")).toBe(2);
  });

  it("الحاوية الفارغة تُرسم عنوانها وحده لا صندوقًا فارغًا", () => {
    const html = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g", heading: "عنوان وحده" })],
        items: [step("بند ما")],
      }),
      { language: "Arabic" },
    );
    const group = between(html, 'data-board-group="box"', "");
    expect(group).toContain("عنوان وحده");
    expect(group).not.toContain("<ul");
  });

  it("حاوية الشريط المثبَّت الفارغة لا تُرسم", () => {
    const html = renderBoardHtml(
      boardState({
        groups: [boardGroup({ id: "g", region: "pinned", heading: "مرجع فارغ" })],
        items: [step("حيّ")],
      }),
      { language: "Arabic" },
    );
    expect(html).not.toContain("مرجع فارغ");
  });
});

describe("الإعلانات", () => {
  it("لكل منطقة منطقة إعلانٍ مهذَّبة تبقى في الصفحة وإن فرغت", () => {
    const html = renderBoardHtml(boardState({ items: [step("س")] }), { language: "English" });
    expect(count(html, 'aria-live="polite"')).toBe(3);
    expect(html).toContain(`aria-label="${BAND_LABEL.pinned.English}"`);
    expect(html).toContain(`aria-label="${BAND_LABEL.temporary.English}"`);
  });

  it("المنطقة الفارغة لا تأخذ إطارًا ولا حشوًا", () => {
    const html = renderBoardHtml(boardState({ items: [step("س")] }), { language: "English" });
    const pinned = between(html, `aria-label="${BAND_LABEL.pinned.English}"`, 'tabindex="0"');
    expect(pinned).not.toContain("border");
  });

  it("المثبَّت والمؤقّت يظهران بإطارهما حين يسكنهما بند", () => {
    const html = renderBoardHtml(
      boardState({
        items: [
          step("ثابت", { region: "pinned" }),
          step("جانبي", { region: "temporary" }),
        ],
      }),
      { language: "English" },
    );
    expect(between(html, `aria-label="${BAND_LABEL.pinned.English}"`, 'tabindex="0"')).toContain("ثابت");
    expect(between(html, `aria-label="${BAND_LABEL.temporary.English}"`, "")).toContain("جانبي");
    expect(between(html, `aria-label="${BAND_LABEL.temporary.English}"`, "")).toContain("border-dashed");
  });
});

describe("عنوان السبورة", () => {
  it.each(LANGUAGES)("يرسم حالته بإطارها ولفظها (%s)", (language) => {
    const html = renderBoardHtml(
      boardState({
        title: boardItem("title", { text: "4 · تحويل الوحدات" }, { id: "title", annotation: "warning" }),
        items: [step("س")],
      }),
      { language },
    );
    const title = between(html, "data-board-title", 'aria-live="polite"');

    expect(visibleText(title)).toContain("4 · تحويل الوحدات");
    expect(title).toContain(ANNOTATION_LABEL.warning![language]);
    expect(title).toContain("border-warmth");
  });

  it("حالة key على العنوان تعلَن للتقنيات المساعدة", () => {
    const html = renderBoardHtml(
      boardState({
        title: boardItem("title", { text: "عنوان" }, { id: "title", annotation: "key" }),
        items: [step("س")],
      }),
      { language: "Arabic" },
    );
    expect(between(html, "data-board-title", 'aria-live="polite"')).toContain("aria-current");
  });

  it("بلا حالة لا يظهر إطار ولا لفظ", () => {
    const html = renderBoardHtml(
      boardState({ title: boardItem("title", { text: "عنوان" }, { id: "title" }), items: [step("س")] }),
      { language: "Arabic" },
    );
    const title = between(html, "data-board-title", 'aria-live="polite"');
    expect(title).not.toContain("sr-only");
    expect(title).not.toContain("aria-current");
  });
});

describe("الأيقونات والمشهد", () => {
  const icon = (id: string, attachTo: string | null, label: string, icon = "ruler", overrides: Partial<BoardItem> = {}) =>
    boardItem("icon", { icon, label, attachTo }, { id, groupId: "scene", ...overrides });
  const scene = [boardGroup({ id: "scene", kind: "scenario", heading: "الطول والكتلة والزمن" })];

  const fixtureItems = () => [
    icon("board-icon-length", null, "الطول — متر (m)", "ruler", { pen: "construct" }),
    icon("board-icon-mass", "board-icon-length", "الكتلة — كيلوجرام (kg)", "scale_justice", { pen: "alt" }),
    icon("board-icon-time", "board-icon-mass", "الزمن — ثانية (s)", "clock", { pen: "flow" }),
  ];

  const units = (html: string) => {
    const starts = [...html.matchAll(/data-icon-unit=""/g)].map((match) => match.index!);
    return starts.map((start, i) => html.slice(start, starts[i + 1]));
  };

  it("وحدات الأيقونات بترتيب الإضافة، والملصَقة موسومة بهدفها", () => {
    const html = renderBoardHtml(boardState({ groups: scene, items: fixtureItems() }), {
      language: "Arabic",
    });
    const rendered = units(html);

    expect(rendered).toHaveLength(3);
    expect(rendered[0]).toContain("الطول");
    expect(rendered[1]).toContain("الكتلة");
    expect(rendered[2]).toContain("الزمن");
    expect(rendered[0]).not.toContain("data-attached-to");
    expect(rendered[1]).toContain('data-attached-to="board-icon-length"');
    expect(rendered[2]).toContain('data-attached-to="board-icon-mass"');
    expect(html).toContain('data-board-group="scenario"');
    expect(count(html, "data-icon-cluster")).toBe(1);
    expect(html).toContain("flex-wrap");
  });

  it("الرسم والوسم داخل عنصر وحدةٍ واحد وبهذا الترتيب", () => {
    const html = renderBoardHtml(boardState({ groups: scene, items: fixtureItems() }), {
      language: "English",
    });
    const labels = ["الطول", "الكتلة", "الزمن"];
    units(html).forEach((unit, i) => {
      expect(unit.indexOf("data-icon-glyph")).toBeGreaterThan(0);
      expect(unit.indexOf("data-icon-glyph")).toBeLessThan(unit.indexOf(labels[i]));
      /* الوحدة لا تحمل وسم أيقونة أخرى */
      labels.filter((_, j) => j !== i).forEach((other) => expect(unit).not.toContain(other));
    });
    expect(html).toContain('data-icon-pen="construct"');
    expect(html).toContain('data-icon-pen="alt"');
    expect(html).toContain('data-icon-pen="flow"');
  });

  it("بعد حذف الهدف تسقط التالية إلى التدفّق العادي", () => {
    const [, mass, time] = fixtureItems();
    const html = renderBoardHtml(boardState({ groups: scene, items: [mass, time] }), {
      language: "Arabic",
    });
    const rendered = units(html);

    expect(rendered).toHaveLength(2);
    expect(rendered[0]).not.toContain("data-attached-to");
    expect(rendered[1]).toContain('data-attached-to="board-icon-mass"');
  });

  it("الهدف في حاوية أخرى أو منطقة أخرى لا يُلصَق به", () => {
    const [length, mass] = fixtureItems();
    const otherGroup = renderBoardHtml(
      boardState({
        groups: [...scene, boardGroup({ id: "other", kind: "box" })],
        items: [{ ...length, groupId: "other" }, mass],
      }),
      { language: "Arabic" },
    );
    expect(otherGroup).not.toContain("data-attached-to");

    const otherRegion = renderBoardHtml(
      boardState({ groups: scene, items: [{ ...length, region: "pinned" }, mass] }),
      { language: "Arabic" },
    );
    expect(otherRegion).not.toContain("data-attached-to");
  });

  it("الاسم المجهول يُرسم حاملَ مكانٍ بلفظه ويبقى الوسم", () => {
    const html = renderBoardHtml(
      boardState({
        items: [boardItem("icon", { icon: "not_in_catalogue", label: "الطول — متر (m)", attachTo: null })],
      }),
      { language: "Arabic" },
    );
    expect(html).toContain("data-icon-placeholder");
    expect(html).toContain(`aria-label="${UNKNOWN_ICON_LABEL.Arabic}"`);
    expect(visibleText(html)).toContain("الطول — متر (m)");
  });

  it("اسم يطابق خاصية موروثة يعامَل مجهولًا", () => {
    const html = renderBoardHtml(
      boardState({ items: [boardItem("icon", { icon: "constructor", label: "س", attachTo: null })] }),
      { language: "English" },
    );
    expect(html).toContain(`aria-label="${UNKNOWN_ICON_LABEL.English}"`);
  });

  it("الاسم المعروف يُرسم حاملَ تحميلٍ صامتًا ثم الرسم", () => {
    const html = renderBoardHtml(
      boardState({ items: [boardItem("icon", { icon: "ruler", label: "الطول", attachTo: null })] }),
      { language: "English" },
    );
    expect(html).toContain("data-icon-placeholder");
    expect(html).not.toContain(UNKNOWN_ICON_LABEL.English);
    expect(html).toContain("الطول");
  });
});

describe("النوع غير المدعوم", () => {
  it.each(LANGUAGES)("يُرسم بطاقةً محايدة بوسمها (%s)", (language) => {
    const html = renderBoardHtml(
      boardState({ items: [boardItem("unsupported", { wireKind: "hologram" })] }),
      { language },
    );
    expect(html).toContain(UNSUPPORTED_LABEL[language]);
    expect(html).toContain('data-wire-kind="hologram"');
  });
});
