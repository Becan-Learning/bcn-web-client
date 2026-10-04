import { CALLOUT_LABEL } from "./labels";
import {
  BookIcon,
  ExamIcon,
  ExampleIcon,
  LosesMarksIcon,
  MistakeIcon,
  MnemonicIcon,
} from "@/components/becan/icons";
import { spanMarks } from "@/lib/session/board/rich-text";
import type { CalloutKind } from "@/lib/session/teaching-board";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";
import { Accent } from "./text-kinds";

/* النداءات السبعة (§5.14).

   **«يضيّع درجات» أعلى بند قيمةً على السبورة** — وهو أحدّ ما يميّز
   المنتج، فيجب أن يستحيل خلطه ببندٍ عادي. يأخذ أقوى معالجة غير
   خطأ متاحة: لوحٌ مرفوع بحدٍّ جوزيّ سميك وهالة حوله، كالشريحة
   المفتوحة في عمود الشرائح. والجوزيّ هنا حدٌّ ورسم لا يحمل نصًّا،
   فلا يخالف قاعدة الهوية.

   ولا كهرمانيّ في أيٍّ منها: الكهرماني للعناصر القابلة للضغط وحدها،
   ولا شيء على السبورة يُضغط. */

/* علامة الاقتباس رسمٌ لا حرف: الحرف يتبدّل شكله بين الاتجاهين، والرسم
   واحد في اللوحين. وتخصّ نداء «بنص الكتاب» وحده فلا يلتبس بـ«تعريف»
   الذي يشاركه الكتاب أيقونةً. */
function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 17h4l2-4V7H6v6h3zM14 17h4l2-4V7h-6v6h3z" />
    </svg>
  );
}

const ICONS: Record<CalloutKind, (p: { className?: string }) => React.ReactElement> = {
  loses_marks: LosesMarksIcon,
  mistake: MistakeIcon,
  mnemonic: MnemonicIcon,
  definition: BookIcon,
  example: ExampleIcon,
  exam: ExamIcon,
  verbatim: QuoteIcon,
};

/* لكلٍّ حدُّه وتعبئته وأيقونته — فالتمييز لا يقع على اللون وحده.

   والتمييز على محاور أربعة (سُمك الحدّ · تقطّعه · الجوزيّ مقابل
   الطباشير · التعبئة) لا على جانبٍ ملوّن من البطاقة: البطاقة هنا
   مستديرة ممتلئة، وشريطٌ سميك على حرفها يشاكس استدارتها ويتحوّل
   إلى زينة. النداء يُعرَف بأيقونته ووسمه قبل إطاره. */
const STYLES: Record<CalloutKind, { frame: string; icon: string }> = {
  loses_marks: {
    frame: "border-2 border-warmth ring-4 ring-warmth/35 bg-surface",
    icon: "text-warmth",
  },
  exam: { frame: "border-2 border-warmth bg-ink/5", icon: "text-warmth" },
  mistake: { frame: "border border-ink-3 bg-ink/5", icon: "text-ink-2" },
  mnemonic: { frame: "border border-dashed border-ink-3 bg-ink/5", icon: "text-ink-2" },
  example: { frame: "border border-dashed border-warmth", icon: "text-warmth" },
  definition: { frame: "bg-ink/10", icon: "text-ink-2" },
  /* الإطار المزدوج هيئة صفحة الكتاب، وهو الوحيد بين السبعة. */
  verbatim: { frame: "border-4 border-double border-ink-2", icon: "text-ink-2" },
};

export function CalloutItem({ item, language }: BoardKindProps<"callout">) {
  const { payload } = item;
  const Icon = ICONS[payload.kind];
  const style = STYLES[payload.kind];
  const label = CALLOUT_LABEL[payload.kind][language];
  const loud = payload.kind === "loses_marks";
  const verbatim = payload.kind === "verbatim";
  const body = (
    <RichTextCore
      wrap="none"
      text={payload.text}
      markup
      pen={item.pen}
      spans={spanMarks(item.marks)}
    />
  );
  const bodyClass = `mt-1.5 leading-base text-ink ${loud ? "font-semibold" : ""}`;

  return (
    <div className={`rounded-md px-3.5 py-3 ${style.frame}`}>
      <p className="flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${style.icon}`} />
        <span
          dir="auto"
          className={`text-xs leading-base font-bold tracking-normal ${loud ? "text-ink" : "text-ink-2"}`}
        >
          {label}
        </span>
      </p>
      {/* قلم البند حدٌّ على النصّ لا على الإطار: للإطار هويّته من نوع النداء */}
      <Accent pen={item.pen}>
        {verbatim ? (
          <blockquote dir="auto" className={bodyClass}>
            {body}
          </blockquote>
        ) : (
          <p dir="auto" className={bodyClass}>
            {body}
          </p>
        )}
      </Accent>
    </div>
  );
}
