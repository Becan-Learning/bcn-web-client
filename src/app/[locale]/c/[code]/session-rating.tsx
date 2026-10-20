"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "radix-ui";
import { CloseIcon, StarIcon } from "@/components/becan/icons";
import { PrimaryButton } from "@/components/becan/kit";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LIMIT_PARAM, RATE_PARAM } from "@/lib/session/rating";

/* تقييم الحصة — بطاقة صغيرة غير مانعة تظهر مرة واحدة في صفحة المقرر بعد الحصة (ADR 0006).
   الضغط على نجمة يفتح نافذة بها النجوم والملاحظة وزر الإرسال، والتقييم يُرسل إلى Langfuse
   مربوطًا بغرفة LiveKit نفسها فيُقرأ بجانب ما سجّله الوكيل عن الحصة.

   - البطاقة بلا كهرمانيّ: الكهرمانيّ الوحيد هو زر «أرسل التقييم» داخل النافذة (النمط ٨).
   - إغلاق البطاقة أو إرسال التقييم يحذف معاملَي الرابط (`rate` و`limit`) بـ`router.replace`،
     فلا يُعيدها تحديثٌ ولا رجوع. إغلاق النافذة دون إرسال يعيد الطالب إلى البطاقة،
     وتبقى نجمته وملاحظته إن فتحها ثانية: لا يضيع نصٌّ كتبه بضغطة خاطئة.
   - بلا حركة دخول، فلا شيء يخالف `prefers-reduced-motion`. */

const subscribeNever = () => () => {};

const RATINGS = ["bad", "poor", "acceptable", "good", "excellent"] as const;

export function SessionRating({ room }: { room: string | null }) {
  const t = useTranslations("SessionRating");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const notesId = useId();
  const groupName = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  /* الغرفة تُحفظ عند الوصول: حذف المعامل من الرابط يُفرغ الخاصية، والنافذة قد تبقى مفتوحة بعد الإرسال. */
  const [captured, setCaptured] = useState(room);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  /* المنطقة الحيّة تُرسم فارغة على الخادم ثم تمتلئ بعد التحميل: التغيير هو ما يُعلَن، لا الرسم الأول. */
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  /* حصة جديدة على المثيل نفسه: بطاقة جديدة بحالة نظيفة. */
  if (room && room !== captured) {
    setCaptured(room);
    setDismissed(false);
    setOpen(false);
    setRating(0);
    setNotes("");
    setStatus("idle");
  }

  if (!captured) return null;

  const clearParams = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete(RATE_PARAM);
    params.delete(LIMIT_PARAM);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const dismiss = () => {
    setDismissed(true);
    clearParams();
  };

  const choose = (value: number) => {
    setRating(value);
    if (status === "error") setStatus("idle");
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: captured, sessionExperience: rating, notes }),
      });
      if (res.ok) {
        setStatus("sent");
        dismiss();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {dismissed ? null : (
        <section
          aria-labelledby={titleId}
          onKeyDown={(event) => { if (event.key === "Escape") dismiss(); }}
          className="fixed inset-x-4 bottom-4 z-30 rounded-xl border border-line bg-surface p-4 shadow-lift md:inset-x-auto md:end-6 md:bottom-6 md:w-80"
        >
          <div className="flex items-start justify-between gap-3">
            <p id={titleId} className="pt-2.5 font-semibold text-ink">{t("title")}</p>
            <button
              type="button"
              aria-label={t("close")}
              onClick={dismiss}
              className="-mt-1 -me-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="mt-1 flex gap-1">
            {RATINGS.map((id, i) => (
              <button
                key={id}
                type="button"
                aria-label={t(`rating.${id}`)}
                title={t(`rating.${id}`)}
                onClick={() => choose(i + 1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-aubergine-mid hover:bg-tint-aubergine"
              >
                <StarIcon outline className="h-6 w-6" />
              </button>
            ))}
          </div>
        </section>
      )}
      <p role="status" className="sr-only">{mounted ? t("title") : ""}</p>

      {/* النافذة أخٌ للبطاقة لا ابنها: أحداث React تصعد عبر البوابة، وإلا أغلق Escape فيها البطاقة أيضًا. */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ground/80" />
          <Dialog.Content
            ref={contentRef}
            dir={locale === "ar" ? "rtl" : "ltr"}
            data-theme="light"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              contentRef.current?.querySelector<HTMLInputElement>("input[type=radio]:checked")?.focus();
            }}
            className="fixed top-1/2 start-1/2 z-50 max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-surface p-6 ltr:-translate-x-1/2 rtl:translate-x-1/2"
          >
            <p role="status" className="sr-only">{status === "sent" ? t("sent") : ""}</p>
            {status === "sent" ? (
              <>
                <Dialog.Title className="font-display text-2xl font-bold text-ink">{t("sent")}</Dialog.Title>
                <div className="mt-6">
                  <Dialog.Close asChild>
                    <button type="button" autoFocus className="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold text-ink">{t("close")}</button>
                  </Dialog.Close>
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                <Dialog.Title className="font-display text-2xl font-bold text-ink">{t("title")}</Dialog.Title>

                <fieldset className="mt-4">
                  <legend className="sr-only">{t("ratingLabel")}</legend>
                  <div className="flex gap-1">
                    {RATINGS.map((id, i) => {
                      const label = t(`rating.${id}`);
                      const value = i + 1;
                      const on = value <= rating;
                      return (
                        <label
                          key={id}
                          title={label}
                          className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                            on ? "text-aubergine-mid" : "text-ink-2"
                          }`}
                        >
                          <input
                            type="radio"
                            name={groupName}
                            value={value}
                            checked={rating === value}
                            onChange={() => setRating(value)}
                            className="sr-only"
                          />
                          <span className="sr-only">{label}</span>
                          {/* غير المختارة حدٌّ بلا تعبئة — الفرق شكلٌ لا لونان متقاربان */}
                          <StarIcon outline={!on} className="h-6 w-6" />
                        </label>
                      );
                    })}
                  </div>
                  <p aria-hidden="true" className="mt-1 min-h-6 text-sm font-semibold text-ink-2">
                    {rating ? t(`rating.${RATINGS[rating - 1]}`) : ""}
                  </p>
                </fieldset>

                <label htmlFor={notesId} className="mt-4 block font-semibold text-ink">{t("notes")}</label>
                <textarea
                  id={notesId}
                  dir="auto"
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 leading-base text-ink"
                />

                {status === "error" ? <p role="alert" className="mt-3 text-sm font-semibold text-error">{t("error")}</p> : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <PrimaryButton type="submit" disabled={!rating || status === "sending"}>
                    {status === "sending" ? t("sending") : t("submit")}
                  </PrimaryButton>
                  <Dialog.Close asChild>
                    <button type="button" className="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold text-ink">{t("cancel")}</button>
                  </Dialog.Close>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
