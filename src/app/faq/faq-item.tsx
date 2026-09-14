import { Chevron } from "@/components/becan/icons";
import { Copy } from "@/components/becan/kit";
import type { Question } from "@/lib/data/faq";

/* سؤال واحد قابل للطيّ — مشترك بين صفحة الأسئلة واللاندينج.

   بلا `"use client"`: مكوّن عرض خالص بلا حالة، فيصلح داخل شجرة
   الخادم وداخل `faq-view` العميل معًا.

   الطيّ بـ`<details>` الأصلي: يفتح بلا جافاسكربت، ويبحث فيه المتصفّح
   بـ Ctrl+F، ويُبلَّغ القارئ الصوتي بحالته بلا سمات نضيفها. */

export function FaqItem({
  item,
  open = false,
}: {
  item: Question;
  /** صفحة الأسئلة تفتحها كلها حين يرشّح البحث */
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-b border-line last:border-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span>
          <Copy>{item.q}</Copy>
        </span>
        <Chevron className="h-4 w-4 shrink-0 text-ink-2 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="flex flex-col gap-3 px-4 pb-5">
        {item.a.map((line) => (
          <p key={line} className="leading-base text-ink-2">
            <Copy>{line}</Copy>
          </p>
        ))}
      </div>
    </details>
  );
}
