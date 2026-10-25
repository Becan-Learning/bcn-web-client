import { useTranslations } from "next-intl";
import { WhatsappIcon } from "@/components/becan/icons";
import { whatsappHref } from "@/lib/data/support";

/* زرّ الدعم الطافي — واتساب، في كل صفحة.

   **قرص باذنجانيّ لا كهرمانيّ**: الكهرماني للعنصر القابل للضغط، وهذا
   منه — لكنه مقيم في كل شاشة، وقاعدة «زرّ كهرماني واحد لكل شاشة»
   كانت ستنكسر في كل صفحة دفعةً واحدة، ولزاحم فعلَها الأساسي. فأخذ
   لون المسرح: حاضرٌ ولا يزاحم.

   **ولا الأخضر**: `--live` معناه «يحدث الآن»، وأخضر واتساب لونُ علامة
   تجارية لا لون في هذه اللوحة — و`tokens.css` يمنع أي قيمة لون صريحة.
   والأيقونة وحدها تكفي للتعرّف عليه.

   **يسكن في `PageShell`** — أي في الشاشات الفاتحة كلّها دون الجلسة:
   شاشة الجلسة كل تحكّمها في الثلث السفلي على الجوال (النمط ١٠)، وقرصٌ
   طافٍ هناك يقع على شريط الأدوات نفسه.

   **في نهاية السطر** (يسار في RTL) فلا يقع تحت الإبهام حيث يبدأ
   القارئ، وفوق حدّ 44px بمقاس 56.

   **بطاقة تقييم الحصة** (`session-rating.tsx`) ترتفع فوق القرص بمقداره
   (56px + فجوة 16px) كي لا يغطي زاويتها: إن غُيّر موضع القرص أو مقاسه
   فغيّر إزاحتها معه.

   `print:hidden` كي لا يُطبع مع الفاتورة. */

export function SupportButton() {
  const t = useTranslations("SupportButton");
  return (
    <a
      href={whatsappHref(t("context"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      className="group fixed end-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-pill bg-aubergine-deep text-on-dominant shadow-lift transition-transform duration-200 hover:-translate-y-1 md:end-6 md:bottom-6 print:hidden"
    >
      <WhatsappIcon className="h-7 w-7" />

      {/* التسمية تظهر بالتمرير على الديسكتوب وحده: على الجوال لا
          تمرير، وإظهارها دائمًا يجعل القرص شريطًا يزاحم المحتوى. */}
      <span className="pointer-events-none absolute end-full me-3 hidden whitespace-nowrap rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-ground opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
        {t("help")}
      </span>
    </a>
  );
}
