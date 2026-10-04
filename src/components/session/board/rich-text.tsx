import { Fragment, type ReactNode } from "react";
import type { Mark, Pen } from "@/lib/session/teaching-board";

export type RichTextProps = {
  text: string;
  markup: boolean;
  pen: Pen | null;
  spans: Mark[];
  renderBlank?: (index: number) => ReactNode;
};

/** الفراغات تحتفظ بترتيبها ولا تغيّر حروف النص المحيط بها. */
export function RichText({ text, renderBlank }: RichTextProps) {
  if (!renderBlank) return <span dir="auto">{text}</span>;
  const parts = text.split("___");
  return (
    <span dir="auto">
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? renderBlank(i) : null}
        </Fragment>
      ))}
    </span>
  );
}
