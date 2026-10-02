import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";

/* الرسائل تُختبر بلا رسم: فروع العدد والوسوم الغنية حدود ترجمة فعلية. */
describe("session messages", () => {
  it.each([
    [0, "أيام", "مواضيع", "فصول"],
    [1, "يوم واحد", "موضوع واحد", "فصل واحد"],
    [2, "يومان", "موضوعين", "فصلين"],
    [3, "أيام", "مواضيع", "فصول"],
    [11, "يومًا", "موضوعًا", "فصلًا"],
    [100, "يوم", "موضوع", "فصل"],
  ] as const)("uses grammatical Arabic at count %s with Latin digits", (count, days, topics, chapters) => {
    const t = createTranslator({ locale: "ar", messages: ar, namespace: "SessionSummary" });
    const countLabel = String(count);
    const exam = t("daysLeft", { count, countLabel, course: "ACCT 101" });
    expect(exam).toContain(count === 0 ? "اليوم" : days);
    const coverage = t("covered", { covered: "0", total: count, totalLabel: countLabel });
    const progress = t("progress", { doneLabel: "0", total: count, totalLabel: countLabel });
    expect(coverage).toContain(topics);
    expect(progress).toContain(chapters);
    expect(`${exam}${coverage}${progress}`).not.toMatch(/[٠-٩۰-۹]/);
  });

  it.each(["ar", "en"] as const)("formats intro plurals and content isolation tags in %s", (locale) => {
    const messages = locale === "ar" ? ar : en;
    const t = createTranslator({ locale, messages, namespace: "Session" });
    const stats = t.markup("introStats", {
      lessons: 12, lessonsLabel: "12", count: 25, countLabel: "25",
      estimate: (chunks) => `<bdi>${chunks}</bdi>`,
    });
    expect(stats).toContain("12");
    expect(stats).toContain("<bdi>~25</bdi>");
    const position = t.markup("lastPositionDetail", {
      lessonName: "Control السيطرة", detail: t("topicOf", { number: "2", total: "5" }),
      lesson: (chunks) => `<bdi>${chunks}</bdi>`,
    });
    expect(position).toContain("<bdi>Control السيطرة</bdi>");
    expect(position).toContain("2");
    expect(position).toContain("5");
  });

  it.each([1, 2, 3, 11, 100])("keeps English count nouns and supplied Latin labels at %s", (count) => {
    const t = createTranslator({ locale: "en", messages: en, namespace: "SessionSummary" });
    const countLabel = String(count);
    expect(t("daysLeft", { count, countLabel, course: "ACCT 101" })).toContain(`${countLabel} ${count === 1 ? "day left" : "days left"}`);
    expect(t("progress", { doneLabel: "0", total: count, totalLabel: countLabel })).toContain(`${countLabel} ${count === 1 ? "chapter" : "chapters"}`);
  });
});
