"use client";

import { useLocale, useTranslations } from "next-intl";
import { localize } from "@/i18n/localized";
import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { SearchIcon } from "@/components/becan/icons";
import { FaqItem } from "./faq-item";
import { FAQ } from "@/lib/data/faq";

/* H1 — الأسئلة الشائعة.

   **بحث في الأعلى وأقسام قابلة للطيّ**. البحث يرشّح الأسئلة والأجوبة
   معًا: الطالب يكتب «ميكروفون» لا عنوان السؤال، والكلمة في الجواب
   لا في السؤال.

   الطيّ بـ`<details>` الأصلي: يفتح بلا جافاسكربت، ويبحث فيه المتصفّح
   بـ Ctrl+F، ويُبلَّغ القارئ الصوتي بحالته بلا سمات نضيفها.

   وحين يرشّح البحث، تُفتح النتائج كلها: الطالب بحث عن جواب لا عن
   قائمة عناوين يفتحها واحدًا واحدًا. */

const normalize = (v: string) =>
  v
    .toLowerCase()
    /* التشكيل والتطويل يُسقطان، والألف بأشكالها تُوحَّد — وإلا فشل
       البحث عن «الاشتراك» لمن كتب «الإشتراك». */
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

/* عدّ عربي سليم بدل «1 سؤال» — على نمط `countLabel` في الكتالوج. */

export function FaqView() {
  const t = useTranslations("Faq.Search");
  const locale = useLocale();
  const uid = useId();
  const [query, setQuery] = useState("");

  const q = normalize(query.trim());
  const filtering = q.length > 0;

  const groups = FAQ.map((g) => ({
    ...g,
    questions: filtering
      ? g.questions.filter((item) =>
        normalize(localize(item.q, locale) + " " + item.a.map((line) => localize(line, locale)).join(" ")).includes(q),
      )
      : g.questions,
  })).filter((g) => g.questions.length > 0);

  const hits = groups.reduce((n, g) => n + g.questions.length, 0);

  return (
    <div>
      {/* ————— البحث ————— */}
      <div className="relative max-w-measure">
        <label htmlFor={`${uid}-q`} className="sr-only">
          {t("label")}</label>
        <input
          id={`${uid}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("placeholder")}
          className="h-14 w-full rounded-pill border border-aubergine-deep bg-surface ps-14 pe-5 text-ink shadow-soft placeholder:text-ink-2"
        />
        <span className="pointer-events-none absolute inset-y-0 start-5 flex items-center text-ink-2">
          <SearchIcon className="h-5 w-5" />
        </span>
      </div>

      {filtering ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-ink-2">
          {t("hits", { count: hits, countLabel: String(hits) })}
        </p>
      ) : null}

      {/* ————— الأقسام ————— */}
      {hits === 0 ? (
        <div className="mt-8 max-w-measure rounded-xl bg-tint-amber p-5">
          <p className="font-semibold text-ink">{t("emptyTitle")}</p>
          <p className="mt-2 leading-base text-ink-2">
            {t.rich("emptyBody", { contact: (chunks) => <Link href="/contact" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link> })}
          </p>
        </div>
      ) : (
        <div className="mt-10 flex max-w-measure flex-col gap-10">
          {groups.map((g) => (
            <section key={g.id}>
              <h2 className="text-sm font-semibold text-ink-2">{localize(g.title, locale)}</h2>

              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
                {g.questions.map((item) => (
                  <FaqItem key={item.q.ar} item={item} open={filtering} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
