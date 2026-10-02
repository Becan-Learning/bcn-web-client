"use client";

import { useState } from "react";
import { GhostButton, QuietLink } from "@/components/becan/kit";
import { SettingsCard } from "../_shell";

/* S4 — تنزيل البيانات.

   التصدير لا يقع فورًا: يُجهَّز ثم يوصل رابطه — والصدق في ذلك أفضل
   من دوّامة تحميل تكذب. لهذا الزرّ يقول ما سيحدث، والحالة بعده تقول
   أين يجده. */

export function DataView() {
  const [asked, setAsked] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard title="نزّل بياناتك">
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          ملف واحد فيه جلساتك وتقدّمك في كل مقرر، وأسئلتك وإجاباتك، ومواعيد
          اختباراتك، وبيانات حسابك. بصيغة تفتحها في أي جدول.
        </p>

        {asked ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 rounded-md bg-tint-amber p-4 leading-base text-ink"
          >
            نجهّز ملفك الحين، ويوصلك رابط تنزيله على بريدك خلال ساعة. الرابط
            يشتغل 7 أيام.
          </p>
        ) : (
          <GhostButton
            onClick={() => setAsked(true)}
            className="mt-5 w-full sm:w-fit"
          >
            نزّل بياناتي
          </GhostButton>
        )}
      </SettingsCard>

      <SettingsCard title="حذف الحساب">
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          الحذف نهائي وما يترجع. قبل ما تقرّر، الصفحة الجاية تشرح لك بالضبط وش
          ينحذف ووش يبقى وكم ياخذ.
        </p>

        <div className="mt-4">
          <QuietLink href="/settings/delete">اقرأ وش يصير قبل الحذف</QuietLink>
        </div>
      </SettingsCard>
    </div>
  );
}
