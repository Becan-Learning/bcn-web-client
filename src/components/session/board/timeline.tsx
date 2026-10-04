import { useId } from "react";
import { CheckIcon, CloseIcon } from "@/components/becan/icons";
import { decorate, decorationAttrs, penAttrs, type Decoration } from "@/lib/session/board/marks";
import type { ExplanationLanguage } from "../explanation-language";
import { MARK_LABEL } from "./labels";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";

/* خطّ زمنيّ واحد مرتَّب (§5.16).

   المحور دائمًا من اليسار إلى اليمين مهما كانت لغة اللوح: ترتيب
   التقسيمات ترتيبٌ مؤلَّف يتبع الأرقام لا اتجاه الجملة، فلا ينقلب
   «المعطى ← النتيجة» في لوحٍ عربي. والاتجاه على الحاوية الممرِّرة
   نفسها لا على المحور وحده: حاويةٌ يمينيّة تبدأ تمريرها من اليمين
   فيرى الطالب آخر تقسيمٍ قبل الأوّل. أمّا كل وسمٍ فاتجاهه من نصّه.

   لا يُرسم في الصفحة إلا ما انكشف: التقسيم الخفيّ ولواصقه غائبون من
   الشجرة كلها فلا يقرؤهم قارئ الشاشة ولا يستنتجهم الطالب. لكن عدد
   الأعمدة يُحسب من الكل فتبقى المساحة محجوزة، ولا يقفز المحور كلما
   انكشف تقسيم.

   على الجوال لا يلتفّ المحور على سطر ثانٍ ولا يُعاد ترتيبه: يتمدّد
   إلى عرضه الطبيعيّ داخل حاويةٍ تمرَّر أفقيًا وحدها، ولا يتحرّك
   موضع الطالب فيها من تلقاء نفسه. */

/** أضيق عرضٍ يُقرأ به وسم تقسيمٍ يلتفّ على أسطره */
const DIVISION_MIN_REM = 7;

/** لفظ الحالة لقارئ الشاشة: الأيقونة واللون يسقطان معًا عنده */
function stateLabels(decoration: Decoration, language: ExplanationLanguage): string[] {
  const labels: string[] = [];
  if (decoration.answer) labels.push(MARK_LABEL[decoration.answer][language]);
  if (decoration.highlight) labels.push(MARK_LABEL.highlight[language]);
  if (decoration.dim) labels.push(MARK_LABEL.dim[language]);
  if (decoration.strike) labels.push(MARK_LABEL.strike[language]);
  if (decoration.focus) labels.push(MARK_LABEL.focus[language]);
  return labels;
}

export function TimelineItem({ item, language }: BoardKindProps<"timeline">) {
  const { axisLabel, divisions, markers } = item.payload;
  const labelId = useId();
  const spans = item.marks.filter((mark) => mark.scope === "span");
  const total = divisions.length;
  const visible = Math.min(item.revealed, total);

  return (
    <div data-timeline="" className="min-w-0 leading-base text-ink">
      <p dir="auto" id={labelId} className="mb-2 text-sm font-semibold text-ink-2">
        <RichTextCore wrap="none" text={axisLabel} markup pen={item.pen} spans={spans} />
      </p>
      <div
        dir="ltr"
        role="group"
        aria-labelledby={labelId}
        tabIndex={0}
        className="max-w-full overflow-x-auto overscroll-x-contain pb-1"
      >
        <div
          className="relative w-full"
          style={{ minWidth: `${total * DIVISION_MIN_REM}rem` }}
        >
          {/* الخط يصل مركز أوّل عمود بمركز آخر عمودٍ ظاهر، فلا يمتدّ
              إلى تقسيمٍ لم ينكشف بعد */}
          {visible > 1 ? (
            <span
              aria-hidden="true"
              data-timeline-line=""
              className="absolute top-[11px] h-0.5 rounded-pill bg-ink-2"
              style={{
                insetInlineStart: `${50 / total}%`,
                width: `${((visible - 1) * 100) / total}%`,
              }}
            />
          ) : null}
          <ol
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
          >
            {divisions.slice(0, visible).map((division, index) => {
              const decoration = decorate(item, { scope: "division", index });
              const attached = markers.filter((marker) => marker.at === index);
              const states = stateLabels(decoration, language);

              return (
                <li
                  key={index}
                  data-division={index}
                  {...decorationAttrs(decoration)}
                  className="min-w-0 px-1 pb-1 text-center"
                >
                  <span className="relative flex h-6 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="size-4 rounded-pill border-2 border-ink-2 bg-chalkboard"
                    />
                  </span>
                  <p
                    dir="auto"
                    className="text-sm leading-base font-semibold [overflow-wrap:anywhere]"
                  >
                    <RichTextCore wrap="none" text={division} markup pen={item.pen} spans={spans} />
                  </p>
                  {decoration.answer ? (
                    <span data-mark-icon="">
                      {decoration.answer === "correct" ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <CloseIcon className="h-5 w-5" />
                      )}
                    </span>
                  ) : null}
                  {states.length > 0 ? <span className="sr-only">{states.join(" · ")}</span> : null}
                  {attached.length > 0 ? (
                    <ul className="mt-2 flex flex-col items-center gap-1.5">
                      {attached.map((marker) => {
                        /* قلم الواصق ثم قلم البند ثم لا قلم (§4.2) */
                        const pen = marker.pen ?? item.pen;
                        return marker.label === null ? (
                          <li
                            key={marker.id}
                            data-marker={marker.id}
                            aria-hidden="true"
                            {...penAttrs(pen)}
                            data-marker-dot=""
                            className="size-3 rounded-pill border border-chalkboard-edge"
                          />
                        ) : (
                          <li
                            key={marker.id}
                            data-marker={marker.id}
                            dir="auto"
                            {...penAttrs(pen)}
                            className="max-w-full rounded-sm border border-chalkboard-edge px-2 py-0.5 text-xs leading-base text-ink [overflow-wrap:anywhere]"
                          >
                            <span>
                              <RichTextCore wrap="none" text={marker.label} markup pen={pen} spans={spans} />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
