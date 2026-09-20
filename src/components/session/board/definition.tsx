import type { DefinitionPayload } from "@/lib/session/teaching-board";

/* التعريف يُكشف مقطعًا مقطعًا مع الصوت (§5.2).

   المقاطع كلها مرسومة من أول لحظة، وغير المكشوف منها `invisible`:
   بذلك يُحجز ارتفاع الفقرة كاملًا فلا يقفز ما تحتها عند كل كشف،
   ولا يبلغ القارئَ الصوتي ما لم يُنطَق بعد.

   ولا مؤقّتات هنا: الوكيل يوقّت كل عملية على الصوت المنطوق، وأي
   تأخير من الصفحة يضاعف التوقيت ويفكّ التزامن (§1). */

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** يُبرز كلمات الاختبار داخل المقطع — مطابقة بلا حساسية لحالة الأحرف ولا اشتقاق */
function emphasise(chunk: string, keyWords: string[]) {
  const words = keyWords.filter((word) => word.trim().length > 0);
  if (words.length === 0) return chunk;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");

  return chunk.split(pattern).map((part, i) =>
    /* الأجزاء الفردية هي المُلتقَطة — المطابقة لا الفاصل بينها */
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-ink">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export function DefinitionItem({
  payload,
  revealed,
}: {
  payload: DefinitionPayload;
  revealed: number;
}) {
  return (
    <p dir="auto" className="leading-base text-ink">
      {payload.chunks.map((chunk, i) => {
        const shown = i < revealed;
        return (
          <span
            key={i}
            aria-hidden={shown ? undefined : "true"}
            className={
              shown
                ? "opacity-100 transition-opacity duration-300"
                : "invisible opacity-0"
            }
          >
            {emphasise(chunk, payload.keyWords)}{" "}
          </span>
        );
      })}
    </p>
  );
}
