import type { BoardKindProps } from "./kind-props";

export function NoteItem({ item }: BoardKindProps<"note">) {
  return <p dir="auto" className="text-sm leading-base text-ink-2">{item.payload.text}</p>;
}
