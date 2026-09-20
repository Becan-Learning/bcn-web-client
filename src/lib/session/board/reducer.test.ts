import { describe, expect, it } from "vitest";
import { parseBoardControlEvent } from "./parse";
import { teachingBoardReducer } from "./reducer";
import { INITIAL_BOARD_STATE, type BoardAction, type BoardState } from "./types";

/* المخفّض يُختبر من طرف الأسلاك لا من طرف الأنواع: كل رسالة تمرّ
   على المحلّل أوّلًا كما تمرّ في الجلسة الحقيقية، فيُغطّى العقد
   كلّه — الشكل والترتيب معًا. */

function apply(state: BoardState, ...messages: unknown[]) {
  return messages.reduce<BoardState>((acc, message) => {
    const event = parseBoardControlEvent(message);
    return teachingBoardReducer(acc, (event ?? { action: "board_reset" }) as BoardAction);
  }, state);
}

const add = (
  id: string,
  kind: string,
  payload: unknown,
  rev: number,
  region = "live",
  groupId: string | null = null,
) => ({ action: "board_add", id, kind, region, payload, group_id: groupId, rev });

const bullet = (id: string, rev: number, region = "live") =>
  add(id, "bullet", { text: "نقطة" }, rev, region);

describe("بوّابة المراجعة", () => {
  it("يطبّق الرسالة الأحدث ويُسقط ما دونها", () => {
    const state = apply(INITIAL_BOARD_STATE, bullet("a", 1), bullet("b", 3));
    expect(state.rev).toBe(3);

    /* رسالة بمراجعة أقدم لا تُطبَّق ولا تُغيّر المرجع */
    const stale = apply(state, bullet("c", 2));
    expect(stale).toBe(state);
    expect(stale.items).toHaveLength(2);
  });

  it("الفجوة ترفع راية التباعد ويُرسم ما وصل", () => {
    const state = apply(INITIAL_BOARD_STATE, bullet("a", 1), bullet("b", 5));
    expect(state.diverged).toBe(true);
    expect(state.items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("التتابع بلا فجوة لا يرفع الراية", () => {
    const state = apply(INITIAL_BOARD_STATE, bullet("a", 1), bullet("b", 2), bullet("c", 3));
    expect(state.diverged).toBe(false);
  });

  it("رسالة بلا rev صحيح تُرفض عند التحليل", () => {
    expect(parseBoardControlEvent({ action: "board_show" })).toBeNull();
    expect(parseBoardControlEvent({ action: "board_show", rev: "2" })).toBeNull();
    expect(parseBoardControlEvent({ action: "board_show", rev: 2 })).not.toBeNull();
  });
});

describe("المعرّف المجهول", () => {
  const base = apply(INITIAL_BOARD_STATE, bullet("a", 1));

  const unknown: [string, unknown][] = [
    ["board_update", { action: "board_update", id: "zz", text: "x", rev: 2 }],
    ["board_annotate", { action: "board_annotate", id: "zz", kind: "key", rev: 2 }],
    ["board_remove", { action: "board_remove", id: "zz", rev: 2 }],
    ["board_reveal", { action: "board_reveal", id: "zz", index: 1, rev: 2 }],
    ["board_pin", { action: "board_pin", id: "zz", pinned: true, region: "pinned", rev: 2 }],
  ];

  it.each(unknown)("%s على معرّف مجهول يُتجاهل بصمت ولا يرمي", (_name, message) => {
    const next = apply(base, message);
    expect(next.items).toBe(base.items);
    expect(next.title).toBe(base.title);
    /* والمراجعة تتقدّم رغم ذلك، وإلا بدت كل رسالة تالية فجوة */
    expect(next.rev).toBe(2);
    expect(next.diverged).toBe(false);
  });
});

describe("board_update", () => {
  it("بلا خانة يستبدل نصّ العنصر", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      bullet("a", 1),
      { action: "board_update", id: "a", text: "نصّ جديد", rev: 2 },
    );
    expect(state.items[0].payload).toEqual({ text: "نصّ جديد" });
  });

  it("بلا خانة لا يمسّ حمولةً بلا نصّ", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add("d", "definition", { chunks: ["أ", "ب"], key_words: [] }, 1),
      { action: "board_update", id: "d", text: "نصّ", rev: 2 },
    );
    expect(state.items[0].payload).toEqual({ chunks: ["أ", "ب"], keyWords: [] });
  });

  it("بخانة يملأ فراغًا ويصحّح خيارًا", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add("b", "blanks", { template: "النسبة = ___", blanks: [{ id: "ratio", fill: "2/3" }] }, 1),
      add("o", "options", { stem: "ليش؟", options: [{ id: "opt-a", text: "أ", correct: true }] }, 2),
      { action: "board_update", id: "b", slot: "ratio", text: "2/3", rev: 3 },
      { action: "board_update", id: "o", slot: "opt-a", state: "correct", rev: 4 },
    );

    expect(state.items[0].slots.ratio).toEqual({ text: "2/3" });
    expect(state.items[1].slots["opt-a"]).toEqual({ state: "correct" });
  });

  it("خانة وصلة السلسلة تصل عددًا فتُقرأ نصًّا", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add("c", "chain", { links: ["أ", "ب", "ج"], break_at: null }, 1),
      { action: "board_update", id: "c", slot: 2, state: "broken", rev: 2 },
    );
    expect(state.items[0].slots["2"]).toEqual({ state: "broken" });
  });

  it("الجواب لا يصل الصفحة عند الإضافة", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add("b", "blanks", { template: "___", blanks: [{ id: "r", fill: "سرّ" }] }, 1),
      add("o", "options", { stem: "س", options: [{ id: "x", text: "ج", correct: true }] }, 2),
    );

    expect(JSON.stringify(state)).not.toContain("سرّ");
    expect(JSON.stringify(state)).not.toContain("correct");
  });
});

describe("board_annotate", () => {
  it("يعيّن الحالة ويمسحها بـ kind: null", () => {
    const set = apply(
      INITIAL_BOARD_STATE,
      bullet("a", 1),
      { action: "board_annotate", id: "a", kind: "key", rev: 2 },
    );
    expect(set.items[0].annotation).toBe("key");

    const cleared = apply(set, { action: "board_annotate", id: "a", kind: null, rev: 3 });
    expect(cleared.items[0].annotation).toBeNull();
  });

  it("حالة مجهولة تُقرأ مسحًا لا تُرفض", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      bullet("a", 1),
      { action: "board_annotate", id: "a", kind: "key", rev: 2 },
      { action: "board_annotate", id: "a", kind: "غير-معروف", rev: 3 },
    );
    expect(state.items[0].annotation).toBeNull();
  });
});

describe("board_clear", () => {
  const filled = apply(
    INITIAL_BOARD_STATE,
    { action: "board_set_title", id: "t", text: "عنوان", rev: 1 },
    bullet("p", 2, "pinned"),
    bullet("l", 3, "live"),
    bullet("m", 4, "temporary"),
    { action: "board_group", id: "g", kind: "box", region: "live", heading: "ح", rev: 5 },
  );

  it("مسح الحيّ يُبقي المثبَّت والعنوان قائمَين", () => {
    const state = apply(filled, { action: "board_clear", scope: "live", rev: 6 });
    expect(state.items.map((i) => i.id)).toEqual(["p", "m"]);
    expect(state.title?.id).toBe("t");
    expect(state.groups).toHaveLength(0);
  });

  it("مسح المؤقّت يُبقي ما سواه", () => {
    const state = apply(filled, { action: "board_clear", scope: "temporary", rev: 6 });
    expect(state.items.map((i) => i.id)).toEqual(["p", "l"]);
  });

  it("مسح الكل يمسح العنوان معه، والظهور يبقى", () => {
    const state = apply(filled, { action: "board_clear", scope: "all", rev: 6 });
    expect(state.items).toHaveLength(0);
    expect(state.title).toBeNull();
    expect(state.visible).toBe(true);
  });

  it("غياب المدى يُقرأ «الكل» احتياطًا", () => {
    const state = apply(filled, { action: "board_clear", rev: 6 });
    expect(state.items).toHaveLength(0);
    expect(state.title).toBeNull();
  });
});

describe("board_reveal و board_pin", () => {
  it("الكشف يتقدّم ولا يتجاوز عدد المقاطع", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add("d", "definition", { chunks: ["أ", "ب", "ج"], key_words: [] }, 1),
    );
    expect(state.items[0].revealed).toBe(1);

    const two = apply(state, { action: "board_reveal", id: "d", index: 1, rev: 2 });
    expect(two.items[0].revealed).toBe(2);

    const clamped = apply(two, { action: "board_reveal", id: "d", index: 9, rev: 3 });
    expect(clamped.items[0].revealed).toBe(3);
  });

  it("التثبيت ينقل المنطقة ويبقي الموضع في المصفوفة", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      bullet("a", 1),
      bullet("b", 2),
      bullet("c", 3),
      { action: "board_pin", id: "b", pinned: true, region: "pinned", rev: 4 },
    );

    expect(state.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(state.items[1].region).toBe("pinned");
  });
});

describe("board_snapshot", () => {
  it("يحلّ محلّ كل شيء ويُنزل راية التباعد", () => {
    const diverged = apply(INITIAL_BOARD_STATE, bullet("a", 1), bullet("b", 9));
    expect(diverged.diverged).toBe(true);

    const state = apply(diverged, {
      action: "board_snapshot",
      rev: 22,
      visible: true,
      title: {
        id: "t",
        kind: "title",
        region: "live",
        payload: { text: "عنوان" },
        group_id: null,
        annotation: null,
        revealed: 1,
        slots: {},
      },
      groups: [{ id: "g", kind: "box", region: "pinned", heading: "مثال" }],
      items: [
        {
          id: "s",
          kind: "step",
          region: "pinned",
          payload: { text: "خطوة" },
          group_id: "g",
          annotation: "key",
          revealed: 1,
          slots: {},
        },
      ],
    });

    expect(state.diverged).toBe(false);
    expect(state.rev).toBe(22);
    expect(state.title?.id).toBe("t");
    expect(state.items.map((i) => i.id)).toEqual(["s"]);
    expect(state.items[0].annotation).toBe("key");
    expect(state.groups[0].heading).toBe("مثال");
  });

  it("عنصر تالف يسقط وحده ولا يُبطل اللقطة", () => {
    const state = apply(INITIAL_BOARD_STATE, {
      action: "board_snapshot",
      rev: 4,
      visible: true,
      title: null,
      groups: [],
      items: [
        { id: "ok", kind: "text", region: "live", payload: { text: "سليم" }, slots: {} },
        { id: "bad", kind: "text", region: "live", payload: {} },
      ],
    });

    expect(state.items.map((i) => i.id)).toEqual(["ok"]);
  });
});

describe("التحليل — حمولة تالفة تُسقط البند ولا تُفسد الحالة", () => {
  const malformed: [string, unknown][] = [
    ["definition بلا مقاطع", add("x", "definition", { chunks: [] }, 2)],
    ["term بنصف واحد", add("x", "term", { en: "obligation" }, 2)],
    ["equation بلا latex", add("x", "equation", { display: true }, 2)],
    ["compare بثلاثة أعمدة", add("x", "compare", { columns: ["أ", "ب", "ج"], rows: [] }, 2)],
    ["table بلا رأس", add("x", "table", { header: [], rows: [] }, 2)],
    ["chain بوصلة واحدة", add("x", "chain", { links: ["أ"] }, 2)],
    ["options بلا صلب", add("x", "options", { options: [] }, 2)],
    ["callout بنوع مجهول", add("x", "callout", { kind: "zzz", text: "ن" }, 2)],
    ["نوع غير معروف", add("x", "zzz", { text: "ن" }, 2)],
    ["منطقة غير معروفة", add("x", "text", { text: "ن" }, 2, "elsewhere")],
  ];

  it.each(malformed)("%s يُرفض", (_name, message) => {
    expect(parseBoardControlEvent(message)).toBeNull();
  });

  it("الخليّة الفارغة مشروعة، والصفّ يُسوّى إلى طول الرأس", () => {
    const state = apply(
      INITIAL_BOARD_STATE,
      add(
        "t",
        "table",
        {
          variant: "journal",
          header: ["Account", "Debit", "Credit"],
          rows: [["Cash", "120,000", ""], ["Revenue"]],
        },
        1,
      ),
    );

    const payload = state.items[0].payload as { rows: string[][] };
    expect(payload.rows[0]).toEqual(["Cash", "120,000", ""]);
    expect(payload.rows[1]).toEqual(["Revenue", "", ""]);
  });

  it("النصّ يصل كما هو بلا تشذيب ولا قصّ", () => {
    const long = "ـ".repeat(400);
    const state = apply(INITIAL_BOARD_STATE, add("x", "text", { text: `  ${long}  ` }, 1));
    expect(state.items[0].payload).toEqual({ text: `  ${long}  ` });
  });
});

describe("board_reset", () => {
  it("يعيد الحالة إلى أوّلها بعدّادها", () => {
    const state = apply(INITIAL_BOARD_STATE, bullet("a", 1), bullet("b", 7));
    const reset = teachingBoardReducer(state, { action: "board_reset" });

    expect(reset).toBe(INITIAL_BOARD_STATE);
    expect(reset.rev).toBe(0);
    expect(reset.diverged).toBe(false);
  });
});
