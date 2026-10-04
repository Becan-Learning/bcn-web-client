import type { BoardKindProps } from "./kind-props";

/* الفاصل تنظيمٌ لا رياضيات (§5.15): خطٌّ بعرض المساحة المتاحة بهامشٍ
   رأسيّ يتّسع لإبراز العلامة عليه، فالعنصر نفسه يحمل إطارها لا الخطّ
   الرفيع وحده. وهو بند يشغل خانة في المنطقة كأي بند. */
export function DividerItem(props: BoardKindProps<"divider">) {
  void props;
  return (
    <div className="py-2">
      <hr className="border-0 border-t-2 border-chalkboard-edge" />
    </div>
  );
}
