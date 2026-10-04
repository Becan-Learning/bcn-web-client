import type { BoardKindProps } from "./kind-props";
import { UNSUPPORTED_LABEL } from "./labels";

export function UnsupportedItem({ language }: BoardKindProps<"unsupported">) {
  return <p dir="auto" className="leading-base text-ink-2">{UNSUPPORTED_LABEL[language]}</p>;
}
