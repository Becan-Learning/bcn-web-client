import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { elMessiri, ibmPlexSansArabic } from "@/app/fonts";
import { DirectionProvider } from "@/components/direction-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${ibmPlexSansArabic.variable} ${elMessiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground font-sans">
        <NextIntlClientProvider>
          <DirectionProvider>{children}</DirectionProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
