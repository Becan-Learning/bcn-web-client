import { ANNOTATION_LABEL } from "./labels";
import { motion } from "motion/react";
import { CheckIcon, CloseIcon, WarningIcon } from "@/components/becan/icons";
import type { AnnotationKind, BoardItem } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";
import { DividerItem } from "./divider";
import { IconItem } from "./icon";
import { NoteItem } from "./note";
import { TimelineItem } from "./timeline";
import { UnsupportedItem } from "./unsupported";
import type { BoardKindProps } from "./kind-props";
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

/* الحبر المخفوت: توكنٌ يُعاد توجيهه للشجرة كلها، فيتبعه كل ما
   تحته بلا أن تعرف المكوّنات شيئًا عن الحالة. */
const DIM_STYLE = { "--bcn-ink": "var(--bcn-ink-2)" } as React.CSSProperties;

function Body({
  item,
  n,
  language,
}: BoardKindProps) {
  switch (item.kind) {
    case "title":
    case "heading":
      return <HeadingLine item={item} language={language} n={n} />;
    case "text":
      return <TextLine item={item} language={language} n={n} />;
    case "bullet":
      return <BulletLine item={item} language={language} n={n} />;
    case "step":
      return <StepLine item={item} language={language} n={n} />;
    case "note":
      return <NoteItem item={item} language={language} n={n} />;
    case "divider":
      return <DividerItem item={item} language={language} n={n} />;
    case "timeline":
      return <TimelineItem item={item} language={language} n={n} />;
    case "icon":
      return <IconItem item={item} language={language} n={n} />;
    case "unsupported":
      return <UnsupportedItem item={item} language={language} n={n} />;
    case "definition":
      return <DefinitionItem item={item} language={language} n={n} />;
    case "term":
      return <TermItem item={item} language={language} n={n} />;
    case "equation":
      return <EquationItem item={item} language={language} n={n} />;
    case "compare":
      return <CompareItem item={item} language={language} n={n} />;
    case "table":
      return <TableItem item={item} language={language} n={n} />;
    case "chain":
      return <ChainItem item={item} language={language} n={n} />;
    case "blanks":
      return <BlanksItem item={item} language={language} n={n} />;
    case "options":
      return <OptionsItem item={item} language={language} n={n} />;
    case "callout":
      return <CalloutItem item={item} language={language} n={n} />;
  }
}

export function BoardItemView({
  item,
  n,
  language,
  reduce,
  dimmedByFocus = false,
}: {
  item: BoardItem;
  n: number;
  language: ExplanationLanguage;
  reduce: boolean;
  /** بندٌ آخر في المنطقة نفسها عليه «انظر هنا»، فيُخفَت هذا ولا يُخفى */
  dimmedByFocus?: boolean;
}) {
  void dimmedByFocus;
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
  const label = annotation ? ANNOTATION_LABEL[annotation]?.[language] : undefined;

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
