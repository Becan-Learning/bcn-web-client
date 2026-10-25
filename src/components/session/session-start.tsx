"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useRouter } from "@/i18n/navigation";
import { QuotaBlock } from "@/components/becan/quota";
import type { UsedUpQuota } from "@/lib/allowance/presentation";
import { TopBar } from "./parts";
import { useReducedMotion } from "./use-reduced-motion";

/* الغلاف — سطح الجلسة الداكن، والدخول تلاشٍ 250ms */
export function SessionShell({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  return (
    <motion.div
      data-theme="dark"
      data-surface="session"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-dvh flex-col bg-ground text-ink"
    >
      {children}
    </motion.div>
  );
}

export function SessionUsedUp({ courseName, courseSlug, chapterNo, chapterTitle, quota }: {
  courseName: string;
  courseSlug: string;
  chapterNo: number;
  chapterTitle: string;
  quota: UsedUpQuota;
}) {
  const t = useTranslations("Session");
  const router = useRouter();
  const reduce = useReducedMotion();
  const onExit = () => router.push(`/c/${courseSlug}`);

  return (
    <SessionShell reduce={reduce}>
      <TopBar phase="idle" courseName={courseName} chapterNo={chapterNo} onExit={onExit} />
      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-5 py-8 md:justify-center md:py-10">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">{chapterTitle}</h1>
        <div className="mt-6"><QuotaBlock {...quota} surface="session" /></div>
        <div className="mt-auto pt-8 md:mt-0">
          <button type="button" onClick={onExit}
            className="inline-flex min-h-12 items-center justify-center rounded-pill border border-line bg-surface px-6 font-semibold text-ink hover:bg-surface-2">
            {t("backCourse")}
          </button>
        </div>
      </main>
    </SessionShell>
  );
}
