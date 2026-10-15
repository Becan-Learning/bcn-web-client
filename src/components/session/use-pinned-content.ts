"use client";

import { useEffect, useState } from "react";
import { LESSONS_FILE, SLIDES_FILE, activeContentPath, contentProxyUrl, lessonsNeedRefetch, parseLessons } from "@/lib/session/content";
import type { Lesson } from "@/lib/session/session-reducer";

/* محتوى الحصة بعد وصول الرمز. الصفحة تعرض قبل «ابدأ» الدروس والشرائح من مسار الكتالوج
   (لا رمز قبل الضغط: الرمز يفتح الحصة ويحسب منها). فإذا رجع الرمز بمسار مثبَّت مختلف
   — نسخة محتوى حيّة تغيّرت، أو حصة مستمرّة ثُبّتت على نسخة أقدم — تبنّينا المسار المثبَّت:
   نقرأ منه الشرائح، ونعيد جلب الدروس عبر وسيط Bunny نفسه. وهو المسار الذي يقرأ منه الوكيل. */
export function usePinnedContent(catalogPath: string, catalogLessons: Lesson[]) {
  const [pinned, setPinned] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ path: string; lessons: Lesson[] } | null>(null);

  useEffect(() => {
    if (!lessonsNeedRefetch(catalogPath, pinned)) return;
    const request = new AbortController();
    fetch(contentProxyUrl(pinned, LESSONS_FILE), { signal: request.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (data !== null) setFetched({ path: pinned, lessons: parseLessons(data) });
      })
      .catch(() => undefined);
    return () => request.abort();
  }, [pinned, catalogPath]);

  const path = activeContentPath(catalogPath, pinned);
  return {
    onPinned: setPinned,
    pdfUrl: contentProxyUrl(path, SLIDES_FILE),
    lessons: pinned !== null && fetched?.path === pinned ? fetched.lessons : catalogLessons,
  };
}
