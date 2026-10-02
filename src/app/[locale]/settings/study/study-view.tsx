"use client";

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
  { id: "slow", label: "بطيء" },
  { id: "normal", label: "طبيعي" },
  { id: "fast", label: "سريع" },
] as const;

const FORMATS = [
  { id: "mcq", label: "اختيار من متعدد" },
  { id: "essay", label: "مقالي" },
  { id: "problems", label: "مسائل" },
] as const;

type Speed = (typeof SPEEDS)[number]["id"];
type Format = (typeof FORMATS)[number]["id"];

export function StudyView() {
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
            title="وقتك للمذاكرة"
            effect="«مستعجل» يعطيك المختصر ويركّز على الأهم. «عندي وقت» يشرح بهدوء بأمثلة ويتأكد إنك فهمت. يسري من الجلسة الجاية."
          >
            <Choice
              name="experience"
              value={experience}
              options={EXPERIENCE_OPTIONS}
              onChange={(v) => {
                setExperience(v);
                ping();
              }}
            />
          </PrefRow>

          <PrefRow
            title="سرعة الشرح الافتراضية — قريبًا"
            effect="الشرح اليوم بسرعة واحدة. هذا الخيار يُفعَّل مع دعم السرعة في الجلسة."
          >
            {/* لا ping ولا وعد بأثر: السرعة معطّلة في الجلسة نفسها */}
            <Choice name="speed" value={speed} options={SPEEDS} onChange={setSpeed} />
          </PrefRow>

          <PrefRow
            title="شكل الاختبار الافتراضي"
            effect="يحدّد شكل الأسئلة اللي تجاوب عليها بعد كل موضوع — وتقدر تحدّد شكلًا مختلفًا لكل مقرر من صفحته."
          >
            <Choice
              name="format"
              value={format}
              options={FORMATS}
              onChange={(v) => {
                setFormat(v);
                ping();
              }}
            />
          </PrefRow>
        </div>
      </SettingsCard>

      <SettingsCard title="تسجيلاتك الصوتية">
        <div className="mt-4 flex items-start justify-between gap-4">
          <label htmlFor="pref-audio" className="block">
            <span className="font-semibold text-ink">
              احتفظ بتسجيلات أسئلتي
            </span>
            <span className="mt-1 block max-w-measure text-sm leading-base text-ink-2">
              مطفأ افتراضيًا: صوتك يُحذف خلال 24 ساعة من نهاية الجلسة. بتشغيله
              يبقى 30 يومًا تقدر تسمعه فيها من صفحة الجلسة.
            </span>
          </label>

          <Toggle
            id="pref-audio"
            checked={keepAudio}
            onChange={(v) => {
              setKeepAudio(v);
              ping();
            }}
            label="احتفظ بتسجيلات أسئلتي"
          />
        </div>
      </SettingsCard>
    </div>
  );
}
