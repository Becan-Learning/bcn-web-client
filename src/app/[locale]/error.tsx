"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  PageShell,
  PrimaryButton,
  QuietLink,
  Section,
  SiteHeader,
} from "@/components/becan/kit";

/* E2 — خطأ عام.

   ثلاثة أجزاء: **ماذا حدث · لماذا · ماذا تفعل الآن**.

   **ممنوع رمز خطأ خام بلا شرح**: `digest` معروض لأنه يختصر على الدعم
   نصف المحادثة، لكنه مسبوق بسطر يقول ما هو ولمن — فلا يقرأه الطالب
   تعويذة. وإن لم يصل digest فلا يُعرض مكانه فراغ ولا «غير معروف».

   بلا `<html>` و`<body>`: هذا خطأ داخل التخطيط لا `global-error`. */

export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  return (
    <PageShell>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="max-w-measure">
          {/* ماذا حدث */}
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}
          </h1>

          {/* لماذا */}
          <p className="mt-4 leading-base text-ink-2">
            {t("body")}
          </p>

          {/* ماذا تفعل الآن */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryButton onClick={reset} className="w-full sm:w-fit">
              {t("retry")}
            </PrimaryButton>

            <QuietLink href="/home">{t("courses")}</QuietLink>
          </div>

          <p className="mt-8 text-sm text-ink-2">
            {t.rich("help", {
              contact: (chunks) => (
                <Link
                  href="/contact"
                  className="font-semibold text-pressable underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
              status: (chunks) => (
                <Link
                  href="/status"
                  className="font-semibold text-pressable underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          {/* الرمز بعد شرحه لا قبله — ولمن يفيده */}
          {error.digest ? (
            <p className="mt-4 text-sm text-ink-2">
              {t.rich("digest", {
                digest: error.digest,
                code: (chunks) => (
                  <span dir="ltr" className="font-semibold text-ink">{chunks}</span>
                ),
              })}
            </p>
          ) : null}
        </div>
      </Section>
    </PageShell>
  );
}
