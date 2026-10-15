import { useFormatter, useTranslations } from "next-intl";
import type { PreviewNotice } from "@/lib/preview/rules";

/* علامات معاينة المشرف — هادئة ومحايدة، بلا كهرمانيّ (الكهرمانيّ للفعل وحده) ولا أحمر.

   - «مسوّدة»: حدّ منقّط، تقول إن الفصل أو المقرر لم يُنشر بعد.
   - «معاينة: النسخة N» مع كونها الحيّة أو لا، وكذلك نسخة محتوى المقرر إن اختيرت.
   الأرقام لاتينية (0–9). النصوص في `messages/` (Preview). */

/* وسم «مسوّدة» وحده — للبطاقات والعناوين. */
export function DraftBadge({ className = "", colors = "border-ink-3 text-ink-2" }: { className?: string; colors?: string }) {
  const t = useTranslations("Preview");
  return (
    <span className={`inline-flex shrink-0 items-center rounded-pill border border-dashed px-2 py-0.5 text-[11px] font-semibold ${colors} ${className}`}>
      {t("draft")}
    </span>
  );
}

export function PreviewBadges({ notice, className = "" }: { notice: PreviewNotice; className?: string }) {
  const t = useTranslations("Preview");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const pill = "inline-flex items-center rounded-pill border border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-2";

  return (
    <ul aria-label={t("label")} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {notice.draft ? <li><DraftBadge /></li> : null}
      {notice.chapterVersion ? (
        <li data-preview-version="chapter" className={pill}>
          {t("version", { number: number(notice.chapterVersion.number) })}
          {" · "}
          {t(notice.chapterVersion.live ? "live" : "notLive")}
        </li>
      ) : null}
      {notice.courseVersion ? (
        <li data-preview-version="course" className={pill}>
          {t("courseVersion", { number: number(notice.courseVersion.number) })}
          {" · "}
          {t(notice.courseVersion.live ? "live" : "notLive")}
        </li>
      ) : null}
    </ul>
  );
}
