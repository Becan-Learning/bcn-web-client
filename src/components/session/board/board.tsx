import { useCallback, useEffect, useRef } from "react";
import type {
  BoardGroup,
  BoardItem,
  BoardRegion,
  BoardState,
} from "@/lib/session/teaching-board";
import { Caret, type SessionLanguage } from "../parts";
import { BoardItemView } from "./item";

/* ————— السبورة —————

   لم تعد قائمة واحدة بل ثلاث (§3):

     العنوان · شريط المثبَّت · عمود الحيّ · صينيّة المؤقّت

   المثبَّت مرجعٌ يعود إليه الطالب، فيقرأ سطحًا أهدأ ويبقى ظاهرًا
   حين ينزلق ما تحته. والمؤقّت التفافةُ علاج، فيقرأ مؤقّتًا بحدٍّ
   متقطّع — وهو وسم «الشيء غير المستقرّ» في هذه الواجهة أصلًا.

   والممرّر واحد: عمود الحيّ. لذلك يبقى الشريط في مكانه مهما طال
   العمود، وهو ما تطلبه §10.

   السعة يفرضها الخادم (§3) فلا سياسة فيضٍ هنا — لكن العمود يمرّر،
   لأن اثني عشر بندًا مع شريطٍ مثبَّت لا تسع شاشة جوّال رأسية. */

const BAND_LABEL = {
  pinned: { Arabic: "مرجع", English: "Reference" },
  temporary: { Arabic: "جانبيّ", English: "Aside" },
} as const;

type Block =
  | { type: "item"; item: BoardItem }
  | { type: "group"; group: BoardGroup; members: BoardItem[] };

function blocksFor(
  items: BoardItem[],
  groups: BoardGroup[],
  region: BoardRegion,
): Block[] {
  const regionItems = items.filter((item) => item.region === region);
  const blocks: Block[] = [];
  const placed = new Set<string>();

  /* الحاوية تصل قبل أوّل عضو فيها، فموضع أوّل عضو هو موضعها.
     وحاوية في منطقة أخرى تُتجاهل: البند يُرسم وحده بدل أن يتكرّر
     عنوانها في المنطقتين. */
  for (const item of regionItems) {
    const group = item.groupId
      ? groups.find(
          (candidate) => candidate.id === item.groupId && candidate.region === region,
        )
      : undefined;

    if (!group) {
      blocks.push({ type: "item", item });
      continue;
    }
    if (placed.has(group.id)) continue;

    placed.add(group.id);
    blocks.push({
      type: "group",
      group,
      members: regionItems.filter((member) => member.groupId === group.id),
    });
  }

  /* حاوية بلا أعضاء ممكنة إن رُفضت إضافةٌ لاحقة: يُرسم عنوانها
     وحده ولا ينكسر شيء (§4.4). */
  for (const group of groups) {
    if (group.region === region && !placed.has(group.id)) {
      blocks.push({ type: "group", group, members: [] });
    }
  }

  return blocks;
}

function Region({
  items,
  groups,
  region,
  language,
  reduce,
  className,
}: {
  items: BoardItem[];
  groups: BoardGroup[];
  region: BoardRegion;
  language: SessionLanguage;
  reduce: boolean;
  className?: string;
}) {
  const blocks = blocksFor(items, groups, region);

  /* ترقيم الخطوات مقصور على المنطقة (§5.1) */
  const stepNumbers = new Map<string, number>();
  items
    .filter((item) => item.region === region && item.kind === "step")
    .forEach((item, i) => stepNumbers.set(item.id, i + 1));

  const view = (item: BoardItem) => (
    <BoardItemView
      key={item.id}
      item={item}
      n={stepNumbers.get(item.id) ?? 0}
      language={language}
      reduce={reduce}
    />
  );

  return (
    <ul className={`flex flex-col gap-4 ${className ?? ""}`}>
      {blocks.map((block) =>
        block.type === "item" ? (
          view(block.item)
        ) : (
          <li
            key={block.group.id}
            className={
              block.group.kind === "box"
                ? "rounded-md border border-chalkboard-edge px-3.5 py-3"
                : undefined
            }
          >
            {block.group.heading ? (
              <p dir="auto" className="mb-2.5 text-sm leading-base font-bold text-ink-2">
                {block.group.heading}
              </p>
            ) : null}
            {/* الأعمدة تتكدّس رأسيًا تحت العنوان على الجوال (§8) */}
            <ul
              className={
                block.group.kind === "columns"
                  ? "grid grid-cols-1 gap-4 md:grid-cols-2"
                  : "flex flex-col gap-3"
              }
            >
              {block.members.map(view)}
            </ul>
          </li>
        ),
      )}
    </ul>
  );
}

export function Board({
  board,
  speaking,
  intro,
  reduce,
  language,
}: {
  board: BoardState;
  speaking: boolean;
  intro: React.ReactNode;
  reduce: boolean;
  language: SessionLanguage;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /* يتبع القاع ما دام الطالب عنده. التعديلات تصل متأخّرة عشرات
     الثواني (§6)، فانتزاعه من فراغٍ يقرؤه أسوأ من تمريرة فائتة. */
  const stick = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  const live = board.items.filter((item) => item.region === "live");
  const pinned = board.items.filter((item) => item.region === "pinned");
  const temporary = board.items.filter((item) => item.region === "temporary");

  /* الكشف يزيد الارتفاع كما تزيده الإضافة، فيُتابَع الاثنان */
  const revealed = live.reduce((sum, item) => sum + item.revealed, 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [live.length, revealed, reduce]);

  useEffect(() => {
    if (board.diverged && process.env.NODE_ENV !== "production") {
      console.warn("[board] فجوة في rev — الحالة تباعدت وتنتظر لقطة");
    }
  }, [board.diverged]);

  const empty = !board.visible || (board.title === null && board.items.length === 0);

  if (empty) {
    return (
      <div className="chalkboard flex flex-1 flex-col justify-center overflow-y-auto rounded-xl border border-chalkboard-edge px-6 pt-8 pb-20 md:px-10">
        <div className="mx-auto w-full max-w-measure">{intro}</div>
      </div>
    );
  }

  return (
    <section
      aria-label="السبورة"
      data-diverged={board.diverged ? "" : undefined}
      className="chalkboard flex min-h-0 flex-1 flex-col rounded-xl border border-chalkboard-edge px-5 pt-6 pb-20 md:px-8 md:pt-8"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-measure flex-1 flex-col gap-4">
        {board.title && board.title.kind === "title" ? (
          <p className="shrink-0 text-xl leading-base font-bold text-ink md:text-2xl">
            <span dir="auto">{board.title.payload.text}</span>
          </p>
        ) : null}

        {pinned.length > 0 ? (
          <div
            role="group"
            aria-label={BAND_LABEL.pinned[language]}
            className="shrink-0 overflow-y-auto rounded-lg border border-chalkboard-edge bg-ink/5 px-4 py-3 max-md:max-h-[30%]"
          >
            <Region
              items={board.items}
              groups={board.groups}
              region="pinned"
              language={language}
              reduce={reduce}
            />
          </div>
        ) : null}

        <div
          ref={ref}
          onScroll={onScroll}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div aria-live="polite">
            <Region
              items={board.items}
              groups={board.groups}
              region="live"
              language={language}
              reduce={reduce}
            />
            {speaking ? <Caret /> : null}
          </div>
        </div>

        {temporary.length > 0 ? (
          <div
            role="group"
            aria-label={BAND_LABEL.temporary[language]}
            className="shrink-0 overflow-y-auto rounded-lg border border-dashed border-ink-3 px-4 py-3 max-md:max-h-[25%]"
          >
            <Region
              items={board.items}
              groups={board.groups}
              region="temporary"
              language={language}
              reduce={reduce}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
