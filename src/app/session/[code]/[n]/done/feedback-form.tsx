"use client";

import { useState } from "react";
import { StarIcon } from "@/components/becan/icons";

/* تقييم الجلسة — يُرسل إلى Langfuse مربوطًا بغرفة LiveKit نفسها،
   فيُقرأ بجانب ما سجّله الوكيل عن الجلسة.

   محدَّد الإطار لا كهرماني: الكهرماني الوحيد في الملخّص هو فعله
   الأساسي. والملاحظة اختيارية بلا نجمة ولا تحذير (البريف). */

const RATING_LABELS = ["سيئة", "ضعيفة", "مقبولة", "جيدة", "ممتازة"];

export function FeedbackForm({ room }: { room: string }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: room, sessionExperience: rating, notes }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p role="status" className="mt-10 rounded-xl border border-line bg-surface px-5 py-4 text-ink">
        وصل تقييمك. نقرأ كل ملاحظة.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 rounded-xl border border-line bg-surface p-5 md:p-6">
      <fieldset>
        <legend className="font-semibold text-ink">كيف كانت الجلسة؟</legend>
        <div className="mt-3 flex flex-wrap gap-1">
          {RATING_LABELS.map((label, i) => {
            const value = i + 1;
            const on = value <= rating;
            return (
              <label
                key={label}
                title={label}
                className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                  on ? "text-aubergine-mid" : "text-ink-2"
                }`}
              >
                <input
                  type="radio"
                  name="rating"
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
          {rating ? RATING_LABELS[rating - 1] : ""}
        </p>
      </fieldset>

      <label htmlFor="feedback-notes" className="mt-5 block font-semibold text-ink">
        وش نحسّن؟
      </label>
      <textarea
        id="feedback-notes"
        dir="auto"
        rows={3}
        maxLength={2000}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 leading-base text-ink"
      />

      {status === "error" ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          ما وصل التقييم. تأكّد من اتصالك وجرّب مرة ثانية.
        </p>
      ) : null}

      <button
        type="submit"
        aria-disabled={!rating || status === "sending" ? true : undefined}
        className="mt-4 inline-flex h-12 items-center justify-center rounded-pill border border-aubergine-mid px-6 font-semibold text-aubergine-base"
      >
        {status === "sending" ? "يُرسل…" : "أرسل التقييم"}
      </button>
    </form>
  );
}
