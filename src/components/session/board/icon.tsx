import type { BoardKindProps } from "./kind-props";

export function IconItem({ item }: BoardKindProps<"icon">) {
  return <span dir="auto" className="leading-base text-ink">{item.payload.label}</span>;
}
