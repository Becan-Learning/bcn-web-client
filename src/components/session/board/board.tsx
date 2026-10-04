import { BAND_LABEL, BOARD_LABEL } from "./labels";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { BoardPresence } from "./presence";
import { BoardLanguageProvider } from "./language";
import type { BoardItem, BoardState } from "@/lib/session/teaching-board";
import { itemFocusDimmed } from "@/lib/session/board/marks";
import { Caret } from "../parts";
import type { ExplanationLanguage } from "../explanation-language";
import { boardFrame } from "./frame";
import { useLocale } from "next-intl";
import { GroupShell } from "./group";
import { IconAttachmentsProvider } from "./icon";
import { BoardItemView } from "./item";
import {
  projectRegion,
  stepNumbers,
  validAttachments,
  type RegionBlock,
  type RegionEntry,
} from "./region-blocks";

/* ————— السبورة —————

   لم تعد قائمة واحدة بل ثلاث (§3):

     العنوان · شريط المثبَّت · عمود الحيّ · صينيّة المؤقّت

   المثبَّت مرجعٌ يعود إليه الطالب، فيقرأ سطحًا أهدأ ويبقى ظاهرًا
   حين ينزلق ما تحته. والمؤقّت التفافةُ علاج، فيقرأ مؤقّتًا بحدٍّ
   متقطّع — وهو وسم «الشيء غير المستقرّ» في هذه الواجهة أصلًا.

   لكل منطقة ممرّرها وسقف ارتفاعها، كي يبقى للحيّ مجالٌ مقروء
   مهما طال المرجع المثبّت أو العلاج المؤقّت.

   السعة يفرضها الخادم (§3) فلا سياسة فيضٍ هنا — لكن العمود يمرّر،
   لأن اثني عشر بندًا مع شريطٍ مثبَّت لا تسع شاشة جوّال رأسية. */

function Region({
  board,
  blocks,
  language,
  reduce,
}: {
  board: BoardState;
  blocks: RegionBlock[];
  language: ExplanationLanguage;
  reduce: boolean;
}) {
  const numbers = stepNumbers(blocks);

  const view = (item: BoardItem) => (
    <BoardItemView
      key={item.id}
      item={item}
      n={numbers.get(item.id) ?? 0}
      language={language}
      reduce={reduce}
      dimmedByFocus={itemFocusDimmed(board, item)}
    />
  );

  /* أيقونات ألصق بعضها ببعض تقف متجاورة في صفٍّ يلتفّ وحداتٍ كاملة */
  const entry = (placed: RegionEntry) =>
    placed.type === "item" ? (
      view(placed.item)
    ) : (
      <li key={placed.items[0].id} data-icon-cluster="">
        <ul className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <BoardPresence reduce={reduce}>{placed.items.map(view)}</BoardPresence>
        </ul>
      </li>
    );

  return (
    <ul className="flex flex-col gap-4">
      <BoardPresence reduce={reduce}>
        {blocks.map((block) =>
          block.type === "group" ? (
            <GroupShell key={block.group.id} group={block.group} language={language} reduce={reduce}>
              {block.entries.length > 0 ? block.entries.map(entry) : null}
            </GroupShell>
          ) : (
            entry(block)
          ),
        )}
      </BoardPresence>
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
  language: ExplanationLanguage;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  /* يتبع القاع ما دام الطالب عنده. التعديلات تصل متأخّرة عشرات
     الثواني (§6)، فانتزاعه من فراغٍ يقرؤه أسوأ من تمريرة فائتة. */
  const stick = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  const live = board.items.filter((item) => item.region === "live");
  /* الإلصاق يُحسب مرّة على اللوح كله: صلاحيته تتعلّق بمنطقة الهدف
     وحاويته، لا بالمنطقة التي تُرسم الآن. */
  const attachments = useMemo(() => validAttachments(board.items), [board.items]);

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

  const introView = (
    <div key="intro" {...boardFrame(language)} className="chalkboard font-sans leading-base flex flex-1 flex-col justify-center overflow-y-auto rounded-xl border border-chalkboard-edge px-6 pt-8 pb-20 md:px-10">
      <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto w-full max-w-measure font-sans leading-base">{intro}</div>
    </div>
  );

  const pinned = projectRegion(board, "pinned");
  const liveBlocks = projectRegion(board, "live");
  const temporary = projectRegion(board, "temporary");
  const region = (blocks: RegionBlock[]) => (
    <Region key="region" board={board} blocks={blocks} language={language} reduce={reduce} />
  );

  /* كل منطقة تُعلَن بإعلانٍ مهذَّب خاصّ بها (§4.4)، والحاويتان
     المثبَّتة والمؤقّتة تبقيان في الصفحة وإن فرغتا: منطقةٌ حيّة تُنشأ
     وفيها محتواها لا تُعلِن شيئًا، فلو وُلدت الحاوية مع أوّل بند لضاع
     إعلانه. والبنود الخفيّة غائبة من الشجرة أصلًا فلا يقرؤها القارئ،
     ولا جواب خاصّ يصل الصفحة. وحين تفرغ تفقد إطارها وحشوها فلا تأخذ
     مكانًا ولا فاصلًا. */
  return (
    <BoardLanguageProvider value={language}>
      <BoardPresence reduce={reduce}>
        {empty ? introView : (
          <section
            key="board"
            aria-label={BOARD_LABEL[language]}
            {...boardFrame(language)}
            data-diverged={board.diverged ? "" : undefined}
            className="chalkboard font-sans leading-base flex min-h-0 flex-1 flex-col rounded-xl border border-chalkboard-edge px-5 pt-6 pb-20 md:px-8 md:pt-8"
          >
            <IconAttachmentsProvider value={attachments}>
              <div className="mx-auto flex min-h-0 w-full max-w-measure flex-1 flex-col">
                {/* العنوان بند كبقية البنود: يأخذ الإطار والشارة ولفظ الحالة
                    وقلمه وعلاماته من غلاف البند نفسه، لا نسخةً ثانية منها */}
                <BoardPresence reduce={reduce}>
                  {board.title ? (
                    <ul key={board.title.id} data-board-title="" className="mb-4 shrink-0">
                      <BoardPresence reduce={reduce}>
                        <BoardItemView
                          key={board.title.id}
                          item={board.title}
                          n={0}
                          language={language}
                          reduce={reduce}
                        />
                      </BoardPresence>
                    </ul>
                  ) : null}
                </BoardPresence>

                <div
                  role="group"
                  aria-label={BAND_LABEL.pinned[language]}
                  aria-live="polite"
                  className={
                    pinned.length > 0
                      ? "mb-4 shrink-0 overflow-y-auto rounded-lg border border-chalkboard-edge bg-ink/5 px-4 py-3 max-h-[30%] md:max-h-[40%]"
                      : undefined
                  }
                >
                  <BoardPresence reduce={reduce}>{pinned.length > 0 ? region(pinned) : null}</BoardPresence>
                </div>

                <div
                  ref={ref}
                  onScroll={onScroll}
                  tabIndex={0}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  <div aria-live="polite">
                    {region(liveBlocks)}
                    {speaking ? <Caret /> : null}
                  </div>
                </div>

                <div
                  role="group"
                  aria-label={BAND_LABEL.temporary[language]}
                  aria-live="polite"
                  className={
                    temporary.length > 0
                      ? "mt-4 shrink-0 overflow-y-auto rounded-lg border border-dashed border-ink-3 px-4 py-3 max-h-[25%] md:max-h-[30%]"
                      : undefined
                  }
                >
                  <BoardPresence reduce={reduce}>{temporary.length > 0 ? region(temporary) : null}</BoardPresence>
                </div>
              </div>
            </IconAttachmentsProvider>
          </section>
        )}
      </BoardPresence>
    </BoardLanguageProvider>
  );
}
