/* نمط الشرح — يُمرَّر إلى الوكيل ضمن سمات المشارك (`experience`).
   قيمة بداية لا قيد: تُحفظ في المتصفّح وتُقرأ لحظة بدء الجلسة. */

export type ExperienceMode = "quick" | "relaxed";

export const EXPERIENCE_KEY = "becan:experience";
export const DEFAULT_EXPERIENCE: ExperienceMode = "relaxed";
const CHANGE_EVENT = "becan:experience-change";

export const EXPERIENCE_OPTIONS = [
  { id: "quick", label: "مستعجل" },
  { id: "relaxed", label: "عندي وقت" },
] as const satisfies readonly { id: ExperienceMode; label: string }[];

export function getExperience(): ExperienceMode {
  try {
    const v = localStorage.getItem(EXPERIENCE_KEY);
    return v === "quick" || v === "relaxed" ? v : DEFAULT_EXPERIENCE;
  } catch {
    return DEFAULT_EXPERIENCE;
  }
}

export function setExperience(value: ExperienceMode) {
  try {
    localStorage.setItem(EXPERIENCE_KEY, value);
  } catch {
    /* التخزين محجوب — تبقى القيمة الافتراضية */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** للاستعمال مع useSyncExternalStore — يلتقط التغيير من هذا اللسان ومن غيره */
export function subscribeExperience(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}
