"use client";

import { useTranslations } from "next-intl";

import { useState, useSyncExternalStore } from "react";
import {
  DEFAULT_EXPERIENCE,
  EXPERIENCE_OPTIONS,
  getExperience,
  setExperience,
  subscribeExperience,
} from "@/lib/experience";
import {
  Choice,
  PrefRow,
  SaveNotice,
  Toggle,
  useSaveNotice,
} from "../_controls";
import { SettingsCard } from "../_shell";

/* S2 — تفضيلات المذاكرة.

   **كل تفضيل بسطر يشرح أثره** — لا اسمًا مجرّدًا: «سرعة الشرح» بلا
   شرح تجعل الطالب يجرّب ليعرف، والتجربة تكلّفه جلسة.

   وكلها **قابلة للتجاوز أثناء الجلسة**: هذي قيم البداية لا قيود.

   حفظ التسجيلات مطفأ افتراضيًا — والوعد به مكتوب في سياسة الخصوصية،
   فتغييره هنا يلزم تغييرها هناك. */

const SPEEDS = [
  { id: "slow", label: "slow" },
  { id: "normal", label: "normal" },
  { id: "fast", label: "fast" },
] as const;

const FORMATS = [
  { id: "mcq", label: "mcq" },
  { id: "essay", label: "essay" },
  { id: "problems", label: "problems" },
] as const;

type Speed = (typeof SPEEDS)[number]["id"];
type Format = (typeof FORMATS)[number]["id"];

export function StudyView() {
  const t = useTranslations("Settings.Study");
  const { saved, ping } = useSaveNotice();

  const [speed, setSpeed] = useState<Speed>("normal");
  const [format, setFormat] = useState<Format>("mcq");
  const [keepAudio, setKeepAudio] = useState(false);
  /* نمط الشرح يُقرأ فعلًا: يُرسل إلى الوكيل مع كل جلسة جديدة.
     مخزَّن في المتصفّح، ولقطة الخادم القيمة الافتراضية فلا ينكسر الترطيب. */
  const experience = useSyncExternalStore(
    subscribeExperience,
    getExperience,
    () => DEFAULT_EXPERIENCE,
  );

  return (
    <div className="flex flex-col gap-4">
      <SaveNotice saved={saved} />

      <SettingsCard>
        <div className="flex flex-col">
          <PrefRow
            title={t("time")}
            effect={t("timeEffect")}
          >
            <Choice
              name="experience"
              value={experience}
              options={EXPERIENCE_OPTIONS.map((o) => ({ ...o, label: t(o.id) }))}
              onChange={(v) => {
                setExperience(v);
                ping();
              }}
            />
          </PrefRow>

          <PrefRow
            title={t("speed")}
            effect={t("speedEffect")}
          >
            {/* لا ping ولا وعد بأثر: السرعة معطّلة في الجلسة نفسها */}
            <Choice name="speed" value={speed} options={SPEEDS.map((o) => ({ ...o, label: t(o.label) }))} onChange={setSpeed} />
          </PrefRow>

          <PrefRow
            title={t("format")}
            effect={t("formatEffect")}
          >
            <Choice
              name="format"
              value={format}
              options={FORMATS.map((o) => ({ ...o, label: t(o.label) }))}
              onChange={(v) => {
                setFormat(v);
                ping();
              }}
            />
          </PrefRow>
        </div>
      </SettingsCard>

      <SettingsCard title={t("recordings")}>
        <div className="mt-4 flex items-start justify-between gap-4">
          <label htmlFor="pref-audio" className="block">
            <span className="font-semibold text-ink">
              {t("keepAudio")}
            </span>
            <span className="mt-1 block max-w-measure text-sm leading-base text-ink-2">
              {t("recordingsEffect")}
            </span>
          </label>

          <Toggle
            id="pref-audio"
            checked={keepAudio}
            onChange={(v) => {
              setKeepAudio(v);
              ping();
            }}
            label={t("keepAudio")}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
