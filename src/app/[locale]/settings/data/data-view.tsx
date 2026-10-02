"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { GhostButton, QuietLink } from "@/components/becan/kit";
import { SettingsCard } from "../_shell";

/* S4 — تنزيل البيانات.

   التصدير لا يقع فورًا: يُجهَّز ثم يوصل رابطه — والصدق في ذلك أفضل
   من دوّامة تحميل تكذب. لهذا الزرّ يقول ما سيحدث، والحالة بعده تقول
   أين يجده. */

export function DataView() {
  const t = useTranslations("Settings.Data");
  const [asked, setAsked] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard title={t("downloadTitle")}>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("downloadBody")}
        </p>

        {asked ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 rounded-md bg-tint-amber p-4 leading-base text-ink"
          >
            {t("requested")}
          </p>
        ) : (
          <GhostButton
            onClick={() => setAsked(true)}
            className="mt-5 w-full sm:w-fit"
          >
            {t("download")}
          </GhostButton>
        )}
      </SettingsCard>

      <SettingsCard title={t("deleteTitle")}>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("deleteBody")}
        </p>

        <div className="mt-4">
          <QuietLink href="/settings/delete">{t("deleteLink")}</QuietLink>
        </div>
      </SettingsCard>
    </div>
  );
}
