import type { TermPayload } from "@/lib/session/teaching-board";

/* المصطلح ثنائي اللغة (§5.3).

   الصيغة الإنجليزية هي ما يظهر في ورقة الاختبار فهي الأساسية،
   والعربية شرحٌ ثانويّ. والخطّان في رمزٍ واحد، فيلزمه عزل ثنائيّ
   خاصّ به: `isolate` على الحاوية و`dir` صريح لكل نصف. وهذا هو
   الحال الشائع على لوحٍ عربيّ لا الحالة الشاذّة. */

export function TermItem({ payload }: { payload: TermPayload }) {
  return (
    <p className="leading-base">
      <span
        style={{ unicodeBidi: "isolate" }}
        className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
      >
        <span dir="ltr" className="font-semibold text-ink [overflow-wrap:anywhere]">
          {payload.en}
        </span>
        <span dir="rtl" className="text-sm leading-base text-ink-2">
          ({payload.ar})
        </span>
      </span>
    </p>
  );
}
