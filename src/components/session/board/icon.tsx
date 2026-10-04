import { createContext, useContext } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { BOARD_ICON_MAP } from "./icon-map.generated";
import { UNKNOWN_ICON_LABEL } from "./labels";
import type { BoardKindProps } from "./kind-props";
import { RichText } from "./rich-text";

/* الأيقونة والوسم وحدةُ تخطيطٍ واحدة (§5.17): عنصرٌ واحد يلتفّ كاملًا
   على الجوال، فلا يفترق نصٌّ عن رسمه.

   الاسم على السلك اسم بيكان؛ ورسمُه لوسيد يُقرأ من خريطة مولَّدة عن
   الكتالوج. اسمٌ لا تعرفه الخريطة لا يمرّ إلى لوسيد أصلًا: يظهر
   حاملُ مكانٍ محايد ويبقى الوسم، فلا يضيع معنى المشهد ولا يُرمى
   خطأٌ في وحدة التحكّم. */

/** الإلصاق الصالح كما حسبته السبورة: معرّف الأيقونة ← معرّف هدفها */
const IconAttachments = createContext<ReadonlyMap<string, string>>(new Map());
export const IconAttachmentsProvider = IconAttachments.Provider;

/* حامل المكان: مربّعٌ منقّط بلا معنى، بقياس الأيقونة نفسه كي لا يقفز
   التخطيط حين يصل الرسم الحقيقي. */
function Placeholder({ label }: { label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="3 3"
      data-icon-placeholder=""
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}

function lucideNameOf(icon: string): IconName | null {
  return Object.hasOwn(BOARD_ICON_MAP, icon) ? (BOARD_ICON_MAP[icon] as IconName) : null;
}

export function IconItem({ item, language }: BoardKindProps<"icon">) {
  const { icon, label } = item.payload;
  const attachedTo = useContext(IconAttachments).get(item.id);
  const lucide = lucideNameOf(icon);
  const spans = item.marks.filter((mark) => mark.scope === "span");

  return (
    <span
      data-icon-unit=""
      data-icon={icon}
      data-attached-to={attachedTo}
      className="flex max-w-full items-center gap-3"
    >
      <span
        data-icon-glyph=""
        data-icon-pen={item.pen ?? undefined}
        className="flex size-11 shrink-0 items-center justify-center rounded-pill text-ink"
      >
        {lucide ? (
          <DynamicIcon
            name={lucide}
            size={24}
            strokeWidth={1.75}
            aria-hidden="true"
            focusable="false"
            fallback={() => <Placeholder />}
          />
        ) : (
          <Placeholder label={UNKNOWN_ICON_LABEL[language]} />
        )}
      </span>
      <span className="min-w-0 leading-base text-ink [overflow-wrap:anywhere]">
        <RichText text={label} markup pen={item.pen} spans={spans} />
      </span>
    </span>
  );
}
