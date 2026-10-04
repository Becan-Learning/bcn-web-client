import { Fragment, type ReactNode } from "react";
import { CheckIcon, CloseIcon } from "@/components/becan/icons";
import { decorationAttrs } from "@/lib/session/board/marks";
import {
  layoutRichText,
  type DecoGroup,
  type Piece,
} from "@/lib/session/board/rich-text";
import type { Mark, Pen } from "@/lib/session/teaching-board";
import { MARK_LABEL } from "./labels";
import { useBoardLanguage } from "./language";

export type RichTextProps = {
  text: string;
  markup: boolean;
  pen: Pen | null;
  spans: Mark[];
  renderBlank?: (index: number) => ReactNode;
};

/* كل نصٍّ على السبورة يمرّ من هنا (§4): الوسوم ثم العزل الاتجاهي ثم
   علامات المقاطع. الحساب كله في `lib/session/board/rich-text` ولا
   يبقى هنا إلا الرسم.

   ترتيب التعشيش ثابت: `bdi` للتتابع الكامل في الخارج، ثم مدى
   الزخرفة، ثم عنصر التنسيق. فالتتابع الاتجاهي لا ينشقّ عند وسمٍ
   ولا عند علامة، وتبقى `1 cm²` وحدةً واحدة في العين. */

function Styled({ piece, pen }: { piece: Piece; pen: Pen | null }) {
  const { style, text } = piece;
  if (!style) return <>{text}</>;

  switch (style.kind) {
    case "bold":
      return <strong className="font-bold">{text}</strong>;
    case "keyword":
      return <strong className="font-bold text-ink">{text}</strong>;
    case "underline":
      return <u className="underline decoration-1 underline-offset-4">{text}</u>;
    case "strike":
      return <s className="line-through decoration-2 decoration-ink-2">{text}</s>;
    case "sup":
      return <sup>{text}</sup>;
    case "sub":
      return <sub>{text}</sub>;
    case "highlight":
      /* القلم المسمّى يغلب قلم العنصر، وبلا قلمٍ يُستعمل `mark` الافتراضي.
         الإطار والخط من أولويات `data-pen` المشتركة لا من هنا. */
      return (
        <mark
          data-pen={style.pen ?? pen ?? "mark"}
          data-mark-highlight=""
          className="rt-hl rounded-sm bg-ink/10 px-0.5 text-inherit"
        >
          {text}
        </mark>
      );
  }
}

const LANG_CODE = { Arabic: "ar", English: "en" } as const;

/* القارئ الصوتي يحتاج لفظ الحال مرة واحدة بلغة الشرح التي يوفّرها اللوح. */
function Cue({ state }: { state: "correct" | "wrong" | "strike" }) {
  const language = useBoardLanguage();
  return (
    <span lang={LANG_CODE[language]} dir="auto" className="sr-only">
      {MARK_LABEL[state][language]}
    </span>
  );
}

function Group({ group, pen }: { group: DecoGroup; pen: Pen | null }) {
  const content = group.pieces.map((piece, i) => (
    <Styled key={i} piece={piece} pen={pen} />
  ));
  const { deco } = group;
  if (!deco) return <>{content}</>;

  /* الأيقونة والنص المخفي مرة واحدة لكل مدى: تقطيعه عند حدّ تتابع
     اتجاهي يترك أجزاءه التالية بلا تكرار (`data-rt-continued`). */
  const cue = !group.continued;
  return (
    <span
      {...decorationAttrs(deco)}
      data-pen={deco.highlight ? (pen ?? "mark") : undefined}
      data-rt-continued={group.continued ? "" : undefined}
      className={deco.highlight ? "rt-hl rounded-sm bg-ink/10 px-0.5" : undefined}
    >
      {cue && deco.answer ? (
        <span data-mark-icon="" aria-hidden="true">
          {deco.answer === "correct" ? (
            <CheckIcon className="h-full w-full" />
          ) : (
            <CloseIcon className="h-full w-full" />
          )}
        </span>
      ) : null}
      {cue && deco.answer ? <Cue state={deco.answer} /> : null}
      {cue && deco.strike ? <Cue state="strike" /> : null}
      {content}
    </span>
  );
}

/** الجوهر المشترك: `RichText` يغلّفه بـ`dir="auto"`.

   والأنواع النصّية تطلب `none`: كشف `dir="auto"` يتخطّى كل نسلٍ له
   `dir` ويتخطّى `bdi`، فلو غلّف النصّ نفسَه بـ`dir` لعمي الأب عنه
   وعاد كل سطرٍ إلى اللاتينية. فيضع النوع `dir="auto"` على حاويته
   ويُرسَم المحتوى مباشرةً تحتها. */
export function RichTextCore({
  text,
  markup,
  pen,
  spans,
  renderBlank,
  wrap = "auto",
  emphasis,
}: RichTextProps & { wrap?: "auto" | "none"; emphasis?: string[] }) {
  const nodes = layoutRichText(text, {
    markup,
    blanks: renderBlank !== undefined,
    spans,
    emphasis,
  });

  const body = (
    <>
      {nodes.map((node, i) => {
        if (node.type === "blank") {
          return <Fragment key={i}>{renderBlank?.(node.index)}</Fragment>;
        }
        const groups = node.groups.map((group, g) => (
          <Group key={g} group={group} pen={pen} />
        ));
        return node.type === "ltr" ? (
          <bdi key={i} dir="ltr">
            {groups}
          </bdi>
        ) : (
          <Fragment key={i}>{groups}</Fragment>
        );
      })}
    </>
  );

  return wrap === "none" ? body : <span dir="auto">{body}</span>;
}

export function RichText(props: RichTextProps) {
  return <RichTextCore {...props} />;
}
