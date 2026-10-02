import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DirectionProvider } from "@/components/direction-provider";
import messages from "../../messages/ar.json";
import { elMessiri, ibmPlexSansArabic } from "./fonts";
import LocaleNotFound from "./[locale]/not-found";
import "@/styles/globals.css";

/* الطلبات المستثناة من proxy قد تصل بلا لغة؛ تُعرض شاشة 404 بالعربية. */
export default function NotFound() {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${elMessiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground font-sans">
        <NextIntlClientProvider locale="ar" messages={messages}>
          <DirectionProvider>
            <LocaleNotFound />
          </DirectionProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
