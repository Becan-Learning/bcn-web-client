import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";

/* الرسائل تُختبر بلا رسم: فروع العدد والوسوم الغنية حدود ترجمة فعلية. */
describe("session messages", () => {
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
});
