"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { SaveNotice, Toggle, useSaveNotice } from "../_controls";
import { SettingsCard } from "../_shell";

/* S3 — الإشعارات.

   **واتساب هو الافتراضي المفعّل** — قناة الطالب السعودي الفعلية،
   والبريد قناة احتياطية عنده لا قناته الأولى.

   **كل نوع بمفتاح مستقل، ولا مفتاح واحد شامل**: المفتاح الشامل يجعل
   الطالب يطفئ كل شيء ليتخلّص من إشعار واحد يزعجه، فيفقد التذكير قبل
   اختباره وهو أنفع ما نرسله.

   «اقتراب نفاد الدقائق» داخل التطبيق فقط: رسالة واتساب تقول «دقائقك
   خلصت» تُقرأ مطالبة بالدفع، وهي في مكانها داخل الشاشة حين يقع الحدّ. */

type ChannelId = "whatsapp" | "email" | "inapp";

type Kind = {
  id: string;
  title: string;
  effect: string;
  channels: ChannelId[];
};

const CHANNEL_LABEL = {
  whatsapp: "whatsapp",
  email: "email",
  inapp: "inapp",
} as const;

const KINDS = [
  {
    id: "exam",
    title: "examTitle",
    effect:
      "examEffect",
    channels: ["whatsapp", "email"],
  },
  {
    id: "ready",
    title: "readyTitle",
    effect: "readyEffect",
    channels: ["whatsapp", "email"],
  },
  {
    id: "quota",
    title: "quotaTitle",
    effect:
      "quotaEffect",
    channels: ["inapp"],
  },
] as const satisfies readonly Kind[];

/* واتساب مفعّل افتراضيًا، والبريد مطفأ — لا نرسل على قناتين لنفس الخبر. */
const START: Record<string, Partial<Record<ChannelId, boolean>>> = {
  exam: { whatsapp: true, email: false },
  ready: { whatsapp: true, email: false },
  quota: { inapp: true },
};

export function NotificationsView() {
  const t = useTranslations("Settings.Notifications");
  const { saved, ping } = useSaveNotice();
  const [state, setState] = useState(START);

  const flip = (kind: string, channel: ChannelId, next: boolean) => {
    setState((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], [channel]: next },
    }));
    ping();
  };

  return (
    <div className="flex flex-col gap-4">
      <SaveNotice saved={saved} />

      {KINDS.map((k) => (
        <SettingsCard key={k.id} title={t(k.title)}>
          <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">
            {t(k.effect)}
          </p>

          <ul className="mt-4 flex flex-col">
            {k.channels.map((c) => {
              const id = `notify-${k.id}-${c}`;
              const on = !!state[k.id]?.[c];
              return (
                <li
                  key={c}
                  className="flex items-center justify-between gap-4 border-t border-line py-2 first:border-0"
                >
                  <label htmlFor={id} className="font-semibold text-ink">
                    {t(CHANNEL_LABEL[c])}
                  </label>

                  <Toggle
                    id={id}
                    checked={on}
                    onChange={(next) => flip(k.id, c, next)}
                    label={t("channelLabel", { kind: t(k.title), channel: t(CHANNEL_LABEL[c]) })}
                  />
                </li>
              );
            })}
          </ul>
        </SettingsCard>
      ))}

      <p className="text-sm leading-base text-ink-2">
        {t("billingAlways")}
      </p>
    </div>
  );
}
