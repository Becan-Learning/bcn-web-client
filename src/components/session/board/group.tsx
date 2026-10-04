import type { ReactNode } from "react";
import { ExampleIcon } from "@/components/becan/icons";
import type { BoardGroup, Stage } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";
import { EXAMPLE_LABEL, STAGE_LABEL } from "./labels";
import { RichText } from "./rich-text";
import { BoardPresence } from "./presence";

/* حاوية المجموعة (§2.1) — إطارٌ وعنوانٌ ووسمان، والأعضاء يضعهم مَن يرسمها.

   أربعة أنواع بأربع هيئات، والمرحلة مستقلّة عنها: كلّها تقبل `stage`.

   المرحلة تُقرأ من نمط الإطار قبل لونه — متصل ثم متقطّع ثم منقّط —
   ومن وسمٍ نصيّ بلغة الشرح؛ فلا يحتاج الطالب إلى تمييز لونٍ ليعرف
   أيُّ دور له. الإطار نفسه من `data-stage` في الأنماط المشتركة،
   ووسم المرحلة يكرّر نمطه بحدٍّ مطابق كي يتّصل الاثنان بصريًا.

   «المثال» حاوية كاملة لا نداء: إطار سميك وتعبئة تحتويان العمل كله
   ووسمٌ مسمّى. هذا ما يفرّقها عن `callout` بنوع example، وهو مربّع
   صغير بحدّ متقطّع حول فقرة واحدة. */

const STAGE_BADGE: Record<Stage, string> = {
  worked: "border-solid",
  faded: "border-dashed",
  try: "border-dotted",
};

/* الأطر: ما للمرحلة من إطار تتكفّل به الأنماط المشتركة ويغلب حدَّ النوع،
   فهنا الهيئة والحشو وحدهما. وعمودا `columns` بلا إطار إلا إن حملا مرحلة. */
function containerClass(group: BoardGroup): string {
  const staged = group.stage !== null;
  switch (group.kind) {
    case "box":
      return "rounded-md border border-chalkboard-edge px-3.5 py-3";
    case "example":
      return "rounded-lg border-2 border-ink bg-ink/5 px-4 py-3.5";
    case "scenario":
      return "rounded-lg border border-chalkboard-edge bg-ink/5 px-3.5 py-3";
    case "columns":
      return staged ? "rounded-md px-3.5 py-3" : "";
  }
}

/* الأعمدة تتكدّس رأسيًا تحت العنوان على الجوال (§8)؛ والمشهد يلتفّ
   وحدات كاملة، كلُّ وحدةٍ أيقونةٌ مع وسمها. */
function membersClass(group: BoardGroup): string {
  switch (group.kind) {
    case "columns":
      return "grid grid-cols-1 gap-4 md:grid-cols-2";
    case "scenario":
      return "flex flex-wrap items-start gap-x-6 gap-y-4";
    default:
      return "flex flex-col gap-3";
  }
}

export function GroupShell({
  group,
  language,
  children,
  reduce,
}: {
  group: BoardGroup;
  language: ExplanationLanguage;
  /** null لحاويةٍ بلا أعضاء: يُرسم عنوانها وحده */
  children: ReactNode;
  reduce: boolean;
}) {
  return (
    <li
      data-board-group={group.kind}
      data-stage={group.stage ?? undefined}
      className={containerClass(group)}
    >
      <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {group.kind === "example" ? (
          <span
            data-group-badge="example"
            className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-2 py-0.5 text-xs leading-base font-bold text-chalkboard"
          >
            <ExampleIcon className="h-4 w-4 shrink-0" />
            {EXAMPLE_LABEL[language]}
          </span>
        ) : null}
        {group.stage ? (
          <span
            data-group-badge={group.stage}
            className={`inline-flex items-center rounded-sm border-2 border-ink-2 px-2 py-0.5 text-xs leading-base font-bold text-ink ${STAGE_BADGE[group.stage]}`}
          >
            {STAGE_LABEL[group.stage][language]}
          </span>
        ) : null}
        {/* العنوان نصّ صرف لا وسوم فيه، ويأخذ عزل الأجزاء اللاتينية */}
        <p
          data-group-heading=""
          className="min-w-0 text-sm leading-base font-bold text-ink-2 [overflow-wrap:anywhere]"
        >
          <RichText text={group.heading} markup={false} pen={null} spans={[]} />
        </p>
      </div>
      <BoardPresence reduce={reduce}>
        {children ? <ul key={group.id} className={membersClass(group)}>
          <BoardPresence reduce={reduce}>{children}</BoardPresence>
        </ul> : null}
      </BoardPresence>
    </li>
  );
}
