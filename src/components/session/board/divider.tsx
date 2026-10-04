import type { BoardKindProps } from "./kind-props";

export function DividerItem(props: BoardKindProps<"divider">) {
  void props;
  return <hr className="border-0 border-t border-chalkboard-edge" />;
}
