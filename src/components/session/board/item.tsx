import { motion } from "motion/react";
import { CheckIcon, CloseIcon, WarningIcon } from "@/components/becan/icons";
import type { AnnotationKind, BoardItem } from "@/lib/session/teaching-board";
import type { SessionLanguage } from "../parts";
import { BlanksItem } from "./blanks";
import { CalloutItem } from "./callout";
import { ChainItem } from "./chain";
import { CompareItem } from "./compare";
import { DefinitionItem } from "./definition";
import { EquationItem } from "./equation";
import { OptionsItem } from "./options";
import { TableItem } from "./table";
import { TermItem } from "./term";
import { BulletLine, HeadingLine, StepLine, TextLine } from "./text-kinds";

/* حالات العنصر (§5.4) — بلا كهرمانيّ.

   `key` هي «البند الذي عليه المعلّم الآن»، وتحتاج أقوى إبراز متاح.
   والكهرماني ممنوع: دوره العناصر القابلة للضغط وحدها، ولا شيء على
   السبورة يُضغط. فالإبراز حلقةٌ طباشيرية حول البند مع غسلةٍ خفيفة
   — أقوى ما في اللوح بلا استعارة لونِ فعل.

   `correct` و`wrong` لا يعتمدان على اللون: مع كلٍّ أيقونته، فالبندان
   مقروءان لمن لا يميّز الألوان.

   و`dim` لا يُنفَّذ بالشفافية بل بإعادة توجيه توكن الحبر إلى
   `--bcn-ink-2`: القيمة المقيسة تحفظ أرضية 5.33:1، والتخمين
   بالشفافية لا يحفظها. */

const FRAMES: Record<AnnotationKind, string> = {
  key: "rounded-md bg-ink/10 px-3 py-2 ring-2 ring-ink",
  warning: "border-s-4 border-warmth ps-3",
  correct: "border-s-4 border-live ps-3",
  wrong: "border-s-4 border-error ps-3",
  broken: "line-through decoration-2 decoration-ink-2",
  dim: "",
};

const BADGES: Partial<Record<AnnotationKind, () => React.ReactElement>> = {
  warning: () => <WarningIcon className="h-5 w-5 shrink-0 text-warmth" />,
  correct: () => <CheckIcon className="h-5 w-5 shrink-0 text-live" />,
  wrong: () => <CloseIcon className="h-5 w-5 shrink-0 text-error" />,
};

/* الأيقونات كلها `aria-hidden`، فاللون والأيقونة يسقطان معًا عند
   قارئ الشاشة ولا يبقى فرقٌ بين «صحيح» و«خطأ». فيُنطق الحال نصًّا
   مخفيًا بصريًا — وهو ما يجعل §5.4 مستوفاةً فعلًا لا شكلًا. */
const STATE_LABEL: Partial<Record<AnnotationKind, Record<SessionLanguage, string>>> = {
  warning: { Arabic: "تنبيه", English: "Note" },
  correct: { Arabic: "إجابة صحيحة", English: "Correct" },
  wrong: { Arabic: "إجابة خاطئة", English: "Wrong" },
  broken: { Arabic: "وصلة ملغاة", English: "Cancelled link" },
};

/* الحبر المخفوت: توكنٌ يُعاد توجيهه للشجرة كلها، فيتبعه كل ما
   تحته بلا أن تعرف المكوّنات شيئًا عن الحالة. */
const DIM_STYLE = { "--bcn-ink": "var(--bcn-ink-2)" } as React.CSSProperties;

function Body({
  item,
  n,
  language,
}: {
  item: BoardItem;
  n: number;
  language: SessionLanguage;
}) {
  switch (item.kind) {
    case "title":
    case "heading":
      return <HeadingLine text={item.payload.text} />;
    case "text":
      return <TextLine text={item.payload.text} />;
    case "bullet":
      return <BulletLine text={item.payload.text} />;
    case "step":
      return <StepLine text={item.payload.text} n={n} />;
    case "definition":
      return <DefinitionItem payload={item.payload} revealed={item.revealed} />;
    case "term":
      return <TermItem payload={item.payload} />;
    case "equation":
      return <EquationItem payload={item.payload} />;
    case "compare":
      return <CompareItem payload={item.payload} />;
    case "table":
      return <TableItem payload={item.payload} />;
    case "chain":
      return <ChainItem payload={item.payload} slots={item.slots} />;
    case "blanks":
      return <BlanksItem payload={item.payload} slots={item.slots} language={language} />;
    case "options":
      return <OptionsItem payload={item.payload} slots={item.slots} language={language} />;
    case "callout":
      return <CalloutItem payload={item.payload} language={language} />;
  }
}

export function BoardItemView({
  item,
  n,
  language,
  reduce,
}: {
  item: BoardItem;
  n: number;
  language: SessionLanguage;
  reduce: boolean;
}) {
  /* لا مباعدة بمؤقّتات جافاسكربت: الوكيل يوقّت كل عملية على الصوت
     المنطوق، وأي تأخير من الصفحة يضاعف التوقيت (§1). */
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 7 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
      };

  const annotation = item.annotation;
  const frame = annotation ? FRAMES[annotation] : "";
  const badge = annotation ? BADGES[annotation] : undefined;
  const label = annotation ? STATE_LABEL[annotation]?.[language] : undefined;

  return (
    <motion.li
      {...anim}
      /* النقل بين «الحيّ» و«المثبَّت» يُحرَّك ولا يقفز (§3) */
      layout={reduce ? false : "position"}
      /* «البند الذي عليه المعلّم الآن» — حالٌ دلاليّ لا حلقة وحسب */
      aria-current={annotation === "key" ? true : undefined}
      style={annotation === "dim" ? DIM_STYLE : undefined}
      className={badge ? `flex gap-2.5 ${frame}` : frame}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {badge ? badge() : null}
      <div className="min-w-0 flex-1">
        <Body item={item} n={n} language={language} />
      </div>
    </motion.li>
  );
}
