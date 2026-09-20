"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { EquationPayload } from "@/lib/session/teaching-board";

/* المعادلات بـ KaTeX (§5.5).

   الرياضيات من اليسار إلى اليمين دائمًا ولو كان اللوح عربيًا، فيُلفّ
   العنصر بـ `dir="ltr"` وعزلٍ ثنائيّ كي لا يعيد ترتيب الجملة حوله.

   والرسم محروس: تعبيرٌ تالف يظهر نصًّا خامًا ولا يرمي — ولا يقع
   داخل المخفّض أصلًا، فالحالة لا تتعطّل بمعادلة.

   ملفّ CSS مستورد هنا لا في التخطيط، فلا تدفع ثمنَه إلا المسارات
   التي تضمّ هذا المكوّن — أي شاشة الجلسة وحدها. وخطوط KaTeX
   لاتينية ولا تظهر إلا داخل معادلة، فلا تمسّ خطّ الواجهة. */

export function EquationItem({ payload }: { payload: EquationPayload }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(payload.latex, {
        throwOnError: false,
        displayMode: payload.display,
        output: "html",
      });
    } catch {
      return null;
    }
  }, [payload.latex, payload.display]);

  if (html === null) {
    return (
      <code
        dir="ltr"
        style={{ unicodeBidi: "isolate" }}
        className="block text-sm text-ink-2 [overflow-wrap:anywhere]"
      >
        {payload.latex}
      </code>
    );
  }

  return (
    <span
      dir="ltr"
      style={{ unicodeBidi: "isolate" }}
      className={
        payload.display
          ? "block overflow-x-auto py-1 text-center text-ink"
          : "inline-block text-ink"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
