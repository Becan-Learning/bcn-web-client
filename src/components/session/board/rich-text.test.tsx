import { describe, expect, it } from "vitest";
import fixtures from "@/lib/session/board/__fixtures__/board-fixtures.json";
import type { BoardItem, Mark } from "@/lib/session/teaching-board";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";

/* العرض الحقيقي للوح من حالةٍ مبنيّة بالبُناة. نصوص الحمولات منسوخة
   من لقطات العقد (الخادم 62d9b47) كما هي؛ والمحلّل يخصّ مسارًا آخر. */

type Packet = {
  action: string;
  id?: string;
  kind?: string;
  payload?: Record<string, unknown>;
};

function fixturePayload(fixture: string, id: string): Record<string, unknown> {
  const found = (fixtures.fixtures as { name: string; messages: Packet[] }[]).find(
    (f) => f.name === fixture,
  );
  const packet = found?.messages.find((m) => m.action === "board_add" && m.id === id);
  if (!packet?.payload) throw new Error(`fixture ${fixture}/${id} missing`);
  return packet.payload;
}

const AR = { language: "Arabic" } as const;
const EN = { language: "English" } as const;

function render(items: BoardItem[], options: typeof AR | typeof EN = AR) {
  return renderBoardHtml(boardState({ items }), options);
}

function spanMark(match: string, state: Mark["state"]): Mark {
  return { scope: "span", index: null, cell: null, option: null, match, state };
}

function text(value: string, overrides: Parameters<typeof boardItem>[2] = {}) {
  return boardItem("text", { text: value }, overrides);
}

function count(html: string, needle: string) {
  return html.split(needle).length - 1;
}

describe("العزل الاتجاهي (§4.3)", () => {
  const specimen = fixturePayload("bidi-numbers", "board-bidi-reference").text as string;
  const signed = fixturePayload("bidi-numbers", "board-bidi-signed").text as string;

  it("يعزل conversion factor والمعادلة الأخيرة تتابعين كاملين", () => {
    expect(specimen).toBe("نحوّل الـ conversion factor فنحصل على 1 cm² = 10⁻⁴ m²");
    const html = render([text(specimen)]);

    expect(html).toContain("<bdi dir=\"ltr\">conversion factor</bdi>");
    expect(html).toContain("<bdi dir=\"ltr\">1 cm² = 10⁻⁴ m²</bdi>");
    expect(count(html, "<bdi")).toBe(2);
  });

  it("يبقي الرقم ذا الإشارة المفصولة وسهمه تتابعًا واحدًا بلا تغيير", () => {
    const html = render([text(signed)]);

    expect(html).toContain("<bdi dir=\"ltr\">− 2 ⇒ −4</bdi>");
    expect(count(html, "<bdi")).toBe(1);
    /* النثر العربي قبله خارج العزل */
    expect(html).toContain("الأس تضاعف: <bdi");
  });

  it("يحفظ الأرقام المؤلَّفة حرفيًا والأسهم كما كُتبت", () => {
    const html = render([
      text(fixturePayload("bidi-numbers", "board-bidi-numbers").text as string),
      text(fixturePayload("bidi-numbers", "board-bidi-arrow").text as string),
    ]);

    expect(html).toContain("<bdi dir=\"ltr\">120,000 SAR</bdi>");
    expect(html).toContain("<bdi dir=\"ltr\">0.04 m</bdi>");
    expect(html).toContain("<bdi dir=\"ltr\">1000</bdi>");
    expect(html).toContain("الطول ← <bdi dir=\"ltr\">m</bdi>");
    expect(html).not.toMatch(/١|٢|٣|٤|٥|٦|٧|٨|٩|٠/);
  });

  it("يحتوي القوس مع تتابعه فلا ينقسم القوسان على اتجاهين", () => {
    const html = render([text("الطول — متر (m) والكتلة (kg)")]);

    expect(html).toContain("<bdi dir=\"ltr\">(m)</bdi>");
    expect(html).toContain("<bdi dir=\"ltr\">(kg)</bdi>");
  });

  it("يترك نقطة نهاية الجملة والرمز المعلّق للنثر المحيط", () => {
    const html = render([text("الناتج 5 m. ثم x = ناتج")]);

    expect(html).toContain("<bdi dir=\"ltr\">5 m</bdi>.");
    expect(html).toContain("<bdi dir=\"ltr\">x</bdi> = ناتج");
  });

  it("يشمل رموز الوحدات اليونانية والنسبة بين رقمين", () => {
    const html = render([text("المسافة 1 μm = 10⁻⁶ m والنسبة 1:2")]);

    expect(html).toContain("<bdi dir=\"ltr\">1 μm = 10⁻⁶ m</bdi>");
    expect(html).toContain("<bdi dir=\"ltr\">1:2</bdi>");
  });

  it("يحدّد اتجاه المحضن من النثر خارج العزل لا من التتابع", () => {
    const html = render([text("m/s هي وحدة السرعة")]);

    expect(html).toMatch(/<p dir="auto"[^>]*><bdi dir="ltr">m\/s<\/bdi> هي/);
  });
});

describe("الوسوم (§4.1)", () => {
  const showcase = fixturePayload("markup-showcase", "board-text-markup").text as string;

  it("يحوّل كل وسمٍ إلى عنصر ولا يُبقي علامةً حرفية", () => {
    const html = render([text(showcase, { pen: "construct" })]);
    const visible = html.replace(/<[^>]+>/g, "");

    for (const marker of ["**", "==", "~~", "^{", "_{", "{mark}", "{construct}"]) {
      expect(visible).not.toContain(marker);
    }
    expect(html).toContain("<strong class=\"font-bold\">conversion factor</strong>");
    expect(html).toMatch(/<u class=/);
    expect(html).toContain("<s class=");
    expect(html).toContain("<sub>n+1</sub>");
    expect(html).toContain("<sup>-kt</sup>");
  });

  it("يغلّف التتابع كاملًا وبداخله القطع المنسَّقة", () => {
    const html = render([text(showcase, { pen: "construct" })]);

    expect(html).toContain("<bdi dir=\"ltr\">x<sub>n+1</sub> e<sup>-kt</sup> 1 cm<sup>2</sup> = 10<sup>-4</sup> m<sup>2</sup>");
    expect(html).toContain("<bdi dir=\"ltr\"><strong class=\"font-bold\">conversion factor</strong></bdi>");
  });

  it("يعطي الأقلام الخمسة المسمّاة خمس قيم data-pen والمجرّد قلم البند", () => {
    const html = render([text(showcase, { pen: "construct" })]);

    for (const pen of ["mark", "construct", "flow", "trap", "alt"]) {
      expect(html).toMatch(new RegExp(`<mark data-pen="${pen}" data-mark-highlight=""[^>]*>[1-5]</mark>`));
    }
    /* ==ناتج== بلا قلم: قلم البند construct */
    expect(html).toMatch(/<mark data-pen="construct" data-mark-highlight=""[^>]*>ناتج<\/mark>/);
  });

  it("يستعمل قلم mark الافتراضي حين لا قلم للبند", () => {
    const html = render([text("هذا ==مهم== جدًا")]);

    expect(html).toMatch(/<mark data-pen="mark" data-mark-highlight=""[^>]*>مهم<\/mark>/);
  });

  it("يرسم وسوم النقطة وأبنائها", () => {
    const payload = fixturePayload("markup-showcase", "board-bullet-markup");
    const html = render([
      boardItem("bullet", { text: payload.text as string, children: payload.children as string[] }),
    ]);

    expect(html).toContain("<strong class=\"font-bold\">الطول</strong>");
    expect(html).toMatch(/<u class=/);
    expect(html).toMatch(/<mark data-pen="alt"[^>]*>الزمن<\/mark>/);
    expect(html).not.toContain("=={alt}");
  });

  it("يبقي الوسم غير المغلق أو الفارغ أو ذا القلم المجهول حرفيًا", () => {
    const html = render([
      text("a **b و ==c", { id: "unclosed" }),
      text("فارغ **** و ====", { id: "empty" }),
      text("قلم =={nope}d==", { id: "unknown-pen" }),
    ]);
    const visible = html.replace(/<[^>]+>/g, "");

    expect(visible).toContain("a **b و ==c");
    expect(visible).toContain("فارغ **** و ====");
    expect(visible).toContain("قلم =={nope}d==");
    expect(html).not.toContain("<mark");
    expect(html).not.toContain("<strong");
  });

  it("لا يفسّر ___ تسطيرًا حين لا فراغ يُرسم", () => {
    const html = render([text("وحدة الكتلة ___ و ___")]);

    expect(html).not.toMatch(/<u[ >]/);
    expect(html).toContain("___ و ___");
  });
});

describe("علامات المقاطع (§6)", () => {
  const base = "المطلوب: حوّل 300 cm إلى m ثم 300 cm";

  it("تعلّم كل ظهورٍ حرفي، حسّاسةً لحالة الأحرف", () => {
    const html = render([
      text("Cm و cm و cm", { marks: [spanMark("cm", "highlight")] }),
    ]);

    expect(count(html, "data-mark-highlight")).toBe(2);
  });

  it("لا تغيّر الصفحة حين لا مطابقة", () => {
    const plain = render([text(base, { pen: "mark" })]);
    const marked = render([text(base, { pen: "mark", marks: [spanMark("غير موجود", "wrong")] })]);

    expect(marked).toBe(plain);
  });

  it("تطابق النص الظاهر لا المصدر، عبر حدود الوسوم", () => {
    const html = render([
      text("حوّل **300** cm الآن", { marks: [spanMark("300 cm", "highlight")] }),
    ]);

    expect(html).toContain("data-mark-highlight");
    expect(html.replace(/<[^>]+>/g, "")).not.toContain("**");
  });

  it("يعزل المطابقة داخل تتابعها: العلامة داخل bdi لا حوله", () => {
    const html = render([
      text(base, { marks: [spanMark("300 cm", "highlight")] }),
    ]);

    expect(html).toMatch(/<bdi dir="ltr"><span [^>]*data-mark-highlight=""[^>]*>300 cm<\/span><\/bdi>/);
  });

  it("يخفت التركيز بقية الحقل وحده ويُبقي الهدف بارزًا", () => {
    const focused = render([text(base, { marks: [spanMark("300 cm", "focus")] })]);
    const sibling = render([text("بند آخر")]);

    expect(focused).toMatch(/<span [^>]*data-mark-focus=""[^>]*>300 cm<\/span>/);
    expect(focused).toContain("<span data-mark-dimmed-by-focus=\"\">المطلوب: حوّل </span>");
    expect(focused).not.toMatch(/data-mark-dimmed-by-focus=""[^>]*>300 cm/);
    expect(sibling).not.toContain("data-mark");
  });

  it("لا يخفت التركيز حقلًا آخر لا مطابقة فيه", () => {
    const html = render([
      boardItem("bullet", { text: "ab و xy", children: ["cd"] }, { marks: [spanMark("ab", "focus")] }),
    ]);

    expect(html).toContain("<span data-mark-dimmed-by-focus=\"\"> و </span>");
    expect(html).not.toMatch(/data-mark-dimmed-by-focus=""[^>]*>[^<]*cd/);
    expect(html).toContain("cd");
  });

  it("يبقي صليب الخطأ تحت الإبراز اللاحق ويضيف لفظًا مخفيًا", () => {
    const html = render([
      text(base, {
        marks: [spanMark("300 cm", "wrong"), spanMark("300 cm", "highlight")],
      }),
    ]);

    expect(html).toContain("data-mark-answer=\"wrong\"");
    expect(html).toContain("data-mark-highlight");
    expect(html).toContain("data-mark-icon");
    expect(html).toContain("إجابة خاطئة");
  });

  it("يترك الأحدث يغلب في الصحيح والخطأ", () => {
    const html = render([
      text(base, { marks: [spanMark("m ثم", "wrong"), spanMark("m ثم", "correct")] }),
    ]);

    expect(html).toContain("data-mark-answer=\"correct\"");
    expect(html).not.toContain("data-mark-answer=\"wrong\"");
  });

  it("يرسم أيقونة واحدة للمدى المقطوع عند حدّ التتابع", () => {
    const html = render([
      text("المطلوب: حوّل 300 cm إلى m", { marks: [spanMark("حوّل 300 cm", "correct")] }),
    ]);

    expect(count(html, "data-mark-icon")).toBe(1);
    expect(count(html, "data-mark-answer=\"correct\"")).toBe(2);
    expect(count(html, "data-rt-continued")).toBe(1);
  });

  it("يرسل اللفظ المخفي بلغة الشرح وبالأخرى للغلاف", () => {
    const html = render([
      text(base, { marks: [spanMark("300 cm", "correct")] }),
    ]);

    expect(html).toContain("إجابة صحيحة");
    expect(html).toContain("data-cue-lang=\"en\"");
  });

  it("لا يبحث عبر الحقول: بين الأب والابن وبين نصفي المصطلح", () => {
    const html = render([
      boardItem("bullet", { text: "ab", children: ["cd"] }, { marks: [spanMark("bc", "highlight")] }),
      boardItem("term", { en: "ab", ar: "cd" }, { id: "t", marks: [spanMark("bc", "highlight")] }),
    ]);

    expect(html).not.toContain("data-mark-highlight");
  });

  it("تعلّم أيّ نصفي المصطلح بمطابقته", () => {
    const html = render([
      boardItem("term", { en: "conversion factor", ar: "معامل التحويل" }, {
        marks: [spanMark("conversion factor", "highlight"), spanMark("التحويل", "strike")],
      }),
    ]);

    expect(html).toContain("data-mark-highlight");
    expect(html).toContain("data-mark-strike");
  });
});

describe("الأنواع النصّية", () => {
  it("يرسم أبناء النقطة قائمةً واحدة متداخلة داخل أبيها", () => {
    const payload = fixturePayload("add-bullet", "board-bullet");
    const html = render([
      boardItem("bullet", { text: payload.text as string, children: payload.children as string[] }),
    ]);

    const list = html.slice(html.indexOf("ms-3"));
    expect(count(html, "<ul")).toBe(2);
    expect(count(list, "<li")).toBe(2);
    expect(html).toContain("الكتلة — كيلوجرام");
    expect(html).toContain("الزمن — ثانية");
  });

  it("لا يرسم قائمة أبناء حين لا أبناء", () => {
    const html = render([boardItem("bullet", { text: "نقطة", children: [] })]);

    expect(count(html, "<ul")).toBe(1);
  });

  it("يرسم ملاحظةً مضمّنةً بلا علامة وبقلمها", () => {
    const payload = fixturePayload("add-note", "board-note");
    const html = render([boardItem("note", { text: payload.text as string }, { pen: "construct" })]);

    expect(html).toContain("الأساسية تُقاس مباشرة بلا معادلة");
    expect(html).toContain("data-pen=\"construct\"");
    expect(html).toContain("text-sm");
  });

  it("يرسم الفاصل خطًّا يشغل خانةً", () => {
    const html = render([boardItem("divider", {}), text("بعده")]);

    expect(html).toContain("<hr");
    expect(count(html, "<li")).toBe(2);
  });

  it("يميّز المقاسات الثلاثة: عنوان العنصر فالمتن فالملاحظة", () => {
    const html = render([
      boardItem("heading", { text: "عنوان" }, { id: "h" }),
      text("متن", { id: "b" }),
      boardItem("note", { text: "هامش" }, { id: "n" }),
    ]);

    const sizeOf = (word: string) => {
      const at = html.indexOf(word);
      const open = html.lastIndexOf("<p", at);
      return html.slice(open, at).match(/text-(lg|base|sm|xl)/)?.[0];
    };
    expect(sizeOf("عنوان")).toBe("text-lg");
    expect(sizeOf("متن")).toBe("text-base");
    expect(sizeOf("هامش")).toBe("text-sm");
  });

  it("يرقّم الخطوات بأرقام غربية داخل المنطقة", () => {
    const html = render([
      boardItem("step", { text: "أول" }, { id: "s1" }),
      boardItem("step", { text: "ثان" }, { id: "s2" }),
    ]);

    expect(html).toMatch(/>1<\/span><span dir="auto"[^>]*>أول/);
    expect(html).toMatch(/>2<\/span><span dir="auto"[^>]*>ثان/);
  });

  it("يرسم قلم البند حدًّا على الحاوية لا لونًا على المتن", () => {
    const html = render([text("سطر", { pen: "trap" })]);

    expect(html).toContain("<div data-pen=\"trap\" class=\"ps-3\">");
  });
});

describe("التعريف والمصطلح", () => {
  it("لا يفسّر الوسوم في المقاطع ولا في نصفي المصطلح", () => {
    const html = render([
      boardItem("definition", { chunks: ["هذا **حرفي** و ==هذا=="], keyWords: [] }),
      boardItem("term", { en: "**raw** term", ar: "__خام__" }, { id: "t" }),
    ]);
    const visible = html.replace(/<[^>]+>/g, "");

    expect(visible).toContain("**حرفي**");
    expect(visible).toContain("==هذا==");
    expect(visible).toContain("**raw**");
    expect(visible).toContain("__خام__");
    expect(html).not.toContain("<mark");
  });

  it("يبرز كلمات الاختبار بلا حساسية لحالة الأحرف ولا اشتقاق", () => {
    const html = render([
      boardItem("definition", {
        chunks: ["A fundamental quantity is measured Directly,", "without an equation"],
        keyWords: ["directly", "WITHOUT AN EQUATION"],
      }, { revealed: 2 }),
    ]);

    expect(html).toContain("<strong class=\"font-bold text-ink\">Directly</strong>");
    expect(html).toContain("<strong class=\"font-bold text-ink\">without an equation</strong>");
    expect(html).not.toContain("<strong class=\"font-bold text-ink\">measured");
  });

  it("لا يرسم المقاطع غير المكشوفة أصلًا", () => {
    const html = render([
      boardItem("definition", { chunks: ["ظاهر", "سرّ لم يُكشف"], keyWords: [] }),
    ]);

    expect(html).toContain("ظاهر");
    expect(html).not.toContain("سرّ لم يُكشف");
    expect(html).not.toContain("invisible");
  });

  it("يعزل نصفي المصطلح باتجاهين مستقلين", () => {
    const html = render([boardItem("term", { en: "conversion factor", ar: "معامل التحويل" })]);

    expect(html).toContain("<span dir=\"ltr\"");
    expect(html).toContain("<span dir=\"rtl\"");
    expect(html).toContain("conversion factor");
    expect(html).toContain("(معامل التحويل)");
  });
});

describe("النداء الحرفي", () => {
  const verbatim = fixturePayload("callout-verbatim", "board-verbatim-ar");

  it("يحمل وسم «بنص الكتاب» وإطارًا لا يشاركه فيه نداءٌ آخر", () => {
    const payload = { kind: "verbatim" as const, text: verbatim.text as string };
    const html = render([boardItem("callout", payload)]);

    expect(html).toContain("بنص الكتاب");
    expect(html).toContain("<blockquote");
    expect(html).toContain("border-double");
    expect(html).toContain("<bdi dir=\"ltr\">conversion factor</bdi>");

    for (const kind of ["loses_marks", "mistake", "mnemonic", "definition", "example", "exam"] as const) {
      expect(render([boardItem("callout", { kind, text: "نص" })])).not.toContain("border-double");
    }
  });

  it("يسمّيه بالإنجليزية في لغة الشرح الإنجليزية", () => {
    const html = render(
      [boardItem("callout", { kind: "verbatim", text: "Note the units cancel" })],
      EN,
    );

    expect(html).toContain("Textbook text");
  });

  it("يطبّق وسوم النداء وعلاماته", () => {
    const html = render([
      boardItem("callout", { kind: "mistake", text: "لا **تنسَ** الوحدة" }, {
        marks: [spanMark("الوحدة", "highlight")],
      }),
    ]);

    expect(html).toContain("<strong class=\"font-bold\">تنسَ</strong>");
    expect(html).toContain("data-mark-highlight");
  });
});

describe("RichText المباشر (الفراغات)", () => {
  it("يرسم الفراغ في موضعه ويحلّل وسوم القالب ولا يقرأ ___ تسطيرًا", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { RichText } = await import("./rich-text");
    const html = renderToStaticMarkup(
      <RichText
        text="**وحدة الكتلة** ___ و 5 ___"
        markup
        pen={null}
        spans={[]}
        renderBlank={(i) => <em data-blank={i} />}
      />,
    );

    expect(html).toBe(
      "<span dir=\"auto\"><strong class=\"font-bold\">وحدة الكتلة</strong> <em data-blank=\"0\"></em> و <bdi dir=\"ltr\">5</bdi> <em data-blank=\"1\"></em></span>",
    );
  });
});
