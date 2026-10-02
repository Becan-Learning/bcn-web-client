export type ExplanationLanguage = "Arabic" | "English";

export const EXPLANATION_LANGUAGE_KEY = "becan:explanation-language";
const CHANGE_EVENT = "becan:explanation-language-change";

export function resolveExplanationLanguage(
  stored: unknown,
  locale: string,
): ExplanationLanguage {
  return stored === "Arabic" || stored === "English"
    ? stored
    : locale === "en"
      ? "English"
      : "Arabic";
}

export function getExplanationLanguage(): ExplanationLanguage | null {
  try {
    const value = localStorage.getItem(EXPLANATION_LANGUAGE_KEY);
    return value === "Arabic" || value === "English" ? value : null;
  } catch {
    return null;
  }
}

export function setExplanationLanguage(value: ExplanationLanguage) {
  try {
    localStorage.setItem(EXPLANATION_LANGUAGE_KEY, value);
  } catch {
    /* التخزين محجوب — يبقى الاختيار في الجلسة الحالية. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** لقطة الخادم بلا اختيار محفوظ؛ لغة الواجهة تمنع اختلاف الترطيب. */
export const getServerExplanationLanguage = () => null;

export function subscribeExplanationLanguage(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}
