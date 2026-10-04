import { expect, it } from "vitest";
import { iconNames } from "lucide-react/dynamic";
import catalogue from "@/lib/session/board/__fixtures__/icons.json";
import { BOARD_ICON_MAP } from "./icon-map.generated";

/* الكتالوج يملكه الخادم؛ هذا الاختبار يضمن أن نسخة لوسيد المثبَّتة
   تحزم كل رسم ذكره، وأن الخريطة المولَّدة لم تتأخّر عنه. */

it("كل أيقونة في الكتالوج تُحلّ إلى رسمٍ في لوسيد المثبَّت", () => {
  const available = new Set<string>(iconNames);
  const unresolved = catalogue.icons.filter(
    (entry) => BOARD_ICON_MAP[entry.name] !== entry.lucide || !available.has(entry.lucide),
  );

  expect(unresolved.map((entry) => `${entry.name} -> ${entry.lucide}`)).toEqual([]);
  expect(Object.keys(BOARD_ICON_MAP)).toHaveLength(catalogue.count);
});

it("الأسماء الموروثة من النموذج الأوّل لا تُحلّ إلى شيء", () => {
  expect(Object.hasOwn(BOARD_ICON_MAP, "constructor")).toBe(false);
  expect(Object.hasOwn(BOARD_ICON_MAP, "__proto__")).toBe(false);
});
