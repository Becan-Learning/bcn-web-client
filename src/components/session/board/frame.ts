import type { ExplanationLanguage } from "../explanation-language";

export function boardFrame(language: ExplanationLanguage) {
  return language === "Arabic"
    ? { dir: "rtl", lang: "ar" } as const
    : { dir: "ltr", lang: "en" } as const;
}
