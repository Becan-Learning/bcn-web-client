import { describe, expect, it } from "vitest";
import { layoutRichText, ltrRuns, parseMarkup, spanDecorations } from "./rich-text";

function runsOf(text: string) {
  return ltrRuns(text).map(([s, e]) => text.slice(s, e));
}

describe("ltrRuns", () => {
  it("لا يعزل نثرًا عربيًا خالصًا", () => {
    expect(runsOf("الأساسية تُقاس مباشرة بلا معادلة")).toEqual([]);
    expect(runsOf("")).toEqual([]);
  });

  it("يضمّ الإشارة المفصولة عن رقمها ولا يضمّ شرطةً بلا رقم", () => {
    expect(runsOf("الأس: − 2 ⇒ −4")).toEqual(["− 2 ⇒ −4"]);
    expect(runsOf("الطول − العرض")).toEqual([]);
  });

  it("يقطع عند علامات النثر العربي لا عند الرموز الرياضية", () => {
    expect(runsOf("طول · كتلة · m/s · 5")).toEqual(["m/s", "5"]);
    expect(runsOf("x = 3، y = 4")).toEqual(["x = 3", "y = 4"]);
  });

  it("يبقي القوس المتوازن كاملًا ويسقط غير المتوازن", () => {
    expect(runsOf("متر (m)")).toEqual(["(m)"]);
    expect(runsOf("[0, 1]")).toEqual(["[0, 1]"]);
    expect(runsOf("(أ) 5 m)")).toEqual(["5 m"]);
    expect(runsOf("m (الطول")).toEqual(["m"]);
  });

  it("يشمل الأسس والأدلّة ورموز الوحدات", () => {
    expect(runsOf("ثم 3 m³ و 25° و H₂O")).toEqual(["3 m³", "25°", "H₂O"]);
  });
});

describe("parseMarkup", () => {
  it("يحجز موضع الفراغ ويقسم ___ قبل الوسوم", () => {
    const parsed = parseMarkup("**وحدة** ___ و __خط__", { markup: true, blanks: true });

    expect(parsed.blanks).toEqual([{ at: 5, index: 0 }]);
    expect(parsed.visible).toBe("وحدة ￼ و خط");
    expect(parsed.styles.map((s) => s.kind)).toEqual(["bold", "underline"]);
  });

  it("لا يحلّل شيئًا حين markup=false", () => {
    const parsed = parseMarkup("**a** ==b==", { markup: false, blanks: false });

    expect(parsed.visible).toBe("**a** ==b==");
    expect(parsed.styles).toEqual([]);
  });

  it("يحمل اسم القلم لا عمود الوسم", () => {
    const parsed = parseMarkup("=={trap}خطر== و ==عام==", { markup: true, blanks: false });

    expect(parsed.visible).toBe("خطر و عام");
    expect(parsed.styles.map((s) => s.pen)).toEqual(["trap", null]);
  });
});

describe("spanDecorations", () => {
  it("لا يرجع شيئًا حين لا مطابقة", () => {
    expect(
      spanDecorations("abc", [
        { scope: "span", index: null, cell: null, option: null, match: "zzz", state: "wrong" },
      ]),
    ).toBeNull();
  });
});

describe("layoutRichText", () => {
  it("يعيد النصّ العادي عقدةً واحدة بلا زخرفة", () => {
    const nodes = layoutRichText("نص عادي", { markup: true, blanks: false, spans: [] });

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: "flow" });
  });
});
