import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RotatingWords } from "./_home/rotating-words";
import { SessionScene } from "./_home/session-scene";
import {
  HowItWorks,
  LandingFaq,
  Pricing,
  Proof,
  ThreePoints,
  TwoWayVoice,
} from "./_home/sections";
import {
  CaptureBand,
  Marked,
  PageShell,
  PrimaryButton,
  Section,
  SiteHeader,
} from "@/components/becan/kit";

/* الشاشة ٤ — اللاندينج.

   الفعل واحد في الصفحة كلها: «اختر مقررك مجانًا». يتكرّر كهرمانيًا في
   **أربعة مواضع**: الهيرو · البطاقة الرابعة في شبكة الجُمل · «كيف
   يعمل» · شريط الالتقاط. يخالف «زرّ كهرماني واحد لكل شاشة»، وهو
   انحراف معتمد بطلب صريح — والفعل واحد ونصّه واحد في كل مواضعه. */

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Landing" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  /** نصّ الفعل — مصدر واحد فلا يفترق بين موضعين. */
  const CTA = t("cta");

  const NAV = [
    { href: "#pricing", label: t("pricingNav") },
    { href: "#how", label: t("howNav") },
  ] as const;

  /* أربع طرق يذاكر بها الطالب اليوم ولا تنفعه — تتعاقب بعد
     «كفاية مذاكرة».

     ⚠️ الإيموجي **يخالف `CLAUDE.md`** («ممنوع: إيموجي») ومعيار القبول
     «صفر إيموجي» في بريف هذه المجموعة. أُضيف بطلب صريح 2026-08-23،
     ومسجَّل انحرافًا في docs/STATE.md.

     والمختار رمزيّ لا وجوه: الوجوه على مقاس 60px تسحب العين عن الكلمة
     وتُقرأ رسالةَ محادثة، والرمز يبقى علامةً بجانب الكلمة.

     موضعه بعد الكلمة في المصدر، فيقع يسارها في RTL — أي بعدها قراءةً. */
  const WRONG_WAYS = [
    { word: t("wrong"), emoji: "❌" },
    { word: t("unclear"), emoji: "❓" },
    { word: t("wasteful"), emoji: "⏳" },
    { word: t("distracting"), emoji: "🌀" },
  ] as const;

  return (
    <PageShell withFooter>
      <SiteHeader nav={NAV} loginAsButton />

      <main>
        {/* Hero — النصّ في بداية السطر ولمحة الجلسة في نهايته */}
        <Section className="pt-10 pb-12 md:pt-14 xl:pb-16">
          <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-12">
            <div>
              <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl xl:text-6xl">
                <span className="block">{t("heroTitle")}</span>
                <RotatingWords words={WRONG_WAYS} />
              </h1>

              {/* السطر التعريفي كان يذوب: 18px برماديّ ثانويّ تحت
                  عنوان متحرّك يسحب النظر كلّه. الآن اسم المنتج بوزن
                  العنوان ولونه، والوصف بعده مفصولًا بخطّ جوزيّ
                  رفيع — فيُقرأ سطرًا واحدًا لا حاشية. */}
              {/* المسحة هنا لا في العنوان: العنوان تكفيه ألوان
                  الكلمات المتعاقبة، والمسحة واحدة لكل شاشة. */}
              {/* المسحة تتجاوز كلمتها 12px من كل جانب، فتزحف على
                  الجارَين إن لم يُترك لها هامش. `mx-3` يعطيها مجالها
                  بلا تعديل المسحة نفسها — فهي مشتركة مع شاشات أخرى. */}
              <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xl md:text-2xl">
                <span className="font-display font-bold text-ink">{t("name")}</span>
                <span
                  aria-hidden="true"
                  className="h-6 w-px shrink-0 bg-warmth"
                />
                <span className="text-ink">
                  {t.rich("tutor", { word: (chunks) => <span className="mx-3 inline-block"><Marked>{chunks}</Marked></span> })}
                </span>
              </p>

              {/* الفعل الوحيد في الـHero */}
              <div className="mt-9">
                <PrimaryButton href="/courses" className="w-full sm:w-fit">
                  {CTA}
                </PrimaryButton>
              </div>
            </div>

            <SessionScene />
          </div>
        </Section>

        <ThreePoints cta={CTA} />
        <TwoWayVoice />
        <HowItWorks cta={CTA} />
        <Proof />
        <Pricing />
        <LandingFaq />

        <CaptureBand
          title={t("captureTitle")}
          body={t("captureBody")}
          cta={CTA}
          href="/courses"
        />
      </main>
    </PageShell>
  );
}
