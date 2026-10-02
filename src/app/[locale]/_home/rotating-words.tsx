"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/* الكلمات المتعاقبة بعد «كفاية مذاكرة».

   **متتابعة إلى الأمام دائمًا، بلا رجوع.** الكلمة الأولى مكرّرة في
   آخر العمود، فحين يبلغها العمود تُعرَض وهي نفسها الأولى — ثم يُلغى
   الانتقال ويُعاد المؤشّر إلى الصفر في قفزة غير مرئية، لأن ما قبلها
   وما بعدها الصورة نفسها. بلا هذه الحيلة يعود العمود صاعدًا أمام
   العين، وهي الحركة التي لا تريدها.

   ولكل كلمة لون من ألوان الهوية بدل مسحة تحتها — المسحة انتقلت إلى
   «مدرّسك الخصوصي» في السطر التالي، وواحدة لكل شاشة. */

const CYCLE_MS = 2600;
const SLIDE_MS = 800;

/* ارتفاع الخانة 1.5em لا 1.15: الحرف العربي له نازل — ياء ونون
   وجيم — و1.15 تقصّه عند حافّة القناع، وهو ما ظهر في اللقطة.
   والفراغ الزائد يباعد الكلمات فلا تُقرأ موصولة. */
const LINE = 1.5;

/* أربعة ألوان بطلب صريح: بنفسجي · طوبي · أحمر · أخضر.

   انحرافان مسجَّلان عن الهوية:
   - الطوبي (--warmth) «لا يحمل نصًا أبدًا» — تباينه 3.07:1، ويمرّ
     هنا لأن العنوان كبير وعريض (حدّ النص الكبير 3:1). أي تصغير
     لهذا العنوان يُسقطه.
   - الأحمر (--error) محجوز للخطأ، ونصّ الهوية يمنعه للإلحاح. */
const TONE = [
  "text-aubergine-mid", // بنفسجي — 7.62:1
  "text-warmth", // طوبي — 3.07:1، نص كبير فقط
  "text-error", // أحمر — 7.19:1
  "text-success", // أخضر — 5.53:1
];

/* ————— الإيموجي —————
   بحجمه الطبيعي يقيس 82px بجانب حرف عربيّ ارتفاعه 60px، فيغلب
   الكلمة ويفيض 2px فوق قناع الانزلاق وتحته فيُقصّ. عند 0.66em يصير
   علامةً بجانب الكلمة لا شريكًا لها، ويسع الخانة بهامش.

   ولا يُقرأ صوتيًا (`aria-hidden`): «تضيع وقتك ⏳» تُنطق «تضيع وقتك
   ساعة رملية» وهو تشويش لا معنى. */

export type Word = { word: string; emoji?: string };

export function RotatingWords({ words }: { words: readonly Word[] }) {
  const reduce = useReducedMotion() ?? false;
  const [{ i, animate }, setS] = useState({ i: 0, animate: true });
  const idx = useRef(0);

  /* القفزة الخفيّة بمؤقّت لا بـ onTransitionEnd: الحدث لا يقع في
     لسان متصفّح مخفيّ — تتجمّد الانتقالات — فيستمرّ العمود صاعدًا
     إلى الفراغ ولا يعود أبدًا. المؤقّت يقع دائمًا. */
  useEffect(() => {
    if (reduce) return;
    let snap = 0;
    const id = window.setInterval(() => {
      const next = idx.current + 1;
      idx.current = next;
      setS({ i: next, animate: true });

      /* بلغنا النسخة المكرّرة: بعد انتهاء الانزلاق نعود إلى الصفر
         بلا انتقال — والصورتان متطابقتان فلا تُرى العودة. */
      if (next === words.length) {
        snap = window.setTimeout(() => {
          idx.current = 0;
          setS({ i: 0, animate: false });
        }, SLIDE_MS + 60);
      }
    }, CYCLE_MS);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(snap);
    };
  }, [reduce, words.length]);

  /* تقليل الحركة: الأربع قائمةً — الرسالة كاملة بلا دوران */
  if (reduce) {
    return (
      <span>
        {words.map((w, n) => (
          <span key={w.word} className={TONE[n % TONE.length]}>
            {n > 0 ? <span className="text-ink-2"> · </span> : null}
            <Cell {...w} />
          </span>
        ))}
      </span>
    );
  }

  /* العمود = الكلمات ثم نسخة من الأولى، فالنهاية تطابق البداية */
  const reel = [...words, words[0]];

  return (
    <span
      className="relative block overflow-hidden"
      style={{ height: `${LINE}em` }}
    >
      <span
        className={`block ${animate ? "transition-transform duration-[800ms] ease-out" : ""}`}
        style={{ transform: `translateY(${-i * LINE}em)` }}
      >
        {reel.map((w, n) => (
          <span
            key={`${w.word}-${n}`}
            aria-hidden={n === i ? undefined : "true"}
            /* الخانة تُوسِّط كلمتها رأسيًا فيبقى للنازل متّسع.
               والشفافية تُخفت الخارجة والداخلة معًا، فلا تُقطع
               الكلمة عند حافّة القناع بل تذوب وهي تصعد.
               والنسخة الأخيرة تأخذ لون الأولى — الصورتان
               متطابقتان فلا تُرى القفزة. */
            className={`flex items-center ${TONE[n % words.length]} ${
              animate ? "transition-opacity duration-200 ease-out" : ""
            } ${n === i ? "opacity-100" : "opacity-0"}`}
            style={{ height: `${LINE}em` }}
          >
            <Cell {...w} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** الكلمة وعلامتها — والعلامة تقع بعدها قراءةً، أي يسارها في RTL. */
function Cell({ word, emoji }: Word) {
  return (
    <>
      {word}
      {emoji ? (
        <span aria-hidden="true" className="ms-3 inline-block text-[0.66em]">
          {emoji}
        </span>
      ) : null}
    </>
  );
}
