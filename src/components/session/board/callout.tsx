import {
  BookIcon,
  ExamIcon,
  ExampleIcon,
  LosesMarksIcon,
  MistakeIcon,
  MnemonicIcon,
} from "@/components/becan/icons";
import type { CalloutKind, CalloutPayload } from "@/lib/session/teaching-board";
import type { SessionLanguage } from "../parts";

/* النداءات الستّة (§5.11).

   **«يضيّع درجات» أعلى بند قيمةً على السبورة** — وهو أحدّ ما يميّز
   المنتج، فيجب أن يستحيل خلطه ببندٍ عادي. يأخذ أقوى معالجة غير
   خطأ متاحة: لوحٌ مرفوع بحدٍّ جوزيّ سميك وهالة حوله، كالشريحة
   المفتوحة في عمود الشرائح. والجوزيّ هنا حدٌّ ورسم لا يحمل نصًّا،
   فلا يخالف قاعدة الهوية.

   ولا كهرمانيّ في أيٍّ منها: الكهرماني للعناصر القابلة للضغط وحدها،
   ولا شيء على السبورة يُضغط. */

const ICONS: Record<CalloutKind, (p: { className?: string }) => React.ReactElement> = {
  loses_marks: LosesMarksIcon,
  mistake: MistakeIcon,
  mnemonic: MnemonicIcon,
  definition: BookIcon,
  example: ExampleIcon,
  exam: ExamIcon,
};

const LABELS: Record<CalloutKind, Record<SessionLanguage, string>> = {
  loses_marks: { Arabic: "يضيّع درجات", English: "Loses marks" },
  mistake: { Arabic: "غلط شائع", English: "Common mistake" },
  mnemonic: { Arabic: "حيلة للحفظ", English: "Mnemonic" },
  definition: { Arabic: "تعريف", English: "Definition" },
  example: { Arabic: "مثال", English: "Example" },
  exam: { Arabic: "يجي في الاختبار", English: "In the exam" },
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
};

export function CalloutItem({
  payload,
  language,
}: {
  payload: CalloutPayload;
  language: SessionLanguage;
}) {
  const Icon = ICONS[payload.kind];
  const style = STYLES[payload.kind];
  const label = LABELS[payload.kind][language];
  const loud = payload.kind === "loses_marks";

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
      <p
        dir="auto"
        className={`mt-1.5 leading-base text-ink ${loud ? "font-semibold" : ""}`}
      >
        {payload.text}
      </p>
    </div>
  );
}
