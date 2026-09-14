"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Dialog } from "radix-ui";
import { ArrowForward, ExpandIcon, ShrinkIcon } from "@/components/becan/icons";
import { SlidesMessage } from "./parts";

/* لوح الشرائح — ملف PDF الحقيقي عبر react-pdf.

   كومة بطاقات كتصميم الجلسة: رأسية على الديسكتوب وأفقية على الجوال.
   الشريحة المفتوحة تتبع طلب الوكيل (`scroll`)، واختيار الطالب يغلب
   التتبّع حتى يطلب الوكيل شريحة أخرى. والعامل يُحزَم محليًا من
   pdfjs-dist بنسخة react-pdf نفسها — لا CDN خارجي. */

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/* عرض العنصر بمرجع نداء — React 19 يقبل دالّة تنظيف منه */
function useWidth() {
  const [width, setWidth] = useState(0);
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  };
  return [ref, width] as const;
}

/* عرض العنصر وارتفاعه معًا — للشريحة المكبَّرة التي تتّسع في المحورين */
function useSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  };
  return [ref, size] as const;
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SlidesPane({
  url,
  agentPage,
}: {
  url: string;
  agentPage: number | null;
}) {
  const [numPages, setNumPages] = useState(0);
  const [picked, setPicked] = useState<{ page: number; agentPage: number | null } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  /* الشرائح التي اقتربت من المرأى مرة — تُرسم وتبقى مرسومة */
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
  const [cardRef, cardWidth] = useWidth();
  const [zoomRef, zoomBox] = useSize();
  /* نسبة الصفحة من ملف PDF نفسه، و16:9 إلى أن تُحمَّل */
  const [ratio, setRatio] = useState(16 / 9);
  /* الشريحة المكبَّرة تتّسع كاملةً بلا تمرير: أصغر العرضين، عرض الحاوية
     أو ما يسمح به ارتفاعها — ناقص حدّ الإطار (2px من كل جهة) */
  const zoomWidth = Math.max(
    0,
    Math.floor(Math.min(zoomBox.width - 4, (zoomBox.height - 4) * ratio)),
  );
  const listRef = useRef<HTMLOListElement>(null);

  const clamp = (p: number) => (numPages > 0 ? Math.min(Math.max(p, 1), numPages) : p);
  /* اختيار الطالب قائم ما دام الوكيل لم يطلب غير ما كان يطلبه لحظته */
  const page =
    picked && picked.agentPage === agentPage ? clamp(picked.page) : clamp(agentPage ?? 1);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-page="${page}"]`)
      ?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: reducedMotion() ? "auto" : "smooth",
      });
  }, [page, numPages]);

  /* رسم كسول بلا سقف: كل بطاقة تُرسم حين تقترب من المرأى (بهامش 600px
     في المحورين — رأسيًا على الديسكتوب وأفقيًا على الجوال)، ولا تُفكّ
     بعدها فلا يُعاد رسمها عند الرجوع. الحالة تُضبط داخل ردّ المراقب
     لا في جسم التأثير (react-hooks/set-state-in-effect). */
  useEffect(() => {
    const root = listRef.current;
    if (!root || numPages === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const fresh = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.page));
        if (fresh.length === 0) return;
        setSeen((prev) => {
          if (fresh.every((p) => prev.has(p))) return prev;
          const next = new Set(prev);
          fresh.forEach((p) => next.add(p));
          return next;
        });
      },
      { root, rootMargin: "600px" },
    );

    root.querySelectorAll("li[data-page]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, [numPages]);

  /* ————— التكبير ————— */
  const go = (p: number) => setZoom(clamp(p));
  /* الإغلاق يترك العمود على آخر شريحة رآها الطالب مكبَّرة */
  const closeZoom = () => {
    if (zoom !== null) setPicked({ page: zoom, agentPage });
    setZoom(null);
  };

  return (
    <Document
      file={url}
      onLoadSuccess={({ numPages: n }) => setNumPages(n)}
      loading={<SlidesMessage text="تجهيز الشرائح…" />}
      error={<SlidesMessage text="ما قدرنا نفتح الشرائح. جرّب تحدّث الصفحة." />}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ol
        ref={listRef}
        aria-label="الشرائح"
        className="no-scrollbar flex min-h-0 flex-1 gap-3 overflow-x-auto px-1.5 py-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto"
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
          const open = p === page;
          const drawn = seen.has(p) || Math.abs(p - page) <= 1;
          return (
            <li key={p} data-page={p} className="w-[72%] shrink-0 md:w-auto">
              {/* الإطار الجوزيّ يشير إلى الشريحة المفتوحة — حدّ لا يحمل نصًا */}
              <div
                className={`relative overflow-hidden rounded-lg bg-panel transition-colors ${
                  open ? "border-[3px] border-warmth ring-4 ring-warmth/35" : "border border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPicked({ page: p, agentPage })}
                  aria-current={open ? "true" : undefined}
                  aria-label={`الشريحة ${p}`}
                  /* الحاوية تقصّ ما خارجها، فالحلقة ترتسم داخل الزرّ */
                  className="block w-full focus-visible:outline-offset-[-3px]"
                >
                  {/* aspect-video على الفارغة أيضًا: للبطاقة حجمها الحقيقي
                      قبل الرسم فيرصدها المراقب في موضعها */}
                  <span
                    ref={open ? cardRef : undefined}
                    dir="ltr"
                    className="block aspect-video w-full overflow-hidden"
                  >
                    {drawn && cardWidth > 0 ? (
                      <Page
                        pageNumber={p}
                        width={cardWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={null}
                      />
                    ) : null}
                  </span>
                </button>

                <div className="absolute top-1 end-1 flex items-center gap-1">
                  <span className="rounded-pill bg-ground/85 px-1.5 text-[10px] font-semibold text-ink">
                    {p}
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(p)}
                    aria-label={`كبّر الشريحة ${p}`}
                    title="تكبير"
                    className="group/zoom flex h-11 w-11 items-center justify-center pointer-fine:md:h-8 pointer-fine:md:w-8"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-ground/85 text-ink-2 transition-colors group-hover/zoom:text-ink">
                      <ExpandIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>

                {/* «ابدأ الشرح من هنا» — لا ربط بعد بين الشريحة ودرسها عند الوكيل */}
                {picked?.page === p && picked.agentPage === agentPage ? (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center p-2">
                    <button
                      type="button"
                      aria-disabled
                      title="قريبًا"
                      className="inline-flex min-h-11 items-center rounded-pill border border-dashed border-ink-3 bg-ground/85 px-3 text-xs font-bold text-ink-2"
                    >
                      ابدأ الشرح من هنا — قريبًا
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <Dialog.Root
        open={zoom !== null}
        onOpenChange={(o) => {
          if (!o) closeZoom();
        }}
      >
        <Dialog.Portal>
          <div data-theme="dark" data-surface="session" className="text-ink">
            <Dialog.Content
              aria-describedby={undefined}
              /* الأسهم في RTL: اليسار «التالية» واليمين «السابقة» */
              onKeyDown={(e) => {
                if (zoom === null) return;
                const target =
                  e.key === "ArrowLeft"
                    ? zoom + 1
                    : e.key === "ArrowRight"
                      ? zoom - 1
                      : e.key === "Home"
                        ? 1
                        : e.key === "End"
                          ? numPages
                          : null;
                if (target === null) return;
                e.preventDefault();
                go(target);
              }}
              className="fixed inset-0 z-50 flex flex-col bg-ground/90 p-4 backdrop-blur-sm"
            >
              {/* العدّاد المرئي واحد — تحت الشريحة قرب الإبهام؛ العنوان للقارئ الصوتي */}
              <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-3 pb-2">
                <Dialog.Title className="sr-only">
                  الشريحة {zoom} من {numPages}
                </Dialog.Title>
                <Dialog.Close
                  aria-label="أغلق التكبير"
                  className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink pointer-fine:md:h-8 pointer-fine:md:w-8"
                >
                  <ShrinkIcon className="h-4 w-4" />
                </Dialog.Close>
              </div>

              <div
                ref={zoomRef}
                dir="ltr"
                className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden"
              >
                {zoom !== null && zoomWidth > 0 ? (
                  <span className="block overflow-hidden rounded-xl border-2 border-warmth bg-panel">
                    <Page
                      pageNumber={zoom}
                      width={zoomWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={null}
                      onLoadSuccess={(pg) => {
                        if (pg.originalWidth > 0 && pg.originalHeight > 0) {
                          setRatio(pg.originalWidth / pg.originalHeight);
                        }
                      }}
                    />
                  </span>
                ) : null}
              </div>

              {/* التنقّل تحت الشريحة — في متناول الإبهام (نمط 10).
                  السابقة في بداية السطر (يمين) والتالية في نهايته (يسار). */}
              {zoom !== null ? (
                <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 pt-3">
                  <ZoomNav
                    label="الشريحة السابقة"
                    disabled={zoom <= 1}
                    onClick={() => go(zoom - 1)}
                  >
                    <ArrowForward className="h-5 w-5 rotate-180" />
                  </ZoomNav>
                  <p aria-live="polite" className="min-w-20 text-center text-sm font-semibold text-ink">
                    {zoom} من {numPages}
                  </p>
                  <ZoomNav
                    label="الشريحة التالية"
                    disabled={zoom >= numPages}
                    onClick={() => go(zoom + 1)}
                  >
                    <ArrowForward className="h-5 w-5" />
                  </ZoomNav>
                </div>
              ) : null}
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </Document>
  );
}

function ZoomNav({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      aria-disabled={disabled ? true : undefined}
      className={`flex h-11 w-11 items-center justify-center rounded-pill border border-line transition-colors ${
        disabled ? "text-ink-2 opacity-45" : "bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}
