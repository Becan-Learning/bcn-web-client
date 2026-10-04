import type { BoardKindProps } from "./kind-props";

export function TimelineItem({ item }: BoardKindProps<"timeline">) {
  return (
    <div className="leading-base text-ink">
      <p dir="auto">{item.payload.axisLabel}</p>
      <ol>
        {item.payload.divisions.map((division, i) => <li key={i} dir="auto">{division}</li>)}
      </ol>
    </div>
  );
}
