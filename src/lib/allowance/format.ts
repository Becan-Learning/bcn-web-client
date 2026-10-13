import type { createFormatter } from "next-intl";

export function formatRenewalDate(format: Pick<ReturnType<typeof createFormatter>, "dateTime">, date: Date): string {
  return format.dateTime(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
    /* دورة الاستخدام لحظة زمنية؛ تُعرض بتوقيت الرياض كي لا يتغيّر اليوم. */
    timeZone: "Asia/Riyadh",
  });
}
