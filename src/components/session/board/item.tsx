import { ANNOTATION_LABEL } from "./labels";
import { baseDecoration, decorate, decorationAttrs, penAttrs } from "@/lib/session/board/marks";
import { motion } from "motion/react";
import { WarningIcon } from "@/components/becan/icons";
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
import { MarkIcon, TableItem } from "./table";
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
  const decoration = decorate(item, { scope: "item" }, baseDecoration(annotation));
  decoration.dimmedByFocus = item.kind !== "title" && dimmedByFocus && !decoration.focus;
  const structured = ["table", "compare", "options", "chain", "blanks", "equation", "timeline", "icon"].includes(item.kind);
  const frameKind = annotation === "correct" || annotation === "wrong" ? decoration.answer : annotation;
  const frame = frameKind ? FRAMES[frameKind] : "";
  const label = annotation && annotation !== "correct" && annotation !== "wrong" ? ANNOTATION_LABEL[annotation]?.[language] : undefined;

  return (
    <motion.li
      {...anim}
      {...decorationAttrs(decoration)}
      {...penAttrs(item.pen)}
      data-board-item={item.id}
      data-cancelled={structured && decoration.strike ? "" : undefined}
      /* النقل بين المناطق يُحرَّك دون تأخير وصول المحتوى. */
      layout={reduce ? false : "position"}
      aria-current={annotation === "key" ? true : undefined}
      className={`relative min-w-0 ${item.pen ? "ps-3" : ""} ${frame}`}
    >
      <MarkIcon answer={decoration.answer} language={language} />
      {label ? <span className="sr-only">{label}</span> : null}
      {annotation === "warning" ? <WarningIcon className="mb-1 h-5 w-5 text-ink-2" /> : null}
      <div className="min-w-0">
        <Body item={item} n={n} language={language} />
      </div>
    </motion.li>
  );
}
